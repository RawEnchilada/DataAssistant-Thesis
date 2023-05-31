from dbassistant.interfaces.ILayer import ILayer
from dbassistant.tokens.Tokenizer import Tokenizer


class EnTokenizationLayer(ILayer):
    def __init__(self, tokenizer: Tokenizer):
        self.tokenizer = tokenizer

    def process(self, cargo):
        input_data = cargo.take()
        input_list = list(input_data)
        assert isinstance(input_list[0], str)
        self.tokenizer.resetState()
        tokens = self.tokenizer.encode(input_list)
        cargo.put(tokens)
        return cargo