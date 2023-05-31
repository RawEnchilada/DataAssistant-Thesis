from dbassistant.exceptions.ArgumentHandlerIsFullException import ArgumentHandlerIsFullException
from dbassistant.exceptions.MishandledTokenException import MishandledTokenException
from dbassistant.interfaces.ITokenHandler import ITokenHandler
from dbassistant.tokens.Token import Token
from dbassistant.tokens.TokenType import TokenType

class EndTokenHandler(ITokenHandler):
    def __init__(self, priority):
        self._priority = priority
        self.endToken = 0

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


    def canEncode(self, word):
        return word == "[END]"

    def encode(self, word):
        if word == "[END]":
            return Token(self.endToken, TokenType.END)
        else:
            raise MishandledTokenException()

    def decode(self, token):
        if token == self.endToken:
            return "[END]"
        else:
            raise MishandledTokenException()

    def resetState(self):
        pass


    def serialize(self, path):
        pass

    def deserialize(self, path):
        pass