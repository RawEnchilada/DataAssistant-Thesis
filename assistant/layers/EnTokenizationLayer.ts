import ILayer from '../interfaces/ILayer';
import TokenSeries from '../tokens/TokenSeries';
import Tokenizer from '../tokens/Tokenizer';

/**
 * @input string[]
 * @output TokenSeries
 */
export default class EnTokenizationLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }


    process(input: string[]): TokenSeries {
        this.tokenizer.resetState();
        const tokens = this.tokenizer.encode(input);
        
        return tokens;
    }
}
