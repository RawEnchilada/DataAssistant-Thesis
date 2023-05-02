package dbassistant.neural

import dbassistant.analysis.HistoryChart
import dbassistant.analysis.Logging
import dbassistant.analysis.TrainingCallback
import dbassistant.preprocessing.Tokenizer
import dbassistant.preprocessing.Tokens
import dbassistant.preprocessing.WordMap
import org.jetbrains.kotlinx.dl.api.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.paramCount
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics
import org.jetbrains.kotlinx.dl.api.core.optimizer.Momentum
import org.jetbrains.kotlinx.dl.api.core.optimizer.SGD
import java.io.File

class QueryGenerator (
    private val wordMap: WordMap
){

    private lateinit var model: Sequential
    private val tokenizer = Tokenizer(wordMap)

    private val optimizer = SGD()
    private val loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS
    private val metric = Metrics.ACCURACY

    private val epochs = 1000
    private val batchSize = 100


    fun train(dataSource: File, trainingPlotPath:String = ""){
        wordMap.startTraining()
        val data = QueryDatasetLoader(wordMap).load(dataSource)
        val dataset = QueryDataset.create(data)

        val inputNodeCount = wordMap.memorySize+wordMap.maxPromptSize
        val outputNodeCount = wordMap.maxOverallId
        val hiddenNodeCount = (inputNodeCount+outputNodeCount)/2

        Logging.println("Creating new model...")

        model = Sequential.of(
            Input(inputNodeCount.toLong()),
            Dense(hiddenNodeCount),
            Dense(hiddenNodeCount),
            Dense(outputNodeCount)
        )

        Logging.println("Compiling model...")

        model.compile(
            optimizer = optimizer,
            loss = loss,
            metric = metric
        )

        Logging.println("Training model over $epochs times, with a batch size of $batchSize...")

        val history = model.fit(
            dataset = dataset,
            epochs = epochs,
            batchSize = batchSize,
            listOf(TrainingCallback())
        )
        
        Logging.println("Saving metrics...")

        if(trainingPlotPath != ""){
            HistoryChart(history).save(trainingPlotPath)
        }
        wordMap.endTraining()
        endTraining()

        Logging.println("Model initialization finished:\n${toString()}")
    }

    fun saveModel(modelFilePath:String){
        model.save(File(modelFilePath),savingFormat = SavingFormat.JSON_CONFIG_CUSTOM_VARIABLES, writingMode = WritingMode.OVERRIDE)
    }

    fun loadModel(modelFilePath:String){
        Logging.println("Loading pre-trained model from disk...")
        val path = File(modelFilePath)
        model = Sequential.loadDefaultModelConfiguration(path)

        Logging.println("Compiling model...")

        model.compile(
            optimizer = optimizer,
            loss = loss,
            metric = metric
        )
        model.loadWeights(path)

        Logging.println("Model initialization finished:\n${toString()}")
    }

    fun evaluate(input: Tokens): Tokens {

        if(input.tokens.size > wordMap.maxPromptSize){
            throw Exception("Prompt size is too large for the network; Input should've been fixed to an acceptable size!")
        }
        Logging.println("    Evaluating tokens: $input...")

        val emptyTokenId = wordMap.encodeToken("_")
        val outData = mutableListOf<Int>()

        val endToken = wordMap.endTokenId
        var lastToken = -1
        while(lastToken != endToken && outData.size < 100){
            val output = Tokens(outData.toTypedArray(),wordMap)
            val lastNTokens = output.lastN(wordMap.memorySize,emptyTokenId)
            val lastN = lastNTokens.tokens.map{
                t -> t.toFloat() / wordMap.maxOverallId.toFloat()
            }.toFloatArray()
            val prompt = input.normalizedTokens.toFloatArray()
            val inData = (lastN + prompt)
            
            //Logging.println("Evaluating input, memory: ${tokenizer.decode(lastNTokens)}  prompt: ${tokenizer.decode(input)}")

            lastToken = model.predict(inData)
            outData.add(lastToken)
            
            //Logging.println("Evaluation complete, result token:${lastToken},  decoded: ${wordMap.decode(lastToken)}")
        }
        //Logging.println("Used WordMap: $wordMap")
        val result = Tokens(outData.toTypedArray(),input.wordMap)

        Logging.println("    Evaluation complete, result: $result")
        Logging.println("    Stored arguments:\n${wordMap.printArguments()}")
        Logging.println(wordMap.glossary.toString(1+wordMap.maxArgumentCount+wordMap.maxWordCount))
        return result
    }

    private fun endTraining(){
        model.freeze() //probably not necessary?
    }

    override fun toString(): String {
        var text = """
            QueryGenerator Model data:
              Optimizer: ${optimizer.toString()},
              Layers: """.trimIndent()
        for (layer in model.layers){
            text += "\n    ${layer.name} - ${layer.paramCount}"
        }
        return text
    }

}