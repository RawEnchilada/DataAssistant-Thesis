import { ITokenHandler } from "./ITokenHandler";

export interface ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean;
    deserialize(serialized:string):ITokenHandler;
}