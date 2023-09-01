import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import GlossaryConversionLayer from '../layers/GlossaryConversionLayer';
import PromptPreparationLayer from '../layers/PromptPreparationLayer';
import Tokenizer from '../tokens/Tokenizer';
import path from 'path';

export default class QueryDatasetCreator {
    private prompt_size: number;
    private memory_size: number;
    private tokenizer: Tokenizer;

    constructor(prompt_size: number, memory_size: number, tokenizer: Tokenizer) {
        this.prompt_size = prompt_size;
        this.memory_size = memory_size;
        this.tokenizer = tokenizer;
    }

    async load(data_source_path: string, converted_path: string): Promise<void> {
        const output_size: number = this.tokenizer.labelCount;
        const inputs: Array<Array<number>> = [];
        const outputs: Array<Array<number>> = [];
        const empty_token_id: number = this.tokenizer.emptyTokenHandler.emptyToken;
        const glossary_conversion_layer: GlossaryConversionLayer = new GlossaryConversionLayer(this.tokenizer);
        const prompt_preparation_layer: PromptPreparationLayer = new PromptPreparationLayer(this.prompt_size);

        let largest_prompt_size: number = 0;

        if(!data_source_path.includes("file://")) data_source_path = "file://" + data_source_path; 
        const data = tf.data.csv(data_source_path, {delimiter: ';'});

        try{
        await (data.forEachAsync((row)=>{
            this.tokenizer.resetState();
            const prompt: string = row['question'];
            const full_query: string = row['query'];

            const converted_prompt = glossary_conversion_layer.process(prompt);
            const prepared_prompt = prompt_preparation_layer.process(converted_prompt);
            const prompt_tokens = this.tokenizer.encode(prepared_prompt);

            if (prompt_tokens.tokens.length > this.prompt_size) {
                throw new Error(`Prompt size is larger than the input layer of the model! :${prompt_tokens.tokens.length}`);
            }
            const prompt_without_padding = prompt_tokens.tokens.filter((t: number) => t !== empty_token_id);
            if (prompt_without_padding.length > largest_prompt_size) {
                largest_prompt_size = prompt_without_padding.length;
            }

            const converted_query = glossary_conversion_layer.process(full_query);
            const prepared_query = prompt_preparation_layer.process(converted_query);
            const full_query_tokens = this.tokenizer.encode(prepared_query);

            for (let i = 0; i < full_query_tokens.tokens.length; i++) {
                if (full_query_tokens.tokens[i] === empty_token_id) {
                    continue;
                }
                if(full_query_tokens.tokens[i] > output_size){
                    throw new Error(`Token size is larger than the count of possible labels (${output_size}) of the model! :${full_query_tokens.tokens[i]}\n    Processed query: ${prepared_query}\n    Encoded query: ${full_query_tokens.tokens}`);
                }

                const sub_query_tokens = full_query_tokens.slice(0, i);
                let input_tokens = sub_query_tokens.lastN(this.memory_size, empty_token_id);
                input_tokens = input_tokens.append(prompt_tokens);
                const input_array = input_tokens.normalizeTokens(this.tokenizer.maxSize);
                inputs.push(input_array.tokens);
                

                const output_array: Array<number> = Array(output_size).fill(0.0);
                output_array[full_query_tokens.tokens[i]] = 1.0;
                outputs.push(output_array);
            }
        }));
        }catch(e){
            throw e;
        }
        
        let csv = "tokens;labels\n";
        if(inputs.length !== outputs.length) {
            throw new Error(`Number of inputs (${inputs.length}) does not match number of outputs (${outputs.length})`);
        }

        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const output = outputs[i];
            csv += `${JSON.stringify(input)};${JSON.stringify(output)}\n`;
        }

        if (!fs.existsSync(path.dirname(converted_path))) {
            fs.mkdirSync(path.dirname(converted_path));
        }
        fs.writeFileSync(converted_path, csv);       
        
        console.log(`Generated ${inputs.length} rows of training data, with ${inputs[0].length} input tokens and largest prompt size: ${largest_prompt_size}`);
    }
}
