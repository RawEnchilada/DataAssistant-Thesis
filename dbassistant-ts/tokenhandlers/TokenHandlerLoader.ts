import { ITokenHandler } from "../interfaces/ITokenHandler";
import { ITokenHandlerDeserializer } from "../interfaces/ITokenHandlerDeserializer";

/**
 * Deserializes a string into an ITokenHandler.
 */
export class TokenHandlerLoader{
    constructor(private _supportedHandlers:ITokenHandlerDeserializer[]){}

    load(serialized:string):ITokenHandler{
        for(const loader of this._supportedHandlers){
            if(loader.canDeserialize(serialized)){
                return loader.deserialize(serialized);
            }
        }
        throw new Error(`Failed to deserialize \"${serialized}\". Is the handler type supported?`);
    }
}