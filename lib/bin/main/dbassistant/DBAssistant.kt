package dbassistant

import dbassistant.interfaces.ILayer
import dbassistant.layers.DataCollectionLayer
import dbassistant.layers.TokenizationLayer
import dbassistant.layers.LayerCargo
import dbassistant.neural.QueryGenerator
import java.io.File

class DBAssistant (
    private val queryGenerator: QueryGenerator,
    private val layers : Array<ILayer>
) {

    fun evaluate(text:String):String{
        val cargo = LayerCargo(text)

        for(layer in layers){
            layer.pass(cargo)
        }

        return cargo.take() as String
    }

    fun loadModel(path:String){
        //queryGenerator.loadModel(path+"/layers")
        //wordMap = WordMap.deserialize(path+"/layers/word.map")
    }

    fun saveModel(path:String){
        //queryGenerator.saveModel(path+"/layers")
        //wordMap.serialize(path+"/layers/word.map")
    }

    fun trainOn(path:String){
        val datasetFile = File(path)
        queryGenerator.train(datasetFile,"logs/plot.html")
    }

}
