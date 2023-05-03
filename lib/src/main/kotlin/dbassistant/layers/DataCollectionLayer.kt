package dbassistant.layers

import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.ILayer

class DataCollectionLayer(
    val db: IDBConnection
) : ILayer  {



    override fun pass(cargo: LayerCargo): LayerCargo {
        val input = cargo.take() as String
        db.connect()
        val result = db.query(input)
        db.disconnect()
        cargo.put(result)
        return cargo
    }


}

