class TokenSeries{
    constructor(public tokens: number[]){}

    normalizeTokens(maxId:number): TokenSeries{
        return new TokenSeries(this.tokens.map((token) => token / maxId));
    }

    slice(start: number, end: number): TokenSeries{
        return new TokenSeries(this.tokens.slice(start, end));
    }

    append(tokens: TokenSeries): TokenSeries{
        return new TokenSeries(this.tokens.concat(tokens.tokens));
    }

    lastN(n:number, pad:number = 0): TokenSeries{
        return new TokenSeries(this.tokens.slice(-n).concat(Array(pad).fill(0)));
    }

    toString(): string{
        return this.tokens.join("|");
    }

    equals(tokens: TokenSeries): boolean{
        return this.tokens.length == tokens.tokens.length && this.tokens.every((token, index) => token == tokens.tokens[index]);
    }

}

export default TokenSeries;