from dbassistant.exceptions.ArgumentHandlerIsFullException import ArgumentHandlerIsFullException
from dbassistant.exceptions.MishandledTokenException import MishandledTokenException
from dbassistant.interfaces.ITokenHandler import ITokenHandler
from dbassistant.tokens.Token import Token
from dbassistant.tokens.TokenType import TokenType

class ArgumentTokenHandler(ITokenHandler):
    def __init__(self, priority, max_argument_count):
        self._priority = priority
        self.arguments = [""] * max_argument_count


    @property
    def priority(self):
        return self._priority
    
    @priority.setter
    def priority(self, value):
        self._priority = value

    @property
    def size(self):
        return len(self.arguments)

    @property
    def utilizedSize(self):
        return self.size  # Returning full size because arguments are reset after each prompt

    @property
    def mutable(self):
        return True

    def canEncode(self, word):
        return word in self.arguments

    def encode(self, word):
        try:
            index = self.arguments.index(word)
        except ValueError:
            index = self.store(word)
        return Token(index, TokenType.ARGUMENT)

    def decode(self, token):
        try:
            word = self.arguments[token]
            return word
        except IndexError:
            raise MishandledTokenException()

    def store(self, arg):
        try:
            index = self.arguments.index("")
            self.arguments[index] = arg
            return index
        except ValueError:
            raise ArgumentHandlerIsFullException()

    def resetState(self):
        for index in range(len(self.arguments)):
            self.arguments[index] = ""


    def serialize(self, path):
        pass

    def deserialize(self, path):
        pass
