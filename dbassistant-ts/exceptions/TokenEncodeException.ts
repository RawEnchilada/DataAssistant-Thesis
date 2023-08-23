import { ITokenHandler } from "../interfaces/ITokenHandler";

export class TokenEncodeException extends Error {
    constructor(handler:ITokenHandler,word:string) {
        super(`Handler (${typeof handler}) couldn't encode the word: ${word}`);
    }
}