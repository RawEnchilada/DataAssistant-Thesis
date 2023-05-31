from dbassistant.interfaces.ILayer import ILayer

class QueryPreparationLayer(ILayer):
    def process(self, cargo):
        input = cargo.take()
        assert isinstance(input[0], str)
        output = ' '.join(input)
        cargo.put(output)
        return cargo