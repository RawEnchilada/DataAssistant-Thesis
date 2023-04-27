package dbassistant.analysis


import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import org.jetbrains.kotlinx.dl.api.core.history.TrainingHistory
import space.kscience.plotly.Plotly
import space.kscience.plotly.export
import space.kscience.plotly.models.*
import space.kscience.plotly.plot
import space.kscience.plotly.toHTML
import java.awt.Color
import java.awt.Font
import java.io.File


class HistoryChart(
    private val trainingHistory: TrainingHistory
){

    fun save(path:String) {
        val epochs = trainingHistory.epochHistory.map { it.epochIndex }

        // create the loss trace
        val lossTrace = Trace {
            x.set(epochs)
            y.set(trainingHistory.epochHistory.map { it.lossValue })
            name = "Loss"
        }

        // create the validation loss trace
        val valLossTrace = Trace {
            x.set(epochs)
            y.set(trainingHistory.epochHistory.map { it.valLossValue })
            name = "Validation Loss"
        }
        
        val batches = trainingHistory.batchHistory.map { it.batchIndex }

        // create the batch loss trace
        val batchLossTrace = Trace {
            x.set(batches)
            y.set(trainingHistory.batchHistory.map { it.lossValue })
            name = "Batch Loss"
        }

        // create the chart and add the traces and layout
        val chart = Plotly.plot {
            traces(lossTrace, valLossTrace)
        }
        
        // create the accuracy trace
        val accuracyTrace = Trace {
            x.set(epochs)
            y.set(trainingHistory.epochHistory.map { it.metricValues[0] })
            name = "Accuracy"
        }

        // add the accuracy trace to the chart
        chart.traces(accuracyTrace)
        
        val plot = chart.toHTML()
        
        File(path).writeText(plot)
    }

}