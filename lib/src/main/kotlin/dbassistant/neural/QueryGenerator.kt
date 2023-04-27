package dbassistant.neural

import dbassistant.analysis.HistoryChart
import dbassistant.analysis.Logging
import dbassistant.analysis.TrainingCallback
import dbassistant.preprocessing.Tokenizer
import dbassistant.preprocessing.Tokens
import dbassistant.preprocessing.WordMap
import org.jetbrains.kotlinx.dl.api.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.core.*
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics
import org.jetbrains.kotlinx.dl.api.core.optimizer.Adam
import java.io.File

class QueryGenerator (
    private val wordMap: WordMap
){

    private lateinit var model: Sequential
    private val tokenizer = Tokenizer(wordMap)

    private val optimizer = Adam()
    private val loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS
    private val metric = Metrics.ACCURACY


    fun train(dataSource: File, trainingPlotPath:String = ""){

        val data = QueryDatasetLoader(wordMap).load(dataSource)
        val dataset = QueryDataset.create(data)

        val hiddenNodeCount = (wordMap.maxPromptSize+wordMap.maxId)/2

        model = Sequential.of(
            Input((wordMap.maxPromptSize+wordMap.memorySize).toLong()),
            Dense(hiddenNodeCount),
            Dense(1+wordMap.maxArgumentCount+wordMap.maxId)
        )

        model.compile(
            optimizer = optimizer,
            loss = loss,
            metric = metric
        )

        val history = model.fit(
            dataset = dataset,
            epochs = 1000,
            batchSize = 100,
            listOf(TrainingCallback())
        )
        
        if(trainingPlotPath != ""){
            HistoryChart(history).save(trainingPlotPath)
        }
    }

    fun saveModel(modelFilePath:String){
        model.save(File(modelFilePath),savingFormat = SavingFormat.JSON_CONFIG_CUSTOM_VARIABLES, writingMode = WritingMode.OVERRIDE)
    }

    fun loadModel(modelFilePath:String){
        val path = File(modelFilePath)
        model = Sequential.loadDefaultModelConfiguration(path)
        model.compile(
            optimizer = optimizer,
            loss = loss,
            metric = metric
        )
        model.loadWeights(path)
    }

    fun evaluate(input: Tokens): Tokens {

        if(input.tokens.size > wordMap.maxPromptSize){
            throw Exception("Prompt size is too large for the network; Input should've been fixed to an acceptable size!")
        }

        val emptyTokenId = wordMap.encodeToken("_")
        val outData = mutableListOf<Int>()

        val endToken = wordMap.endTokenId
        var lastToken = -1
        while(lastToken != endToken && outData.size < 100){
            val output = Tokens(outData.toTypedArray(),wordMap)
            val lastNTokens = output.lastN(wordMap.memorySize,emptyTokenId)
            val lastN = lastNTokens.tokens.map{
                t -> t.toFloat() / wordMap.maxId.toFloat()
            }.toFloatArray()
            val prompt = input.normalizedTokens.toFloatArray()
            val inData = (lastN + prompt)
            
            Logging.println("Evaluating input, memory: ${tokenizer.decode(lastNTokens)}  prompt: ${tokenizer.decode(input)}")

            lastToken = model.predict(inData)
            outData.add(lastToken)
            
            Logging.println("Evaluation complete, result token:${lastToken},  decoded: ${wordMap.decode(lastToken)}")
        }


        return Tokens(outData.toTypedArray(),input.wordMap)
    }

}