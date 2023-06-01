import re
from typing import List
from dbassistant.interfaces.ILayer import ILayer
from dbassistant.layers.LayerCargo import LayerCargo
from dbassistant.tokens.Tokenizer import Tokenizer


class PromptPreparationLayer(ILayer):
    def __init__(self, prompt_size: int):
        self.prompt_size = prompt_size

    def process(self, cargo: LayerCargo) -> LayerCargo:
        input_string = cargo.take()
        assert isinstance(input_string, str)
        special_character = re.compile(r'[^A-z0-9 _@]')

        spaced = ""
        for char in input_string:
            if special_character.match(char):
                spaced += " " + char + " "
            else:
                spaced += char
        spaced = re.sub(r' +', ' ', spaced)
        symbols = spaced.split(" ")
        # filter empty strings
        symbols = list(filter(None, symbols))
        symbols.append("[END]")

        cargo.put(symbols)
        return cargo
