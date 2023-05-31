import json
from pyorient import OrientDB


from pyorient import OrientSocket

class PySocket(OrientSocket):
    def __init__(self, host, port, protocol=38, timeout=300):
        super(PySocket, self).__init__(host, port)
        self.protocol = protocol
        self.host = host
        self.port = port
        self.timeout = timeout

    def connect(self):
        self._socket.settimeout(self.timeout)
        self._socket.connect( (self.host, self.port) )
        _value = self._socket.recv(2)

        if len(_value) != 2:
            self._socket.close()

        self.connected = True



class Orient:
    def __init__(self, config):
        self.config = config
        self.orientDB = None
        self.isOpen = False

    def connect(self):
        if self.isOpen is False or self.orientDB is None:
            socket = PySocket(self.config.url, 2424)
            socket.connect()
            self.orientDB = OrientDB(socket)
            self.orientDB.db_open(self.config.db, self.config.user, self.config.password)
            self.isOpen = True

    def disconnect(self):
        if self.isOpen is True and self.orientDB is not None:
            self.orientDB.db_close()
            self.orientDB = None
            self.isOpen = False

    def query(self, query):
        if self.isOpen is True and self.orientDB is not None:
            result = self.orientDB.query(query)
            data = []
            for row in result:
                data.append(row.oRecordData)
            return data
        else:
            return None
