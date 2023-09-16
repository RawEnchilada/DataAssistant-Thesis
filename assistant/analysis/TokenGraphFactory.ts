import * as fs from 'fs';
import Token from "../tokens/Token";
import { getName } from "../tokens/TokenType";
import Graph from "./Graph";


export default class TokenGraphFactory{
    private _lastWord: string|null = null;
    private _lastToken: Token|null = null;
    private _graph: Graph;

    constructor(){
        this._graph = new Graph();
    }

    public push(word:string,token: Token): void{
        let connectTo:string|undefined = undefined;
        if(this._lastToken !== null){
            connectTo = `${this._lastWord}-${this._lastToken?.value}`;
        }

        this._graph.addNode(`${word}-${token.value}`,getName(token.type),connectTo);
        if(token.value === 0){
            this._lastToken = null;
            this._lastWord = null;
        } else {
            this._lastToken = token;
            this._lastWord = word;
        }
    }

    public create(): any{
        const graph = this._graph.export();
        return graph;
    }

    public print(path:string):void{
        const data = this.create();
        fs.writeFileSync(path, data);
    }
}


