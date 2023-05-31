from dbassistant.interfaces.IDBConnection import IDBConnection
from dbassistant.interfaces.ILayer import ILayer

class DataCollectionLayer(ILayer):
    def __init__(self, db:IDBConnection):
        self.db = db
    
    def process(self, cargo):
        input_data = cargo.take()
        assert isinstance(input_data, str)
        self.db.connect()
        result = self.db.query(input_data)
        self.db.disconnect()
        cargo.put(result)
        return cargo