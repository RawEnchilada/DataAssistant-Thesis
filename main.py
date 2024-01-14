import argparse
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline, Seq2SeqTrainer, Seq2SeqTrainingArguments, PreTrainedTokenizer
from dataclasses import dataclass, field
from typing import Optional, Dict, Sequence
from torch.nn.utils.rnn import pad_sequence
from Levenshtein import distance
from datasets import Dataset
from bertviz import head_view, model_view
from flask import Flask, request, jsonify
import transformers
import datetime
import json
import os
import torch
import copy


@dataclass
class Arguments:
    action: str = field(
        default="train_and_evaluate",
        metadata={
            "choices":["train","evaluate","serve"],
            "help":"Action to perform (train, evaluate, serve)."
        }
    ),
    dtype: Optional[str] = field(
        default="float32",
        metadata={
            "choices":["float32","float16"],
            "help":"Datatype to train the model in."
        }
    )
    device: Optional[str] = field(
        default="cpu",
        metadata={
            "choices":["cpu","gpu"],
            "help":"Which device to use for training."
        }
    )

args = None

device_name = "cpu"

model = None
tokenizer = None
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
model_dir = "./model"
results_json = "./results.json"


def load_model(path,get_attention=False):
    model = AutoModelForCausalLM.from_pretrained(
        path,
        torch_dtype=(torch.float16 if args.dtype == "float16" else torch.float32),
        device_map="auto",
        output_attentions=get_attention
        )
    return model

def load_tokenizer():
    global model_name
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        padding_side="right"
        )
    tokenizer.pad_token="[PAD]"
    return tokenizer

def process_input(context,data):
    return (
        "<|im_start|>user\n"+
        "Use this database structure for creating a graphql query from the following question: "+
        context+
        "\n"+
        data+
        "<|im_end|>\n<|im_start|>assistant\n"
    )

def process_output(data):
    return (
        data+
        "<|im_end|></s>"
    )

def get_dataset(process=False,shuffle=False):
    print("Loading dataset from data/training_data.json...")
    dataset = Dataset.from_json("data/training_data.json")
    if(process):
        print("Processing dataset...")
        dataset = dataset.map(lambda r: {
            'input': process_input(r['context'],r['input']),
            'output': process_output(r['output'])
        })
        dataset = dataset.remove_columns(
            [col for col in dataset.column_names if col not in ['input', 'output']]
        )
        dataset = dataset.map(lambda x: {'length': len(x['input']) + len(x['output'])})
    
    if(shuffle):
        dataset = dataset.shuffle()
    dataset = dataset.with_format("torch", device=torch.device(device_name))

    return dataset

def clip_result(text):
    found_assistant = False
    extracted_text = []

    for line in text.split('\n'):
        if found_assistant:
            extracted_text.append(line)
        elif line.strip().lower() == 'assistant':
            found_assistant = True

    return '\n'.join(extracted_text)

def get_distance(s1, s2):
    return distance(s1,s2)

def save_results(dataset_size, evaluation_results):
    global results_json
    global model_name

    date = datetime.date.today().strftime('%Y-%m-%d')

    data = {
        "label":"",
        "datasetSize": dataset_size,
        "modelName": model_name,
        "distanceEvaluation": evaluation_results,
        "date": date
    }

    try:
        with open(results_json, 'r') as file:
            existing_data = json.load(file)
    except FileNotFoundError:
        existing_data = []

    existing_data.append(data)
    with open(results_json, 'w') as file:
        json.dump(existing_data, file, indent=2)

IGNORE_INDEX=-100

@dataclass
class DataCollatorForCausalLM(object):
    tokenizer: PreTrainedTokenizer
    source_max_len: int
    target_max_len: int
    train_on_source: bool
    predict_with_generate: bool

    def __call__(self, instances: Sequence[Dict]) -> Dict[str, torch.Tensor]:
        # Extract elements
        sources = [f"{self.tokenizer.bos_token}{example['input']}" for example in instances]
        targets = [f"{example['output']}{self.tokenizer.eos_token}" for example in instances]
        # Tokenize
        tokenized_sources_with_prompt = self.tokenizer(
            sources,
            max_length=self.source_max_len,
            truncation=True,
            add_special_tokens=False,
        )
        tokenized_targets = self.tokenizer(
            targets,
            max_length=self.target_max_len,
            truncation=True,
            add_special_tokens=False,
        )
        # Build the input and labels for causal LM
        input_ids = []
        labels = []
        for tokenized_source, tokenized_target in zip(
            tokenized_sources_with_prompt['input_ids'],
            tokenized_targets['input_ids']
        ):
            if not self.predict_with_generate:
                input_ids.append(torch.tensor(tokenized_source + tokenized_target))
                if not self.train_on_source:
                    labels.append(
                        torch.tensor([IGNORE_INDEX for _ in range(len(tokenized_source))] + copy.deepcopy(tokenized_target))
                    )
                else:
                    labels.append(torch.tensor(copy.deepcopy(tokenized_source + tokenized_target)))
            else:
                input_ids.append(torch.tensor(tokenized_source))
        # Apply padding
        input_ids = pad_sequence(input_ids, batch_first=True, padding_value=self.tokenizer.pad_token_id)
        labels = pad_sequence(labels, batch_first=True, padding_value=IGNORE_INDEX) if not self.predict_with_generate else None
        data_dict = {
            'input_ids': input_ids,
            'attention_mask':input_ids.ne(self.tokenizer.pad_token_id),
        }
        if labels is not None:
            data_dict['labels'] = labels
        return data_dict



