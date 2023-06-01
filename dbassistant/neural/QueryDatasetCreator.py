import csv
import numpy as np
from dbassistant.layers.GlossaryConversionLayer import GlossaryConversionLayer
from dbassistant.layers.LayerCargo import LayerCargo

from dbassistant.layers.PromptPreparationLayer import PromptPreparationLayer


class QueryDatasetCreator:
    def __init__(self, prompt_size, memory_size, tokenizer):
        self.prompt_size = prompt_size
        self.memory_size = memory_size
        self.tokenizer = tokenizer

    def load(self, data_source_path, converted_path):
        output_size = self.tokenizer.labelCount
        inputs = []
        outputs = []
        empty_token_id = self.tokenizer.handlerOffset(self.tokenizer.emptyTokenHandler)
        glossary_conversion_layer = GlossaryConversionLayer(self.tokenizer)
        prompt_preparation_layer = PromptPreparationLayer(self.prompt_size)

        largest_prompt_size = 0
        with open(data_source_path, 'r') as file:
            csv_reader = csv.reader(file, delimiter=';')
            for row in csv_reader:
                self.tokenizer.resetState()
                prompt, full_query = row
                cargo = LayerCargo(prompt)
                cargo = glossary_conversion_layer.process(cargo)
                prepared_prompt = prompt_preparation_layer.process(cargo)
                prepared_prompt = prepared_prompt.take()
                prompt_tokens = self.tokenizer.encode(prepared_prompt)

                if len(prompt_tokens.tokens) > self.prompt_size:
                    raise Exception(f"Prompt size is larger than the input layer of the model! "
                                    f":{len(prompt_tokens.tokens)}")
                prompt_without_padding = [t for t in prompt_tokens.tokens if t != empty_token_id]
                if len(prompt_without_padding) > largest_prompt_size:
                    largest_prompt_size = len(prompt_without_padding)

                prepared_query = glossary_conversion_layer.process(cargo.put(full_query))
                prepared_query = prompt_preparation_layer.process(prepared_query)
                prepared_query = prepared_query.take()
                full_query_tokens = self.tokenizer.encode(prepared_query)

                for i in range(len(full_query_tokens.tokens)):
                    if full_query_tokens.tokens[i] == empty_token_id:
                        continue

                    sub_query_tokens = full_query_tokens.slice(0, i)
                    input_tokens = sub_query_tokens.lastN(self.memory_size, empty_token_id)
                    input_tokens = input_tokens.append(prompt_tokens)
                    input_array = input_tokens.normalizeTokens(self.tokenizer.maxSize)
                    inputs.append(input_array)
                    
                    output_array = np.zeros(output_size, dtype=np.float32)
                    output_array[full_query_tokens.tokens[i]] = 1.0
                    outputs.append(output_array)

        print(f"Generated {len(inputs)} rows of training data, with {len(inputs[0])} input tokens and "
              f"largest prompt size: {largest_prompt_size}")

        with open(converted_path, 'w') as file:
            writer = csv.writer(file, delimiter=';')
            writer.writerow(['inputs', 'labels'])
            for i in range(len(inputs)):
                writer.writerow([inputs[i], outputs[i].tolist()])

