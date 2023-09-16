enum TokenType{
    END = 1,
    EMPTY = 2,
    GENERIC = 3,
    ARGUMENT = 4,
    CLASS = 5,
    KEY = 6
}

export default TokenType;

export function getName(type:number):string{
    switch(type){
        case TokenType.END:
            return "END";
        case TokenType.EMPTY:
            return "EMPTY";
        case TokenType.GENERIC:
            return "GENERIC";
        case TokenType.ARGUMENT:
            return "ARGUMENT";
        case TokenType.CLASS:
            return "CLASS";
        case TokenType.KEY:
            return "KEY";
        default:
            return "UNKNOWN";
    }
}