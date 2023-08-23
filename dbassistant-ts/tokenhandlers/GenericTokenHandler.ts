import { ITokenHandler } from "../interfaces/ITokenHandler";
import { TokenEncodeException } from "../exceptions/TokenEncodeException";
import { TokenDecodeException } from "../exceptions/TokenDecodeException";
import { ArgumentHandlerFullException } from "../exceptions/ArgumentHandlerFullException";
import { GenericHandlerFullException } from "../exceptions/GenericHandlerFullException";
import { ImmutableHandlerException } from "../exceptions/ImmutableHandlerException";
import { Token } from "../tokens/Token";
import { TokenType } from "../tokens/TokenType";
import { ITokenHandlerDeserializer } from "../interfaces/ITokenHandlerDeserializer";

export class GenericTokenHandler implements ITokenHandler {

    private _mutable = true;
    public words: string[];

    constructor(private _priority:number,maxTokenCount:number) {
        this.words = new Array<string>(maxTokenCount);
    }

    get priority(): number {
        return this._priority;
    }

    get learnedTokens(): string[]{
        return structuredClone(this.words);
    }

    get size(): number {
        return this.words.length;
    }

    get utilizedSize(): number {
        return this.words.filter(w => w !== "").length;
    }

    get mutable(): boolean {
        return this._mutable;
    }

    canEncode(word: string): boolean {
        return true;
    }

    encode(word: string): Token {
        let index = this.words.indexOf(word);
        if (index === -1) {
            if(this.mutable) {
                let emptyIndex = this.words.indexOf("");
                if (emptyIndex >= -1) {
                    this.words[emptyIndex] = word;
                    index = emptyIndex;
                    return new Token(index, TokenType.GENERIC);
                } else {
                    throw new GenericHandlerFullException();
                }
            } else {
                throw new ImmutableHandlerException();
            }
        } else {
            return new Token(index, TokenType.GENERIC);
        }
    }

    decode(token: number): string {
        if (token < this.words.length) {
            return this.words[token];
        } else {
            throw new TokenDecodeException(this,token);
        }
    }

    resetState(): void {
        // do nothing
    }

    serialize(): string {
        return `GenericTokenHandler\t${this.priority}\t${this.words.join(',')}`;
    }


}

export class GenericTokenHandlerDeserializer implements ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean{
        return serialized.split("\t")[0] === "GenericTokenHandler";
    }

    deserialize(serialized: string): GenericTokenHandler {
        const [type, priority, serializedWords] = serialized.split("\t");
        const words = serializedWords.split(",");
        const size = words.length;
        try{
            let handler = new GenericTokenHandler(parseInt(priority),size);
            handler.words = words;
            return handler;
        } catch(e) {
            throw new Error(`Failed to deserialize ${serialized} into an GenericTokenHandler. Is the correct handler type serialized?\nError: ${e}`);
        }
    }
}