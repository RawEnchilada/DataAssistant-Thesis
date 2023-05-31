from dbassistant.interfaces.ILayer import ILayer
from dbassistant.tokens.TokenSeries import TokenSeries
from dbassistant.tokens.Tokenizer import Tokenizer


class DeTokenizationLayer(ILayer):
    def __init__(self, tokenizer: Tokenizer):
        self.tokenizer = tokenizer

    def process(self, cargo):
        output = cargo.take()
        assert isinstance(output, TokenSeries)
        query = self.tokenizer.decode(output)
        cargo.put(query)
        return cargo