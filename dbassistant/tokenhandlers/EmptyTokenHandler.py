from dbassistant.exceptions.ArgumentHandlerIsFullException import ArgumentHandlerIsFullException
from dbassistant.exceptions.MishandledTokenException import MishandledTokenException
from dbassistant.interfaces.ITokenHandler import ITokenHandler
from dbassistant.tokens.Token import Token
from dbassistant.tokens.TokenType import TokenType


class EmptyTokenHandler(ITokenHandler):
    def __init__(self, priority: int):
        self._priority = priority
        self.emptyToken = 0

    @property
    def priority(self):
        return self._priority
    
    @priority.setter
    def priority(self, value):
        self._priority = value

    @property
    def size(self):
        return 1
    
    @property
    def utilizedSize(self):
        return 1
    
    @property
    def mutable(self):
        return False

    def canEncode(self, word: str) -> bool:
        return word == "_"

    def encode(self, word: str) -> Token:
        if word == "_":
            return Token(self.emptyToken, TokenType.EMPTY)
        else:
            raise MishandledTokenException()

    def decode(self, token: int) -> str:
        if token == self.emptyToken:
            return "_"
        else:
            raise MishandledTokenException()

    def resetState(self):
        pass


    def serialize(self, path):
        pass

    def deserialize(self, path):
        pass