package graphai.neural

import graphai.preprocessing.Tokens
import org.jetbrains.kotlinx.dl.api.core.*
import org.jetbrains.kotlinx.dl.api.core.layer.core.*
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics
import org.jetbrains.kotlinx.dl.api.core.optimizer.Adam
import org.jetbrains.kotlinx.dl.api.inference.TensorFlowInferenceModel
import java.io.File

class QueryGenerator {

    lateinit var model: TensorFlowInferenceModel
    private val inputCount = 100L

    private val modelFilePath = "models/query.model"

    init{
    }

    fun train(data: String){

        val dataset

        model = Sequential.of(
            Input(inputCount),
            Dense(150),
            Dense(200)
        )

        (model as Sequential).use {
            it.compile(
                optimizer = Adam(),
                loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS,
                metric = Metrics.ACCURACY
            )

            it.fit(
                dataset = dataset,
                epochs = 10,
                batchSize = 100
            )
        }
    }

    fun saveModel(){
        (model as Sequential).save(File(modelFilePath), writingMode = WritingMode.OVERRIDE)
    }

    fun loadModel(){
        model = TensorFlowInferenceModel.load(File(modelFilePath))
    }

    fun evaluate(input: Tokens):Tokens{
        val data = input.normalizedTokens.toFloatArray()
        (model as Sequential).predict(data)
    }

}