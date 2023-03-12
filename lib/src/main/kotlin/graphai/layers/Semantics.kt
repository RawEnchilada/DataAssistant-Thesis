package graphai.layers

import graphai.interfaces.DBConnection
import graphai.interfaces.Layer

class Semantics (
    val connector: DBConnection
): Layer{
    override fun pass(input: Any): Any {
        TODO("Not yet implemented")
    }

}

