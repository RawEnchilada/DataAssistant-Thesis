class TokenSeries:
    def __init__(self, tokens):
        self.tokens = tokens
    
    def normalizeTokens(self, maxId):
        maxFloat = float(maxId)
        return [float(t) / maxFloat for t in self.tokens]

    def slice(self, start, end):
        return TokenSeries(self.tokens[start:end])

    def append(self, tokens):
        newTokens = self.tokens[:]
        newTokens.extend(tokens.tokens)
        return TokenSeries(newTokens)

    def lastN(self, n, fillerValue):
        list = [fillerValue] * n
        lastN = self.tokens[-n:][::-1]
        index = n
        for ltoken in lastN:
            index -= 1
            list[index] = ltoken
        return TokenSeries(list)

    def __str__(self):
        text = "|"
        for t in self.tokens:
            text += str(t) + "|"
        return text

    def __eq__(self, other):
        if isinstance(other, TokenSeries):
            return self.tokens == other.tokens
        return False
