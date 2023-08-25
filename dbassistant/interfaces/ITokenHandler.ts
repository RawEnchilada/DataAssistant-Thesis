import Token from "../tokens/Token";

export default interface ITokenHandler {

    /**
     * Determines the order of which handlers get to encode the given token.
     * 0 comes first
     */
    priority: number;

    /**
     * Determines the highest possible id that can be encoded by this handler.
     */
    size: number;

    /**
     * Determines the amount of id's that are actually used by this handler.
     */
    utilizedSize: number;

    /**
     * Determines if the handler can be modified, will be set to false after training or loading.
     */
    mutable: boolean;

    /**
     * @param word The word to check.
     * @returns True if the handler can encode the word.
     */
    canEncode(word: string): boolean;

    /**
     * Try to encode the given word.
     * @param word The word to encode.
     * @returns The encoded word.
     */
    encode(word: string): Token;

    /**
     * Try to decode the given token.
     * @param token The token to decode.
     * @returns The decoded word.
     * @throws MishandledTokenException if the token is not recognized.
     */
    decode(token: number): string;

    /**
     * Resets the state of the handler.
     */
    resetState(): void;

    /**
     * Also implement a static deserialize(serialied:string):ITokenHandler function!
     * @returns A string representation of the handler.
     */
    serialize(): string;

    /**
     * @param serialized The serialized string to deserialize.
     * @returns A new instance of the handler.
     */
    // static deserialize(serialized: string): ITokenHandler;
}
