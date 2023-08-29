import ILayer from '../interfaces/ILayer';
import TokenSeries from '../tokens/TokenSeries';
import Tokenizer from '../tokens/Tokenizer';

/**
 * @input TokenSeries
 * @output string[]
 */
export default class DeTokenizationLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    process(input: TokenSeries): string[] {
        const query: string[] = this.tokenizer.decode(input);
        return query;
    }
}
