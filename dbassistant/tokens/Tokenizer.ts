import IGlossaryHandlerFactory from '../interfaces/IGlossaryHandlerFactory';
import ITokenHandler from '../interfaces/ITokenHandler';
import {ArgumentTokenHandler} from '../tokenhandlers/ArgumentTokenHandler';
import {EmptyTokenHandler} from '../tokenhandlers/EmptyTokenHandler';
import {EndTokenHandler} from '../tokenhandlers/EndTokenHandler';
import {GenericTokenHandler} from '../tokenhandlers/GenericTokenHandler';
import {GlossaryTokenHandler} from '../tokenhandlers/GlossaryTokenHandler';
import TokenSeries from '../tokens/TokenSeries';
import TokenType from '../tokens/TokenType';

class Tokenizer {
    private glossaryHandlerFactory: IGlossaryHandlerFactory;
    private promptSize: number;
    private maxArgumentCount: number;
    private maxGenericTokenCount: number;
    private endTokenHandler: EndTokenHandler;
    private emptyTokenHandler: EmptyTokenHandler;
    public glossaryTokenHandler: GlossaryTokenHandler;
    private genericTokenHandler: GenericTokenHandler;
    private argumentTokenHandler: ArgumentTokenHandler;
    private handlers: ITokenHandler[];

    constructor(
        glossaryHandlerFactory: IGlossaryHandlerFactory,
        promptSize: number,
        maxArgumentCount: number,
        maxGenericTokenCount: number
    ) {
        this.glossaryHandlerFactory = glossaryHandlerFactory;
        this.promptSize = promptSize;
        this.maxArgumentCount = maxArgumentCount;
        this.maxGenericTokenCount = maxGenericTokenCount;

        //encode order by priority
        this.endTokenHandler = new EndTokenHandler(0);
        this.emptyTokenHandler = new EmptyTokenHandler(1);
        this.glossaryTokenHandler = glossaryHandlerFactory.build(2);
        this.genericTokenHandler = new GenericTokenHandler(3, maxGenericTokenCount);
        this.argumentTokenHandler = new ArgumentTokenHandler(10, maxArgumentCount);

        this.handlers = [
            // decode order
            this.endTokenHandler,
            this.emptyTokenHandler,
            this.argumentTokenHandler,
            this.genericTokenHandler,
            this.glossaryTokenHandler,
        ];
    }

    get maxSize(): number {
        return this.handlers.reduce((acc, h) => acc + h.size, 0);
    }

    get labelCount(): number {
        return this.maxSize - this.glossaryTokenHandler.keyCount;
    }

    get utilizedSize(): number {
        return this.handlers.reduce((acc, h) => acc + h.utilizedSize, 0);
    }

    encode(input: string[]): TokenSeries {
        const tokens: number[] = [];

        for (let index = 0; index < input.length; index++) {
            const word = input[index];

            for (const handler of this.handlers.sort((a, b) => a.priority - b.priority)) {
                if (handler.canEncode(word)) {
                    const offset = this.handlerOffset(handler);
                    const token = handler.encode(word);
                    tokens.push(offset + token.value);

                    if (token.type === TokenType.KEY) {
                        const argOffset = this.handlerOffset(this.argumentTokenHandler);
                        const argToken = this.argumentTokenHandler.encode(word);
                        tokens.push(argOffset + argToken.value);
                    }

                    break;
                }
            }
        }

        // Possible exception: generated tokens are longer than the input words
        for (let index = tokens.length; index < this.promptSize; index++) {
            tokens.push(this.handlerOffset(this.emptyTokenHandler));
        }

        return new TokenSeries(tokens);
    }

    decode(input: TokenSeries): string[] {
        const words: string[] = [];

        for (const token of input.tokens) {
            let offset = 0;
            for (const handler of this.handlers) {
                if (token < offset + handler.size) {
                    const word = handler.decode(token - offset);
                    words.push(word);
                    break;
                } else {
                    offset += handler.size;
                }
            }
        }

        return words;
    }

    resetState(): void {
        for (const handler of this.handlers) {
            handler.resetState();
        }
    }

    serialize(path: string): void {
        for (const handler of this.handlers) {
            const serialized = handler.serialize(path);
        }
    }

    deserialize(path: string): void {
        for (const handler of this.handlers) {
            handler.deserialize(path);
        }
    }

    private handlerOffset(handler: any): number {
        return this.handlers.slice(0, this.handlers.indexOf(handler)).reduce((acc, h) => acc + h.size, 0);
    }

    copyUntrained(): Tokenizer {
        return new Tokenizer(
            this.glossaryHandlerFactory,
            this.promptSize,
            this.maxArgumentCount,
            this.maxGenericTokenCount
        );
    }
}

export default Tokenizer;
