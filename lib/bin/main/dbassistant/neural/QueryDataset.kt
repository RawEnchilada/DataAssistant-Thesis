package dbassistant.neural

import dbassistant.analysis.Logging
import dbassistant.tokenhandlers.EmptyTokenHandler
import dbassistant.tokens.Tokenizer
import dbassistant.layers.PromptPreparationLayer
import dbassistant.layers.LayerCargo
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
    private val promptSize: Int,
    private val memorySize: Int,
    private val  tokenizer: Tokenizer
){

    /**
     * dataSource should be a a csv file with the following format: "prompt;query"
     * prompt and query should be a list of words separated by spaces
     */
    fun load(dataSource: File): TrainingData {

        val inputs = MutableList(0) { FloatArray(0) }
        val outputs = MutableList(0) { 0f }
        val emptyTokenId = EmptyTokenHandler(-1).emptyToken
        val promptPreparationLayer = PromptPreparationLayer(promptSize)

        //Logging.println("Processing training data:")

        dataSource.forEachLine { line ->
            tokenizer.resetState()
            val (prompt, fullQuery) = line.split(";")
            var cargo = LayerCargo(prompt)
            val preparedPrompt = promptPreparationLayer.pass(cargo).take() as List<String>
            val promptTokens = tokenizer.encode(preparedPrompt)
            if(promptTokens.tokens.size > promptSize)throw Exception("Prompt size is larger than the input layer of the model!")
            val preparedQuery = promptPreparationLayer.pass(cargo.put(fullQuery)).take() as List<String>
            val fullQueryTokens = tokenizer.encode(preparedQuery)

            //here we reproduce the recursive evaluation of the model.
            for(i in 0 until fullQueryTokens.tokens.size){
                val subQueryTokens = fullQueryTokens.slice(0,i)
                val input = subQueryTokens.lastN(memorySize,emptyTokenId).append(promptTokens)
                //Logging.println("input: $input")
                val output = fullQueryTokens.tokens[i]
                //Logging.println("output: $output")
                if(output == 0)break

                val inputArray = input.normalizeTokens(tokenizer.maxId).toFloatArray()
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
