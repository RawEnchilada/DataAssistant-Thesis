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
import TokenGraphFactory from '../analysis/TokenGraphFactory';
import Token from './Token';

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
    private _graph: TokenGraphFactory|null = null;
    private _logToGraph: boolean = false; public get logToGraph(){return this._logToGraph};
    private _graphPath: string; 

    private _initialized: boolean = false;

    constructor(
        glossaryHandlerFactory: IGlossaryHandlerFactory,
        promptSize: number,
        maxArgumentCount: number,
        maxGenericTokenCount: number,
        graphPath:string = ""
    ) {
        this._glossaryHandlerFactory = glossaryHandlerFactory;
        this._promptSize = promptSize;
        this._maxArgumentCount = maxArgumentCount;
        this._maxGenericTokenCount = maxGenericTokenCount;
        this._graphPath = graphPath;
        if(graphPath.length > 0){
            this._logToGraph = true;
            this._graph = new TokenGraphFactory();
        }
    }

    public async initialize(){
        //encode order by priority
        this._endTokenHandler = new EndTokenHandler(0);
        this._emptyTokenHandler = new EmptyTokenHandler(1);
        this._glossaryTokenHandler = await this._glossaryHandlerFactory.build(2);
        this._genericTokenHandler = new GenericTokenHandler(3, this._maxGenericTokenCount);
        this._argumentTokenHandler = new ArgumentTokenHandler(10, this._maxArgumentCount);

        //The order of handlers is very specific. Handler offset function uses it, and decoding uses it.
        this._handlers = [
            this._endTokenHandler,
            this._emptyTokenHandler,
            this._argumentTokenHandler,
            this._genericTokenHandler,
            this._glossaryTokenHandler,
        ];

        this._tokenHandlerLoader = new TokenHandlerLoader([
            new EndTokenHandlerDeserializer(),
            new EmptyTokenHandlerDeserializer(),
            new ArgumentTokenHandlerDeserializer(),
            new GenericTokenHandlerDeserializer(),
            new GlossaryTokenHandlerDeserializer()
        ]);
        this._initialized = true;
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

    encode(input: string[],includeType:boolean = true): TokenSeries {
        if (!this._initialized) {
            throw new Error("Tokenizer not initialized, please run initialize() first.");
        }
        const tokens: number[] = [];
        const handlersSorted = [...this._handlers].sort((a, b) => a.priority - b.priority);

        for (let index = 0; index < input.length; index++) {
            const word = input[index];

            for (const handler of handlersSorted) {
                if (handler.canEncode(word)) {
                    const offset = this.handlerOffset(handler);
                    const token = handler.encode(word);
                    if((offset+token.value) > this.labelCount){
                        throw new Error(`Token value is bigger than the maximum token size.Is the order of handlers correct?\nWord: ${word}, Token: (${token.value}+offset:${offset}), Max size: ${this.labelCount}\n    Handler: ${handler.serialize()}\n------------------`);
                    }

                    if(!(token.type === TokenType.KEY && includeType === false)){
                        tokens.push(offset + token.value);
                        if(this._logToGraph)this._graph!.push(word,new Token(offset+token.value,token.type));
                    }
                    
                    if (token.type === TokenType.KEY) {
                        const argOffset = this.handlerOffset(this._argumentTokenHandler);
                        const argToken = this._argumentTokenHandler.encode(word);
                        tokens.push(argOffset + argToken.value);
                        if(this._logToGraph)this._graph!.push(word,new Token(argOffset+argToken.value,TokenType.ARGUMENT));
                    }

                    break;
                }
            }
        }

        // Possible exception: generated tokens are longer than the input words
        for (let index = tokens.length; index < this._promptSize; index++) {
            tokens.push(this._emptyTokenHandler.emptyToken);
        }

        return new TokenSeries(tokens);
    }

    decode(input: TokenSeries): string[] {
        if (!this._initialized) {
            throw new Error("Tokenizer not initialized, please run initialize() first.");
        }
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
        if (!this._initialized) {
            throw new Error("Tokenizer not initialized, please run initialize() first.");
        }
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
            [...this._handlers].sort((a, b) => b.priority - a.priority);
        }

    }

    handlerOffset(handler: any): number {
        let offset = 0;
        for(const h of this._handlers){
            if(h === handler){
                return offset;
            }
            offset += h.size;
        }
        throw new Error("Could not find handler during offset calculation.");
    }

    copyUntrained(): Tokenizer {
        return new Tokenizer(
            this._glossaryHandlerFactory,
            this._promptSize,
            this._maxArgumentCount,
            this._maxGenericTokenCount
        );
    }

    toString():string{
        return this._handlers.map(h => h.serialize()).join("\n");
    }

    printGraph(){
        if(this._graph !== null){
            this._graph.print(this._graphPath);
            this._graph = new TokenGraphFactory();
            console.log(`Tokenizer graph exported to ${this._graphPath}.`);
        } else {
            throw new Error("This Tokenizer instance was not configured to create a graph!");
        }
    }
}

export default Tokenizer;
