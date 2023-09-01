import ITokenHandler from "../interfaces/ITokenHandler";
import TokenEncodeException from "../exceptions/TokenEncodeException";
import TokenDecodeException from "../exceptions/TokenDecodeException";
import Token from "../tokens/Token";
import TokenType from "../tokens/TokenType";
import ITokenHandlerDeserializer from "../interfaces/ITokenHandlerDeserializer";

export class EndTokenHandler implements ITokenHandler {

    public endToken = 0;
    private _priority:number;

    constructor(priority:number) {
        this._priority = priority;
    }

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
        return word === "[END]";
    }

    encode(word: string): Token {
        if (this.canEncode(word)) {
            return new Token(this.endToken, TokenType.END);
        } else {
            throw new TokenEncodeException(this,word);
        }
    }

    decode(token: number): string {
        if (token === this.endToken) {
            return "[END]";
        } else {
            throw new TokenDecodeException(this,token);
        }
    }

    resetState(): void {
        // Do nothing
    }

    serialize(): string {
        return `EndTokenHandler\t${this.priority}`;
    }

}

export class EndTokenHandlerDeserializer implements ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean{
        return serialized.split("\t")[0] === "EndTokenHandler";
    }
    deserialize(serialized: string): EndTokenHandler {
        const [type, priority] = serialized.split("\t");
        try {
            return new EndTokenHandler(parseInt(priority));
        } catch(e) {
            throw new Error(`Failed to deserialize ${serialized} into an EndTokenHandler. Is the correct handler type serialized?\nError: ${e}`);
        }
    }
}