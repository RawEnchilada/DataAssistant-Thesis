import os

from dbassistant.interfaces.ILayer import ILayer
from dbassistant.layers.GlossaryConversionLayer import GlossaryConversionLayer
from dbassistant.layers.LayerCargo import LayerCargo
from dbassistant.layers.DeTokenizationLayer import DeTokenizationLayer
from dbassistant.layers.EnTokenizationLayer import EnTokenizationLayer
from dbassistant.layers.EvaluationLayer import EvaluationLayer
from dbassistant.layers.PromptPreparationLayer import PromptPreparationLayer
from dbassistant.layers.QueryPreparationLayer import QueryPreparationLayer
from dbassistant.neural.QueryDatasetCreator import QueryDatasetCreator
from dbassistant.neural.QueryGenerator import QueryGenerator
from dbassistant.tokens.Tokenizer import Tokenizer


class DBAssistant:
    def __init__(self, query_generator: QueryGenerator, tokenizer: Tokenizer, prompt_size: int = 20):
        self.query_generator = query_generator
        self.layers = [
            GlossaryConversionLayer(tokenizer),
            PromptPreparationLayer(prompt_size),
            EnTokenizationLayer(tokenizer),
            EvaluationLayer(self.query_generator),
            DeTokenizationLayer(tokenizer),
            QueryPreparationLayer()
        ]

    def evaluate(self, text: str) -> str:
        cargo = LayerCargo(text)

        for layer in self.layers:
            layer.process(cargo)

        return str(cargo.take())
    
    def train(self, train_file: str):
        self.query_generator.train(train_file)

    def load_model(self, path: str):
        self.query_generator.loadModel(path)

    def save_model(self, path: str):
        self.query_generator.saveModel(path)

    def load_layers(self, path: str):
        self.query_generator.loadLayers(path)

    def save_layers(self, path: str):
        self.query_generator.saveLayers(path)

    def convert_data(self, from_path: str, to_path: str):
        creator = QueryDatasetCreator(
            self.query_generator.promptSize,
            self.query_generator.memorySize,
            self.query_generator.tokenizer
        )
        creator.load(from_path, to_path)
