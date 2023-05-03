package dbassistant.interfaces

import dbassistant.layers.LayerCargo


interface ILayer{

    fun pass(cargo: LayerCargo): LayerCargo

}