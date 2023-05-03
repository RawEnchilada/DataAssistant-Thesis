package dbassistant.layers


class LayerCargo( 
    private var cargo : Any? = null
){


    fun put(value:Any?):LayerCargo{
        cargo = value
        return this
    }

    fun take():Any{
        if(cargo == null) throw Exception("LayerCargo is empty")
        val c = cargo
        cargo = null
        return c!!
    }

}