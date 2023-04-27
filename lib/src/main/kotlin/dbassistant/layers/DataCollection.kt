package dbassistant.layers

import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.ILayer

class DataCollection(
    val db: IDBConnection
) : ILayer {



    override fun pass(input: String): String {
        db.connect()
        val result = db.query(input)
        db.disconnect()
        return "result"
    }


}

