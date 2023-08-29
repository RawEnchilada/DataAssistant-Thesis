export default class GenericHandlerFullException extends Error {
    constructor() {
        super("Handler is full");
    }
}