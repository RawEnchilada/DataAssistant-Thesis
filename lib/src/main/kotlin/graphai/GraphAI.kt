package graphai

import graphai.interfaces.DBConnection
import graphai.layers.Semantics

class GraphAI (
    connector: DBConnection,
) {
    private val semanticLayer = Semantics(connector)

    fun process(text:String):String{
        var data = semanticLayer.pass(text)
        return data.toString()
    }

    fun loadModel(path:String){

    }

    fun saveModel(){

    }

    fun trainOn(){

    }

}
