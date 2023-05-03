package dbassistant.neural

import dbassistant.analysis.HistoryChart
import dbassistant.analysis.Logging
import dbassistant.analysis.TrainingCallback
import dbassistant.tokenhandlers.EmptyTokenHandler
import dbassistant.tokenhandlers.EndTokenHandler
import dbassistant.tokens.TokenSeries
import dbassistant.tokens.Tokenizer
import org.jetbrains.kotlinx.dl.api.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.paramCount
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics
import org.jetbrains.kotlinx.dl.api.core.optimizer.Momentum
import org.jetbrains.kotlinx.dl.api.core.optimizer.SGD
import java.io.File

class QueryGenerator (
    private val promptSize: Int,
    private val memorySize: Int,
    private val tokenizer: Tokenizer
){

    private lateinit var model: Sequential

    private val optimizer = SGD()
    private val loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS
    private val metric = Metrics.ACCURACY

    private val epochs = 1000
    private val batchSize = 100


    fun train(dataSource: File, trainingPlotPath:String = ""){

        val data = QueryDatasetLoader(promptSize, memorySize, tokenizer).load(dataSource)
        val dataset = QueryDataset.create(data)

        val inputNodeCount = memorySize+promptSize
        val outputNodeCount = tokenizer.maxId
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

    fun evaluate(input: TokenSeries): TokenSeries {

        if(input.tokens.size > promptSize){
            throw Exception("Prompt size is too large for the network; Input should've been fixed to an acceptable size!")
        }
        Logging.println("    Evaluating tokens: $input...")

        val emptyTokenId = EmptyTokenHandler(-1).emptyToken
        val outData = mutableListOf<Int>()

        val endToken = EndTokenHandler(-1).endToken
        var lastToken = -1
        while(lastToken != endToken && outData.size < 100){
            val output = TokenSeries(outData.toTypedArray())
            val lastNTokens = output.lastN(memorySize,emptyTokenId)
            val lastN = lastNTokens.tokens.map{
                t -> t.toFloat() / tokenizer.maxId.toFloat()
            }.toFloatArray()
            val prompt = input.normalizeTokens(tokenizer.maxId).toFloatArray()
            val inData = (lastN + prompt)
            
            //Logging.println("Evaluating input, memory: ${tokenizer.decode(lastNTokens)}  prompt: ${tokenizer.decode(input)}")

            lastToken = model.predict(inData)
            outData.add(lastToken)
            
            //Logging.println("Evaluation complete, result token:${lastToken},  decoded: ${wordMap.decode(lastToken)}")
        }
        //Logging.println("Used WordMap: $wordMap")
        val result = TokenSeries(outData.toTypedArray())

        Logging.println("    Evaluation complete, result: $result")
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