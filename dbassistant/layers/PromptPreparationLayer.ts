import ILayer from '../interfaces/ILayer';
import LayerCargo from '../layers/LayerCargo';
import Tokenizer from '../tokens/Tokenizer';

export default class PromptPreparationLayer implements ILayer {
    private promptSize: number;

    constructor(promptSize: number) {
        this.promptSize = promptSize;
    }

    process(cargo: LayerCargo): LayerCargo {
        const inputString = cargo.take();
        if (typeof inputString !== 'string') {
            throw new Error('Input cargo should be a string.');
        }

        const specialCharacter = /[^A-z0-9 _@]/;
        let spaced = "";
        for (const char of inputString) {
            if (specialCharacter.test(char)) {
                spaced += " " + char + " ";
            } else {
                spaced += char;
            }
        }
        spaced = spaced.replace(/ +/g, ' ');
        const symbols = spaced.split(" ").filter(symbol => symbol !== "");

        symbols.push("[END]");

        cargo.put(symbols);
        return cargo;
    }
}

