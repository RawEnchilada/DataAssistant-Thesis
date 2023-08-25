import ITokenHandler from "../interfaces/ITokenHandler";

export default class TokenEncodeException extends Error {
    constructor(handler:ITokenHandler,word:string) {
        super(`Handler (${typeof handler}) couldn't encode the word: ${word}`);
    }
}