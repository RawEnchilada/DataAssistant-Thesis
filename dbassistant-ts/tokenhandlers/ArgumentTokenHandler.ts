import { ITokenHandler } from "../interfaces/ITokenHandler";
import { TokenEncodeException } from "../exceptions/TokenEncodeException";
import { TokenDecodeException } from "../exceptions/TokenDecodeException";
import { ArgumentHandlerFullException } from "../exceptions/ArgumentHandlerFullException";
import { Token } from "../tokens/Token";
import { TokenType } from "../tokens/TokenType";
import { ITokenHandlerDeserializer } from "../interfaces/ITokenHandlerDeserializer";

export class ArgumentTokenHandler implements ITokenHandler {

    public arguments: string[];

    constructor(private _priority:number,maxArgumentCount:number) {
        this.arguments = new Array<string>(maxArgumentCount);
    }

    get priority(): number {
        return this._priority;
    }

    get size(): number {
        return this.arguments.length;
    }

    get utilizedSize(): number {
        return this.size; // Returning full size because arguments are reset after each evaluation.
    }

    get mutable(): boolean {
        return true;
    }

    canEncode(word: string): boolean {
        return this.arguments.includes(word);
    }

    encode(word: string): Token {
        if (!this.canEncode(word)) {
            this.store(word);
        }
        return new Token(TokenType.ARGUMENT, this.arguments.indexOf(word));
    }

    decode(token: number): string {
        if(token < 0 || token >= this.arguments.length) {
            throw new TokenDecodeException(this,token);
        } else {
            return this.arguments[token];
        }
    }

    store(arg:string): number{
        let firstFreeIndex = this.arguments.indexOf("");
        if (firstFreeIndex === -1) {
            throw new ArgumentHandlerFullException();
        } else {
            this.arguments[firstFreeIndex] = arg;
            return firstFreeIndex;
        }
    }

    resetState(): void {
        this.arguments = new Array<string>(this.arguments.length);
    }

    serialize(): string {
        return `ArgumentTokenHandler\t${this.priority}\t${this.arguments.length}`;
    }

}

export class ArgumentTokenHandlerDeserializer implements ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean{
        return serialized.split("\t")[0] === "ArgumentTokenHandler";
    }
    deserialize(serialized: string): ArgumentTokenHandler {
        const [type, priority, size] = serialized.split("\t");
        try{
            return new ArgumentTokenHandler(parseInt(priority),parseInt(size));
        } catch(e) {
            throw new Error(`Failed to deserialize ${serialized} into an ArgumentTokenHandler. Is the correct handler type serialized?\nError: ${e}`);
        }
    }
}