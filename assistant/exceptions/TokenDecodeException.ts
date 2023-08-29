import ITokenHandler from "../interfaces/ITokenHandler";

export default class TokenDecodeException extends Error {
    constructor(handler:ITokenHandler,token:number) {
        super(`Handler (${typeof handler}) couldn't decode token: ${token}`);
    }
}