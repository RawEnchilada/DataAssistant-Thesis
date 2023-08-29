import Token from '../tokens/Token'; // Import Token and TokenType classes
import TokenType from '../tokens/TokenType'; // Import Token and TokenType classes
import ITokenHandler from '../interfaces/ITokenHandler'; // Import ITokenHandler interface
import ITokenHandlerDeserializer from "../interfaces/ITokenHandlerDeserializer";
import TokenDecodeException from '../exceptions/TokenDecodeException';
import TokenEncodeException from '../exceptions/TokenEncodeException';

export class GlossaryTokenHandler implements ITokenHandler {
    private _priority: number;
    private _classList: Set<string>;
    private _keyMap: Map<string, number>; public get keyMap(): Map<string,number> { return this._keyMap; }
    private _tokenMap: Map<string, number>;

    constructor(priority: number, classList: Set<string>, keyMap: Map<string, number>) {
        this._priority = priority;
        this._classList = classList;
        this._keyMap = keyMap;

        this._tokenMap = new Map<string, number>();
        for (const key of Object.keys(keyMap)) {
            this._tokenMap[key.replace(" ", "_")] = this._keyMap[key];
        }
    }

    get priority(): number {
        return this._priority;
    }

    set priority(value: number) {
        this._priority = value;
    }

    get size(): number {
        return this._classList.size + Object.keys(this._keyMap).length;
    }

    get utilizedSize(): number {
        return this.size;
    }

    get keyCount(): number {
        return Object.keys(this._keyMap).length;
    }

    get mutable(): boolean {
        return false;
    }

    canEncode(word: string): boolean {
        return this._classList.has(word) || Object.keys(this._tokenMap).includes(word);
    }

    encode(word: string): Token {
        if (this._classList.has(word)) {
            let classListIndex = 0;
            for (const _class of this._classList) {
                if (_class === word) {
                    break;
                }
                classListIndex++;
            }
            return new Token(classListIndex, TokenType.CLASS);
        } else if (Object.keys(this._tokenMap).includes(word)) {
            const cid = this._tokenMap[word];
            return new Token(cid, TokenType.KEY);
        } else {
            throw new TokenEncodeException(this, word);
        }
    }

    decode(token: number): string {
        if (token < this._classList.size) {
            return Array.from(this._classList)[token];
        } else if (token < this._classList.size + Object.keys(this._keyMap).length) {
            const keys = Object.keys(this._keyMap);
            return keys[token - this._classList.size];
        } else {
            throw new TokenDecodeException(this, token);
        }
    }

    resetState(): void {
        // Implement resetState if needed
    }

    serialize(): string {
        let serialized = `GlossaryTokenHandler\t${this._priority}\t${Array.from(this._classList).join(',')}\t`;
        for (const key of Object.keys(this._keyMap)) {
            serialized += `${key}:${this._keyMap[key]},`;
        }
        serialized = serialized.substring(0, serialized.length - 1);
        return serialized;
    }
}


export class GlossaryTokenHandlerDeserializer implements ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean{
        return serialized.split("\t")[0] === "GlossaryTokenHandler";
    }
    deserialize(serialized: string): GlossaryTokenHandler {
        const [type, priority, classListStr, keyMapStr] = serialized.split("\t");
        try{
            let classList = new Set<string>();
            for (const classStr of classListStr.split(",")) {
                classList.add(classStr);
            }
            let keyMap = new Map<string, number>();
            for (const keyStr of keyMapStr.split(",")) {
                const [key, cid] = keyStr.split(":");
                keyMap.set(key, parseInt(cid));
            }
            return new GlossaryTokenHandler(parseInt(priority),classList,keyMap);
        } catch(e) {
            throw new Error(`Failed to deserialize ${serialized} into a GlossaryTokenHandler. Is the correct handler type serialized?\nError: ${e}`);
        }
    }
}