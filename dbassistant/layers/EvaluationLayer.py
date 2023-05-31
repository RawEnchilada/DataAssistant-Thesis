from dbassistant.interfaces.ILayer import ILayer
from dbassistant.neural.QueryGenerator import QueryGenerator
from dbassistant.tokens.TokenSeries import TokenSeries


class EvaluationLayer(ILayer):
    def __init__(self, query_generator: QueryGenerator):
        self.query_generator = query_generator

    def process(self, cargo):
        input = cargo.take()
        assert isinstance(input, TokenSeries)
        output = self.query_generator.evaluate(input)
        cargo.put(output)
        return cargo