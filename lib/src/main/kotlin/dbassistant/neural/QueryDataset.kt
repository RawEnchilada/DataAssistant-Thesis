package dbassistant.neural

import dbassistant.analysis.Logging
import dbassistant.preprocessing.Tokenizer
import dbassistant.preprocessing.WordMap
import org.jetbrains.kotlinx.dl.dataset.Dataset
import org.jetbrains.kotlinx.dl.dataset.OnHeapDataset
import java.io.File


data class TrainingData(
    val inputArray:Array<FloatArray>,
    val output:FloatArray,
)


object QueryDataset{
    fun create(data: TrainingData):Dataset{
        return OnHeapDataset.create(data.inputArray,data.output)
    }
}



class QueryDatasetLoader(
    private val wordMap: WordMap
){

    /**
     * dataSource should be a a csv file with the following format: "prompt;query"
     * prompt and query should be a list of words separated by spaces
     */
    fun load(dataSource: File): TrainingData {
        //prompt and query should be encoded with the following class:
        val tokenizer = Tokenizer(wordMap)

        val inputs = MutableList(0) { FloatArray(0) }
        val outputs = MutableList(0) { 0f }
        val emptyTokenId = wordMap.encodeToken("_")

        //Logging.println("Processing training data:")

        dataSource.forEachLine { line ->
            wordMap.clearArguments()
            val (prompt, fullQuery) = line.split(";")
            val promptTokens = tokenizer.encode(prompt)
            if(promptTokens.tokens.size > wordMap.maxPromptSize)throw Exception("Prompt size is larger than the input layer of the model!")
            val fullQueryTokens = tokenizer.encode(fullQuery)

            //here we reproduce the recursive evaluation of the model.
            for(i in 0 until fullQueryTokens.tokens.size){
                val subQueryTokens = fullQueryTokens.slice(0,i)
                val input = subQueryTokens.lastN(wordMap.memorySize,emptyTokenId).append(promptTokens)
                //Logging.println("input: $input")
                val output = fullQueryTokens.tokens[i]
                //Logging.println("output: $output")
                if(output == 0)break

                val inputArray = input.normalizedTokens.toFloatArray()
                inputs.add(inputArray)
                outputs.add(output.toFloat())
                //Logging.println("---------------------")
            }

        }
        //Logging.println("Used WordMap: $wordMap")
        Logging.println("Generated ${outputs.size} rows of training data.")
        return TrainingData(inputs.toTypedArray(),outputs.toFloatArray())
    }
}
