import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as np from 'numpy'; // You need to install a JavaScript numpy package if available
import { GlossaryConversionLayer } from '.../layers/GlossaryConversionLayer';
import { LayerCargo } from '.../layers/LayerCargo';
import { PromptPreparationLayer } from '.../layers/PromptPreparationLayer';
import { Tokenizer } from './path_to_tokenizer'; // Import your Tokenizer class path here

export default class QueryDatasetCreator {
    private prompt_size: number;
    private memory_size: number;
    private tokenizer: Tokenizer;

    constructor(prompt_size: number, memory_size: number, tokenizer: Tokenizer) {
        this.prompt_size = prompt_size;
        this.memory_size = memory_size;
        this.tokenizer = tokenizer;
    }

    load(data_source_path: string, converted_path: string): void {
        const output_size: number = this.tokenizer.labelCount;
        const inputs: any[] = [];
        const outputs: any[] = [];
        const empty_token_id: number = this.tokenizer.handlerOffset(this.tokenizer.emptyTokenHandler);
        const glossary_conversion_layer: GlossaryConversionLayer = new GlossaryConversionLayer(this.tokenizer);
        const prompt_preparation_layer: PromptPreparationLayer = new PromptPreparationLayer(this.prompt_size);

        let largest_prompt_size: number = 0;
        fs.createReadStream(data_source_path)
            .pipe(csv({ delimiter: ';' }))
            .on('data', (row: any) => {
                this.tokenizer.resetState();
                const prompt: string = row[0];
                const full_query: string = row[1];
                let cargo: LayerCargo = new LayerCargo(prompt);
                cargo = glossary_conversion_layer.process(cargo);
                let prepared_prompt: LayerCargo = prompt_preparation_layer.process(cargo);
                prepared_prompt = prepared_prompt.take();
                const prompt_tokens = this.tokenizer.encode(prepared_prompt);

                if (prompt_tokens.tokens.length > this.prompt_size) {
                    throw new Error(`Prompt size is larger than the input layer of the model! :${prompt_tokens.tokens.length}`);
                }
                const prompt_without_padding = prompt_tokens.tokens.filter((t: number) => t !== empty_token_id);
                if (prompt_without_padding.length > largest_prompt_size) {
                    largest_prompt_size = prompt_without_padding.length;
                }

                let prepared_query: LayerCargo = glossary_conversion_layer.process(cargo.put(full_query));
                prepared_query = prompt_preparation_layer.process(prepared_query);
                prepared_query = prepared_query.take();
                const full_query_tokens = this.tokenizer.encode(prepared_query);

                for (let i = 0; i < full_query_tokens.tokens.length; i++) {
                    if (full_query_tokens.tokens[i] === empty_token_id) {
                        continue;
                    }

                    const sub_query_tokens = full_query_tokens.slice(0, i);
                    let input_tokens = sub_query_tokens.lastN(this.memory_size, empty_token_id);
                    input_tokens = input_tokens.append(prompt_tokens);
                    const input_array = input_tokens.normalizeTokens(this.tokenizer.maxSize);
                    inputs.push(input_array);

                    const output_array = np.zeros(output_size, 'float32');
                    output_array[full_query_tokens.tokens[i]] = 1.0;
                    outputs.push(output_array);
                }
            })
            .on('end', () => {
                console.log(`Generated ${inputs.length} rows of training data, with ${inputs[0].length} input tokens and largest prompt size: ${largest_prompt_size}`);
                const fileStream = fs.createWriteStream(converted_path);
                const writer = csv.write({ delimiter: ';' });

                writer.pipe(fileStream);
                writer.write(['inputs', 'labels']);

                for (let i = 0; i < inputs.length; i++) {
                    writer.write([inputs[i], outputs[i].tolist()]);
                }

                writer.end();
            });
    }
}
