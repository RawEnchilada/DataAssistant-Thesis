import ILayer from '../interfaces/ILayer';
import Tokenizer from '../tokens/Tokenizer';
import LayerCargo from './LayerCargo';

export default class EnTokenizationLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    process(cargo: LayerCargo): LayerCargo {
        const input_data = cargo.take();
        const input_list: string[] = Array.from(input_data);
        if (typeof input_list[0] !== 'string') {
            throw new Error('Input data should be an array of strings.');
        }
        this.tokenizer.resetState();
        const tokens = this.tokenizer.encode(input_list);
        cargo.put(tokens);
        return cargo;
    }
}
