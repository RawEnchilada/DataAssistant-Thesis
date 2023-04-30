package dbassistant

import dbassistant.interfaces.IDBConnection
import dbassistant.interfaces.IGlossary
import dbassistant.layers.DataCollection
import dbassistant.layers.Semantics
import dbassistant.neural.QueryGenerator
import dbassistant.preprocessing.WordMap
import java.io.File

class DBAssistant (
        private val db: IDBConnection,
        private val glossary: IGlossary,
        /** Maximum count of accepted tokens by the model */
        maxPromptSize:Int,
        /** How many last tokens are included in the input layer from the output of the model */
        memorySize:Int,    
        /** Amount of arguments the model can handle */
        maxArgumentCount:Int,
        /** Amount of words the model can learn */
        maxWordCount:Int
) {
    
    
    var wordMap = WordMap(glossary,maxPromptSize,memorySize,0,maxArgumentCount,maxWordCount)
    private val queryGenerator = QueryGenerator(wordMap)
    val semanticLayer = Semantics(wordMap,queryGenerator)
    val dataCollectionLayer = DataCollection(db)

    fun process(text:String):String{
        val query = semanticLayer.pass(text)
        val data = dataCollectionLayer.pass(query)
        return data
    }

    fun loadModel(path:String){
        queryGenerator.loadModel(path+"/layers")
        wordMap = WordMap.deserialize(path+"/layers/word.map")
    }

    fun saveModel(path:String){
        queryGenerator.saveModel(path+"/layers")
        wordMap.serialize(path+"/layers/word.map")
    }

    fun trainOn(path:String){
        val datasetFile = File(path)
        queryGenerator.train(datasetFile,"logs/plot.html")
    }

}
