package dbassistant.layers

import dbassistant.interfaces.ILayer
import dbassistant.layers.LayerCargo

class PromptPreparationLayer(
    private val promptSize: Int
) : ILayer{
    
    override fun pass(cargo: LayerCargo): LayerCargo {
        val input = cargo.take() as String
        val specialCharacter = Regex("[^A-z0-9 @]")

        var spaced = ""
        for(char in input.replace("\"","")){
            if(specialCharacter.matches(char.toString())){
                spaced += " $char "
            }
            else{
                spaced += char
            }
        }
        spaced = spaced.replace(Regex(" +")," ")
        val symbols = spaced.split(" ").toMutableList()
        symbols.add("[END]")
        
        cargo.put(symbols.toList())
        return cargo
    }

}