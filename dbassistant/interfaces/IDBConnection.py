from abc import ABC, abstractmethod
from typing import List, Dict


class IDBConnection(ABC):
    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def disconnect(self):
        pass

    @abstractmethod
    def query(self, query: str) -> List[Dict[str, any]]:
        pass
