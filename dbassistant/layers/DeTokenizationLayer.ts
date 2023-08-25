import ILayer from '../interfaces/ILayer';
import TokenSeries from '../tokens/TokenSeries';
import Tokenizer from '../tokens/Tokenizer';
import LayerCargo from './LayerCargo';

export default class DeTokenizationLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    process(cargo: LayerCargo): LayerCargo {
        const output: TokenSeries = cargo.take();
        if (!(output instanceof TokenSeries)) {
            throw new Error('Output is not of type TokenSeries');
        }
        const query: string = this.tokenizer.decode(output);
        cargo.put(query);
        return cargo;
    }
}
