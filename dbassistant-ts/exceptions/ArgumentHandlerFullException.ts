export class ArgumentHandlerFullException extends Error {
    constructor() {
        super("Argument handler is full");
    }
}