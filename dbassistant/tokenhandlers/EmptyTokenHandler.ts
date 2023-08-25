import ITokenHandler from "../interfaces/ITokenHandler";
import TokenEncodeException from "../exceptions/TokenEncodeException";
import TokenDecodeException from "../exceptions/TokenDecodeException";
import Token from "../tokens/Token";
import TokenType from "../tokens/TokenType";
import ITokenHandlerDeserializer from "../interfaces/ITokenHandlerDeserializer";

export class EmptyTokenHandler implements ITokenHandler {

    public emptyToken = 1;

    constructor(private _priority:number) {}

    get priority(): number {
        return this._priority;
    }

    get size(): number {
        return 1;
    }

    get utilizedSize(): number {
        return 1;
    }

    get mutable(): boolean {
        return false;
    }

    canEncode(word: string): boolean {
        return word === "_";
    }

    encode(word: string): Token {
        if (this.canEncode(word)) {
            return new Token(this.emptyToken, TokenType.EMPTY);
        } else {
            throw new TokenEncodeException(this,word);
        }
    }

    decode(token: number): string {
        if (token === this.emptyToken) {
            return "_";
        } else {
            throw new TokenDecodeException(this,token);
        }
    }

    resetState(): void {
        // Do nothing
    }

    serialize(): string {
        return `EmptyTokenHandler\t${this.priority}`;
    }

}

export class EmptyTokenHandlerDeserializer implements ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean{
        return serialized.split("\t")[0] === "EmptyTokenHandler";
    }
    deserialize(serialized: string): EmptyTokenHandler {
        const [type, priority] = serialized.split("\t");
        try {
            return new EmptyTokenHandler(parseInt(priority));
        } catch(e) {
            throw new Error(`Failed to deserialize ${serialized} into an EmptyTokenHandler. Is the correct handler type serialized?\nError: ${e}`);
        }
    }
}