import * as fs from 'fs';
import IGlossaryHandlerFactory from '../interfaces/IGlossaryHandlerFactory';
import ITokenHandler from '../interfaces/ITokenHandler';
import {ArgumentTokenHandler,ArgumentTokenHandlerDeserializer} from '../tokenhandlers/ArgumentTokenHandler';
import {EmptyTokenHandler,EmptyTokenHandlerDeserializer} from '../tokenhandlers/EmptyTokenHandler';
import {EndTokenHandler,EndTokenHandlerDeserializer} from '../tokenhandlers/EndTokenHandler';
import {GenericTokenHandler,GenericTokenHandlerDeserializer} from '../tokenhandlers/GenericTokenHandler';
import {GlossaryTokenHandler,GlossaryTokenHandlerDeserializer} from '../tokenhandlers/GlossaryTokenHandler';
import TokenHandlerLoader from '../tokenhandlers/TokenHandlerLoader';
import TokenSeries from './TokenSeries';
import TokenType from './TokenType';

class Tokenizer {
    private _glossaryHandlerFactory: IGlossaryHandlerFactory;
    private _promptSize: number;
    private _maxArgumentCount: number;
    private _maxGenericTokenCount: number;
    private _endTokenHandler: EndTokenHandler; public get endTokenHandler(): EndTokenHandler { return this._endTokenHandler; } 
    private _emptyTokenHandler: EmptyTokenHandler; public get emptyTokenHandler(): EmptyTokenHandler { return this._emptyTokenHandler; }
    private _glossaryTokenHandler: GlossaryTokenHandler; public get glossaryTokenHandler(): GlossaryTokenHandler { return this._glossaryTokenHandler; }
    private _genericTokenHandler: GenericTokenHandler; public get genericTokenHandler(): GenericTokenHandler { return this._genericTokenHandler; }
    private _argumentTokenHandler: ArgumentTokenHandler; public get argumentTokenHandler(): ArgumentTokenHandler { return this._argumentTokenHandler; }
    private _handlers: ITokenHandler[];
    private _tokenHandlerLoader: TokenHandlerLoader;

    constructor(
        glossaryHandlerFactory: IGlossaryHandlerFactory,
        promptSize: number,
        maxArgumentCount: number,
        maxGenericTokenCount: number
    ) {
        this._glossaryHandlerFactory = glossaryHandlerFactory;
        this._promptSize = promptSize;
        this._maxArgumentCount = maxArgumentCount;
        this._maxGenericTokenCount = maxGenericTokenCount;

        //encode order by priority
        this._endTokenHandler = new EndTokenHandler(0);
        this._emptyTokenHandler = new EmptyTokenHandler(1);
        this._glossaryTokenHandler = glossaryHandlerFactory.build(2);
        this._genericTokenHandler = new GenericTokenHandler(3, maxGenericTokenCount);
        this._argumentTokenHandler = new ArgumentTokenHandler(4, maxArgumentCount);

        //decode order is given by the array's order, by default it should be reverse priority
        this._handlers = [
            this._endTokenHandler,
            this._emptyTokenHandler,
            this._argumentTokenHandler,
            this._genericTokenHandler,
            this._glossaryTokenHandler,
        ].sort((a, b) => b.priority - a.priority);

        this._tokenHandlerLoader = new TokenHandlerLoader([
            new EndTokenHandlerDeserializer(),
            new EmptyTokenHandlerDeserializer(),
            new GlossaryTokenHandlerDeserializer(),
            new GenericTokenHandlerDeserializer(),
            new ArgumentTokenHandlerDeserializer()
        ]);
    }

    get maxSize(): number {
        return this._handlers.reduce((acc, h) => acc + h.size, 0);
    }

    get labelCount(): number {
        return this.maxSize - this._glossaryTokenHandler.keyCount;
    }

    get utilizedSize(): number {
        return this._handlers.reduce((acc, h) => acc + h.utilizedSize, 0);
    }

    encode(input: string[]): TokenSeries {
        const tokens: number[] = [];

        for (let index = 0; index < input.length; index++) {
            const word = input[index];

            for (const handler of this._handlers.sort((a, b) => a.priority - b.priority)) {
                if (handler.canEncode(word)) {
                    const offset = this.handlerOffset(handler);
                    const token = handler.encode(word);
                    tokens.push(offset + token.value);

                    if (token.type === TokenType.KEY) {
                        const argOffset = this.handlerOffset(this._argumentTokenHandler);
                        const argToken = this._argumentTokenHandler.encode(word);
                        tokens.push(argOffset + argToken.value);
                    }

                    break;
                }
            }
        }

        // Possible exception: generated tokens are longer than the input words
        for (let index = tokens.length; index < this._promptSize; index++) {
            tokens.push(this.handlerOffset(this._emptyTokenHandler));
        }

        return new TokenSeries(tokens);
    }

    decode(input: TokenSeries): string[] {
        const words: string[] = [];

        for (const token of input.tokens) {
            let offset = 0;
            for (const handler of this._handlers) {
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
        for (const handler of this._handlers) {
            handler.resetState();
        }
    }

    serialize(path: string): void {
        let data: string = "";
        for (const handler of this._handlers) {
            const serialized = handler.serialize();
            data += serialized + "\n";
        }
        fs.writeFileSync(path, data);
    }

    deserialize(path: string): void {
        let file = fs.readFileSync(path, 'utf8');
        let handlerStrings = file.split('\n');
        for (const data of handlerStrings){
            let handler = this._tokenHandlerLoader.load(data);
            this._handlers.push(handler);
            this._handlers.sort((a, b) => b.priority - a.priority);
        }

    }

    handlerOffset(handler: any): number {
        return this._handlers.slice(0, this._handlers.indexOf(handler)).reduce((acc, h) => acc + h.size, 0);
    }

    copyUntrained(): Tokenizer {
        return new Tokenizer(
            this._glossaryHandlerFactory,
            this._promptSize,
            this._maxArgumentCount,
            this._maxGenericTokenCount
        );
    }
}

export default Tokenizer;