def train():
    global model
    global tokenizer
    global model_name
    global device_name
    global model_dir

    print("Using "+device_name+" for training")

    print("Preparing model "+model_name+"...")
    model = load_model(model_name).to(device_name)
    tokenizer = load_tokenizer()
    dataset = get_dataset(process=True,shuffle=True)

    data_collator = DataCollatorForCausalLM(
            tokenizer=tokenizer,
            source_max_len=1024,
            target_max_len=256,
            train_on_source=False,
            predict_with_generate=False
    )

    training_args = Seq2SeqTrainingArguments(
        output_dir=model_dir,
        #optim="adamw_torch",
        per_device_train_batch_size=16,
        gradient_accumulation_steps=1,
        gradient_checkpointing=True,
        save_strategy='steps',
        save_steps=250,
        save_total_limit=40,
        lr_scheduler_type='constant',
        remove_unused_columns=False,
        max_grad_norm=0.3,
        max_steps=10,
        num_train_epochs=3,
        learning_rate=2e-5,
        do_train=True
    )

    

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        tokenizer=tokenizer,
        train_dataset=dataset,
        eval_dataset=dataset,
        data_collator=data_collator
    )

    print("Training started...")
    trainer.train()

    trainer.save_model()

def evaluate():    
    global model
    global tokenizer
    global model_dir

    if(model is None):
        model = load_model(model_dir)
    if(tokenizer is None):
        tokenizer = load_tokenizer()
    
    dataset = get_dataset(process=False,shuffle=True)
    dataset_size = len(dataset['input'])

    count = 10
    total_distance = 0

    for i in range(0,count):
        context = dataset['context'][i]
        input_text = dataset['input'][i]
        expected_output = dataset['output'][i]
        message = process_input(context,input_text)

        # Generate a response from the model
        input_ids = tokenizer.encode(message, return_tensors="pt")
        with tokenizer.as_target_tokenizer():
            response = model.generate(input_ids, num_return_sequences=1)[0]

        full_response = tokenizer.decode(response, skip_special_tokens=True)
        response = clip_result(full_response)

        distance = get_distance(expected_output, response)

        print("---------------------------------------")
        print(f"Input: {input_text}")
        print(f"Expected Output: {expected_output}")
        print(f"Model Response: {response}")
        print(f"Distance Score (lower is better): {distance}")
        print()
        total_distance += distance

    average_distance = total_distance / count
    print(f"Average Distance Score: {average_distance}")
    save_results(dataset_size,average_distance)

def visualise():
    global model
    global tokenizer
    global model_dir

    if(model is None):
        model = load_model(model_dir,True)
    if(tokenizer is None):
        tokenizer = load_tokenizer()

    dataset = get_dataset(process=False,shuffle=False)
    row = 500

    context = dataset['context'][row]
    input_text = dataset['input'][row]
    desired_output = dataset['output'][row]
    message = process_input(context,input_text)
    inputs = tokenizer.encode(message, return_tensors='pt').to(device_name)

    outputs = model(inputs)
    attention = outputs[-1]
    tokens = tokenizer.convert_ids_to_tokens(inputs[0])
    modelview = model_view(attention, tokens, html_action='return', include_layers=[1,2,21])
    headview = head_view(attention, tokens, html_action='return')    

    output_query = model.generate(inputs, max_length=50, num_return_sequences=1)
    actual_output = clip_result(tokenizer.decode(output_query[0], skip_special_tokens=True))
    print(f"Input: {message}")
    print(f"Desired output: {desired_output}")
    print(f"Actual output: {actual_output}")

    with open("./head_view.html", 'w') as file:
        file.write(headview.data)
    with open("./model_view.html", 'w') as file:
        file.write(modelview.data)

def serve():
    global model
    global tokenizer
    global model_dir

    app = Flask(__name__)
    if(model is None):
        model = load_model(model_dir)
    if(tokenizer is None):
        tokenizer = load_tokenizer()

    @app.route("/chat", methods=["POST"])
    def chat():
        try:
            data = request.get_json()
            if "message" not in data:
                return jsonify({"error": "Missing 'message' parameter"}), 400
            if "context" not in data:
                return jsonify({"error": "Missing 'context' parameter"}), 400

            message = process_input(data['context'],data["message"])

            # Generate a response from the model
            input_ids = tokenizer.encode(message, return_tensors="pt").to(device_name)
            with tokenizer.as_target_tokenizer():
                response = model.generate(input_ids, max_length=50, num_return_sequences=1)[0]

            response_text = tokenizer.decode(response, skip_special_tokens=True)

            return jsonify({"response": clip_result(response_text)})

        except Exception as e:
            return jsonify({"error": str(e)}), 500
    app.run(host="0.0.0.0", port=4200)
    


def main():
    global device_name
    global args
    hfparser = transformers.HfArgumentParser([Arguments])
    args = hfparser.parse_args_into_dataclasses(return_remaining_strings=True)[0]
    
    if(torch.cuda.is_available() and args.device == "gpu"):
        device_name = "cuda:0"
        torch.cuda.set_device(0)
    torch.set_default_device(device_name)

    if(args.dtype == "float16"):
        torch.set_default_dtype(torch.float16)
    else:
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.set_default_dtype(torch.float32)

    if args.action == "train":
        train()
    elif args.action == "evaluate":
        evaluate()
    elif args.action == "serve":
        serve()
    elif args.action == "visualise":
        visualise()
    else:
        print("Training then evaluating model.")
        train()
        evaluate()

if __name__ == "__main__":
    main()
