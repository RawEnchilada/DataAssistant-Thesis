import Token from '../tokens/Token'; // Import Token and TokenType classes
import TokenType from '../tokens/TokenType'; // Import Token and TokenType classes
import ITokenHandler from '../interfaces/ITokenHandler'; // Import ITokenHandler interface
import TokenDecodeException from '../exceptions/TokenDecodeException';
import TokenEncodeException from '../exceptions/TokenEncodeException';

export class GlossaryTokenHandler implements ITokenHandler {
    private _priority: number;
    private classList: Set<string>;
    private keyMap: Record<string, number>;
    private tokenMap: Record<string, number>;

    constructor(priority: number, classList: Set<string>, keyMap: Record<string, number>) {
        this._priority = priority;
        this.classList = classList;
        this.keyMap = keyMap;

        this.tokenMap = {};
        for (const key of Object.keys(keyMap)) {
            this.tokenMap[key.replace(" ", "_")] = this.keyMap[key];
        }
    }

    get priority(): number {
        return this._priority;
    }

    set priority(value: number) {
        this._priority = value;
    }

    get size(): number {
        return this.classList.size + Object.keys(this.keyMap).length;
    }

    get utilizedSize(): number {
        return this.size;
    }

    get keyCount(): number {
        return Object.keys(this.keyMap).length;
    }

    get mutable(): boolean {
        return false;
    }

    canEncode(word: string): boolean {
        return this.classList.has(word) || Object.keys(this.tokenMap).includes(word);
    }

    encode(word: string): Token {
        if (this.classList.has(word)) {
            let classListIndex = 0;
            for (const _class of this.classList) {
                if (_class === word) {
                    break;
                }
                classListIndex++;
            }
            return new Token(classListIndex, TokenType.CLASS);
        } else if (Object.keys(this.tokenMap).includes(word)) {
            const cid = this.tokenMap[word];
            return new Token(cid, TokenType.KEY);
        } else {
            throw new TokenEncodeException(this, word);
        }
    }

    decode(token: Token): string {
        if (token.value < this.classList.size) {
            return Array.from(this.classList)[token.value];
        } else if (token.value < this.classList.size + Object.keys(this.keyMap).length) {
            const keys = Object.keys(this.keyMap);
            return keys[token.value - this.classList.size];
        } else {
            throw new TokenDecodeException();
        }
    }

    resetState(): void {
        // Implement resetState if needed
    }

    serialize(path: string): void {
        const file = `${path}/glossary_tokens.layer`;
        const content = `GlossaryTokenHandler\n${this.classList.size}\n${[...this.classList].join('\n')}\n${Object.keys(this.keyMap).length}\n`;
        
        for (const key of Object.keys(this.keyMap)) {
            content += `${key}\n${this.keyMap[key]}\n`;
        }

        // Write content to the file
    }

    deserialize(path: string): void {
        const file = `${path}/glossary_tokens.layer`;
        // Read the file and deserialize the content
    }
}
