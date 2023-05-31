from dbassistant.exceptions.ArgumentHandlerIsFullException import ArgumentHandlerIsFullException
from dbassistant.exceptions.ImmutableHandlerException import ImmutableHandlerException
from dbassistant.exceptions.MishandledTokenException import MishandledTokenException
from dbassistant.interfaces.ITokenHandler import ITokenHandler
from dbassistant.tokens.Token import Token
from dbassistant.tokens.TokenType import TokenType


class GenericTokenHandler(ITokenHandler):
    def __init__(self, priority: int, max_generic_token_count: int):
        self._priority = priority
        self.words = [""] * max_generic_token_count
        self._mutable = True

    @property
    def priority(self):
        return self._priority
    
    @priority.setter
    def priority(self, value):
        self._priority = value
    
    @property
    def learned_tokens(self):
        return self.words.copy()

    @property
    def size(self):
        return len(self.words)

    @property
    def utilizedSize(self):
        return len([w for w in self.words if w != ""])

    @property
    def mutable(self):
        return self._mutable

    def canEncode(self, word: str):
        return True

    def encode(self, word: str):
        index = self.words.index(word) if word in self.words else -1
        if index == -1:
            if self.mutable:
                try:
                    id = self.words.index("")
                    self.words[id] = word
                    return Token(id, TokenType.GENERIC)
                except ValueError:
                    pass
            else:
                raise ImmutableHandlerException()
        return Token(index, TokenType.GENERIC)

    def decode(self, token: int):
        try:
            return self.words[token]
        except IndexError:
            raise MishandledTokenException()

    def resetState(self):
        pass

    def serialize(self, path):
        file = path + "/generic_tokens.layer"
        with open(file, "w") as f:
            for word in self.words:
                f.write(word + "\n")

    def deserialize(self,path):
        file = path + "/generic_tokens.layer"
        with open(file, "r") as f:
            for line in f:
                self.encode(line.strip())
        self._mutable = False
