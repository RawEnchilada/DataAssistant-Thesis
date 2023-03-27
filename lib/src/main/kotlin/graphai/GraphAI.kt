package graphai

import graphai.interfaces.IDBConnection
import graphai.interfaces.IGlossary
import graphai.layers.DataCollection
import graphai.layers.Semantics

class GraphAI (
    private val db: IDBConnection,
    private val glossary: IGlossary
) {
    private val semanticLayer = Semantics(glossary)
    private val dataCollection = DataCollection(db)

    fun process(text:String):String{
        val query = semanticLayer.pass(text)
        val data = dataCollection.pass(query)
        return data
    }

    fun loadModel(path:String){

    }

    fun saveModel(){

    }

    fun trainOn(){

    }

}
