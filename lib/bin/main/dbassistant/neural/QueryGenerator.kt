package dbassistant.neural

import dbassistant.analysis.HistoryData
import dbassistant.analysis.Logging
import dbassistant.analysis.TrainingCallback
import dbassistant.tokenhandlers.EmptyTokenHandler
import dbassistant.tokenhandlers.EndTokenHandler
import dbassistant.tokens.TokenSeries
import dbassistant.tokens.Tokenizer
import org.jetbrains.kotlinx.dl.api.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.paramCount
import org.jetbrains.kotlinx.dl.api.core.layer.Layer
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics
import org.jetbrains.kotlinx.dl.api.core.optimizer.Momentum
import org.jetbrains.kotlinx.dl.api.core.optimizer.SGD
import org.jetbrains.kotlinx.dl.api.core.history.TrainingHistory
import org.jetbrains.kotlinx.dl.api.core.optimizer.Optimizer
import java.io.File
import kotlin.random.Random

class QueryGenerator (
    private val promptSize: Int,
    private val memorySize: Int,
    private var tokenizer: Tokenizer,
    private var optimizer: Optimizer = SGD(),
    private var hiddenLayerSizes: Array<Int> = arrayOf(
        (memorySize+promptSize+tokenizer.maxId)/2,
        (memorySize+promptSize+tokenizer.maxId)/2
    )
){

    private lateinit var model: Sequential

    private val loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS
    private var metric = Metrics.ACCURACY

    private val epochs = 1000
    private val batchSize = 100

    private val inputLayerSize = (memorySize+promptSize)
    private val outputLayerSize = tokenizer.maxId

    


    fun analyzeModel(dataSource:File){

        train(dataSource)

        val minNodeCount = tokenizer.genericTokenHandler.learnedTokens.count { w->w!="" }
        val maxNodeCount = (tokenizer.maxId*2)

        var bestLoss = Double.MAX_VALUE
        var bestAccuracy = 0.0
        var bestLayers:String = ""
        var bestOptimizer:String = "SGD"

        val maxTries = 100

        Logging.println("Starting $maxTries training sessions to optimize layer sizes...")

        for(i in 0 until maxTries){
            tokenizer = tokenizer.copyUntrained()

            val layerCount = Random.nextInt(1,4)
            val layers = mutableListOf<Int>()

            var layersDescription = "["
            for(n in 0 until layerCount){
                val size = Random.nextInt(minNodeCount,maxNodeCount)
                layers.add(size)
                layersDescription += "$size,"
            }
            hiddenLayerSizes = layers.toTypedArray()
            layersDescription = "${layersDescription.dropLast(1)}]"

            var optimizerName = "Momentum"
            if(Random.nextBoolean()){
                optimizer = Momentum()
            }
            else{
                optimizer = SGD()
                optimizerName = "SGD"
            }


            Logging.disable()
            val history = HistoryData(train(dataSource))
            Logging.enable()

            val accuracy = history.reachedAccuracy
            val loss = history.reachedLoss

            Logging.println("    - [${i.toDouble()/maxTries.toDouble()}%] : $optimizerName | $layersDescription | Accuracy: $accuracy | Loss: $loss")

            if(loss < bestLoss){
                bestLoss = loss
                bestAccuracy = accuracy
                bestLayers = layersDescription
                bestOptimizer = optimizerName
            }

        }
        Logging.println("Best configuration in this session: $bestOptimizer | $bestLayers | Accuracy: $bestAccuracy | Loss: $bestLoss")

    }


    fun train(dataSource: File): TrainingHistory{

        val data = QueryDatasetLoader(promptSize, memorySize, tokenizer).load(dataSource)
        val dataset = QueryDataset.create(data)

        Logging.println("Creating new model...")

        val hiddenLayers = mutableListOf<Dense>()
        for(size in hiddenLayerSizes){
            hiddenLayers.add(Dense(size))
        }

        model = Sequential.of(
            Input(inputLayerSize.toLong()),
            *(hiddenLayers.toTypedArray()),
            Dense(outputLayerSize)
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
        
        endTraining()

        Logging.println("Model initialization finished:\n${toString()}")
        return history
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

        val emptyTokenId = tokenizer.handlerOffset(tokenizer.emptyTokenHandler)
        val outData = mutableListOf<Int>()

        val endToken = tokenizer.handlerOffset(tokenizer.endTokenHandler)
        var lastToken = -1
        do{
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
        }while(lastToken != endToken && outData.size < 100)
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