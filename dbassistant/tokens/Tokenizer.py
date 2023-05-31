from dbassistant.interfaces.IGlossaryHandlerFactory import IGlossaryHandlerFactory
from dbassistant.tokenhandlers.ArgumentTokenHandler import ArgumentTokenHandler
from dbassistant.tokenhandlers.EmptyTokenHandler import EmptyTokenHandler
from dbassistant.tokenhandlers.EndTokenHandler import EndTokenHandler
from dbassistant.tokenhandlers.GenericTokenHandler import GenericTokenHandler
from dbassistant.tokens.TokenSeries import TokenSeries
from dbassistant.tokens.TokenType import TokenType


class Tokenizer:
    def __init__(
        self,
        glossaryHandlerFactory: IGlossaryHandlerFactory,
        promptSize: int,
        maxArgumentCount: int,
        maxGenericTokenCount: int
    ):
        self.glossaryHandlerFactory = glossaryHandlerFactory
        self.promptSize = promptSize
        self.maxArgumentCount = maxArgumentCount
        self.maxGenericTokenCount = maxGenericTokenCount
        
        self.endTokenHandler = EndTokenHandler(0)
        self.emptyTokenHandler = EmptyTokenHandler(1)
        self.glossaryTokenHandler = glossaryHandlerFactory.build(2)
        self.genericTokenHandler = GenericTokenHandler(3, maxGenericTokenCount)
        self.argumentTokenHandler = ArgumentTokenHandler(10, maxArgumentCount)
        
        self.handlers = [
            self.endTokenHandler,
            self.emptyTokenHandler,
            self.argumentTokenHandler,
            self.genericTokenHandler,
            self.glossaryTokenHandler
        ]
        
    @property
    def maxSize(self):
        return sum(h.size for h in self.handlers)
    
    @property
    def utilizedSize(self):
        return sum(h.utilizedSize for h in self.handlers)
    
    def encode(self, input):
        tokens = []
        
        for index in range(len(input)):
            word = input[index]
            
            for handler in sorted(self.handlers, key=lambda h: h.priority):
                if handler.canEncode(word):
                    offset = self.handlerOffset(handler)
                    token = handler.encode(word)
                    tokens.append(offset + token.value)
                    
                    if token.type == TokenType.KEY:
                        argOffset = self.handlerOffset(self.argumentTokenHandler)
                        argToken = self.argumentTokenHandler.encode(word)
                        tokens.append(argOffset + argToken.value)
                    
                    break
        
        # Possible exception: generated tokens are longer than the input words
        for index in range(len(tokens), self.promptSize):
            tokens.append(self.handlerOffset(self.emptyTokenHandler))
        
        return TokenSeries(tokens)
    
    def decode(self, input):
        words = []
        
        for token in input.tokens:
            offset = 0
            for handler in self.handlers:
                if token < offset + handler.size:
                    word = handler.decode(token - offset)
                    words.append(word)
                    break
                else:
                    offset += handler.size
        
        return words
    
    def resetState(self):
        for handler in self.handlers:
            handler.resetState()
    
    def serialize(self, path):
        for handler in self.handlers:
            handler.serialize(path)
    
    def deserialize(self,path):
        for handler in self.handlers:
            handler.deserialize(path)
        
    
    def handlerOffset(self, handler):
        return sum(h.size for h in self.handlers[:self.handlers.index(handler)])
    
    def copyUntrained(self):
        return Tokenizer(
            self.glossaryHandlerFactory,
            self.promptSize,
            self.maxArgumentCount,
            self.maxGenericTokenCount
        )
