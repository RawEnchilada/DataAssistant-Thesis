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

    lastN(n:number, pad:number): TokenSeries{
        const lastN = this.tokens.slice(-n);
        const missing = n - lastN.length;
        const arr = new Array(missing).fill(pad);
        return new TokenSeries(arr.concat(lastN));
    }

    toString(): string{
        return this.tokens.join("|");
    }

    equals(tokens: TokenSeries): boolean{
        return this.tokens.length == tokens.tokens.length && this.tokens.every((token, index) => token == tokens.tokens[index]);
    }

}

export default TokenSeries;