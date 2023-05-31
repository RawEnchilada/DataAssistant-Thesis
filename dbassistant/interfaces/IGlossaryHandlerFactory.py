from abc import ABC, abstractmethod
from dbassistant.tokenhandlers.GlossaryTokenHandler import GlossaryTokenHandler

class IGlossaryHandlerFactory(ABC):
    @abstractmethod
    def build(self, priority: int) -> GlossaryTokenHandler:
        pass
