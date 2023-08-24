import re
from typing import List
from dbassistant.interfaces.ILayer import ILayer
from dbassistant.layers.LayerCargo import LayerCargo
from dbassistant.tokens.Tokenizer import Tokenizer


class GlossaryConversionLayer(ILayer):
    def __init__(self, tokenizer:Tokenizer):
        self.tokenizer = tokenizer

    def process(self, cargo: LayerCargo) -> LayerCargo:
        input_string = cargo.take()
        assert isinstance(input_string, str)
        
        looking_for = self.tokenizer.glossaryTokenHandler.keyMap.keys()
        for key in looking_for:
            input_string = re.sub('\\b' + key + '\\b', key.replace(" ", "_"), input_string)

        cargo.put(input_string)
        return cargo
