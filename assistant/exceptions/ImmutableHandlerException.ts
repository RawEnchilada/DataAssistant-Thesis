export default class ImmutableHandlerException extends Error {
    constructor() {
        super("This handler is immutable");
    }
}