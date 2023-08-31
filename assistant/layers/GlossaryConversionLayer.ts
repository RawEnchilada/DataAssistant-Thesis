import ILayer from '../interfaces/ILayer';
import Tokenizer from '../tokens/Tokenizer';

/**
 * @input string
 * @output string
 */
export default class GlossaryConversionLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }


    process(input: string): string {
        let input_string = input;
        const looking_for = Object.keys(this.tokenizer.glossaryTokenHandler.keyMap).sort((a,b)=>(b.length-a.length));
        for (const key of looking_for) {
            const pattern = '\\b' + key.replace('+', '\\+') + '\\b';
            const replacement = key.replace(' ', '_');
            input_string = input_string.replace(new RegExp(pattern, 'g'), replacement);
        }
        return input_string;
    }
}
