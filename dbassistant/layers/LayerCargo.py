class LayerCargo:
    def __init__(self, cargo=None):
        self.cargo = cargo

    def put(self, value):
        self.cargo = value
        return self

    def take(self):
        if self.cargo is None:
            raise Exception("LayerCargo is empty")
        c = self.cargo
        self.cargo = None
        return c
