import ILayer from '../interfaces/ILayer';
import LayerCargo from '../layers/LayerCargo';
import Tokenizer from '../tokens/Tokenizer';

export default class GlossaryConversionLayer implements ILayer {
    private tokenizer: Tokenizer;

    constructor(tokenizer: Tokenizer) {
        this.tokenizer = tokenizer;
    }

    process(cargo: LayerCargo): LayerCargo {
        let input_string = cargo.take();
        if (typeof input_string !== 'string') {
            throw new Error('Input cargo should be a string.');
        }

        const looking_for = Object.keys(this.tokenizer.glossaryTokenHandler.keyMap);
        for (const key of looking_for) {
            const pattern = '\\b' + key.replace('+', '\\+') + '\\b';
            const replacement = key.replace(' ', '_');
            input_string = input_string.replace(new RegExp(pattern, 'g'), replacement);
        }

        cargo.put(input_string);
        return cargo;
    }
}
