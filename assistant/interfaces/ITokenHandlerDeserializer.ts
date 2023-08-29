import ITokenHandler from "./ITokenHandler";

export default interface ITokenHandlerDeserializer{
    canDeserialize(serialized:string):boolean;
    deserialize(serialized:string):ITokenHandler;
}
