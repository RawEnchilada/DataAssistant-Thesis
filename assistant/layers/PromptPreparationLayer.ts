import ILayer from '../interfaces/ILayer';
import Tokenizer from '../tokens/Tokenizer';


/**
 * @input string
 * @output string[]
 */
export default class PromptPreparationLayer implements ILayer {
    private promptSize: number;

    constructor(promptSize: number) {
        this.promptSize = promptSize;
    }
    
    process(inputString: string): string[] {
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
        return symbols;
    }
}

