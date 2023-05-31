from abc import ABC, abstractmethod
from dbassistant.layers.LayerCargo import LayerCargo


class ILayer(ABC):
    @abstractmethod
    def process(self, cargo: LayerCargo) -> LayerCargo:
        pass
