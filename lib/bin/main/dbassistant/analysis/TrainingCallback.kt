package dbassistant.analysis

import org.jetbrains.kotlinx.dl.api.core.callback.Callback
import org.jetbrains.kotlinx.dl.api.core.history.*
import org.jetbrains.kotlinx.dl.dataset.Dataset

class TrainingCallback : Callback() {

    
    override fun onEpochBegin(epoch: Int, logs: TrainingHistory) {}
    override fun onEpochEnd(epoch: Int, event: EpochTrainingEvent, logs: TrainingHistory) {}
    override fun onTrainBatchBegin(batch: Int, batchSize: Int, logs: TrainingHistory) {}
    override fun onTrainBatchEnd(batch: Int, batchSize: Int, event: BatchTrainingEvent, logs: TrainingHistory) {}
    override fun onTrainBegin() {
    }
    override fun onTrainEnd(logs: TrainingHistory) {
    }
    override fun onTestBatchBegin(batch: Int, batchSize: Int, logs: History) {}
    override fun onTestBatchEnd(batch: Int, batchSize: Int, event: BatchEvent?, logs: History) {}
    override fun onTestBegin() {}
    override fun onTestEnd(logs: History) {}
    override fun onPredictBatchBegin(batch: Int, batchSize: Int) {}
    override fun onPredictBatchEnd(batch: Int, batchSize: Int) {}
    override fun onPredictBegin() {}
    override fun onPredictEnd() {}
    
}