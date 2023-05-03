package dbassistant.layers

import dbassistant.interfaces.ILayer

class QueryPreparationLayer : ILayer  {

    override fun pass(cargo: LayerCargo): LayerCargo {
        val input = cargo.take() as List<String>
        val output = input.joinToString(" ")
        cargo.put(output)
        return cargo
    }

}
