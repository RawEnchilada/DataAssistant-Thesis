import * as tf from '@tensorflow/tfjs-node';
import TokenSeries from '../tokens/TokenSeries'; // Make sure to import TokenSeries and Tokenizer classes
import Tokenizer from '../tokens/Tokenizer'; // Adjust the paths according to your project structure
import { LossOrMetricFn } from '@tensorflow/tfjs-layers/dist/types';

class QueryGenerator {
    private _promptSize: number;  public get promptSize(): number { return this._promptSize; }
    private _memorySize: number;  public get memorySize(): number { return this._memorySize; }
    private _tokenizer: Tokenizer;  public get tokenizer(): Tokenizer { return this._tokenizer; }
    private _optimizer: string|tf.Optimizer;
    private _loss: string|LossOrMetricFn;
    private _model: tf.Sequential | null = null;
    private _epochs: number;
    private _inputLayerSize: number;
    private _outputLayerSize: number;
    private _initializeModel: (model: tf.Sequential, inputSize: number, outputSize: number)=>tf.Sequential;
    
    
    /**
     * Initializes the model with the given parameters and layers.
     * 
     * @param {number} promptSize The size of the largest possible prompt.
     * @param {number} memorySize The memory size of the model. See the documentation for more.
     * @param {tf.Optimizer} optimizer The optimizer to use for training.
     * @param {string} loss The loss function to use.
     * @param {Tokenizer} tokenizer The tokenizer to use
     * @param {(model: tf.Sequential, inputSize: number, outputSize: number)=>tf.Sequential} initializeModel The function to call when the model is initialized.
     * 
     * 
     * initializeModel example:
     * ```ts
     * (model,inputSize,outputSize) => {
     *   model.add(tf.layers.dense({ units: 150, activation: 'relu', inputShape: [inputSize] }));
     *   model.add(tf.layers.dense({ units: 250, activation: 'relu' }));
     *   model.add(tf.layers.dense({ units: outputSize, activation: 'softmax' }));
     *   return model;
     * }
     * ```
     */
    constructor(promptSize: number, memorySize: number, epochs:number, optimizer: string|tf.Optimizer, loss: string|LossOrMetricFn, tokenizer: Tokenizer, initializeModel: (model: tf.Sequential, inputSize: number, outputSize: number)=>tf.Sequential) {
        this._promptSize = promptSize;
        this._memorySize = memorySize;
        this._tokenizer = tokenizer;
        this._optimizer = optimizer;
        this._loss = loss;
        this._epochs = epochs;

        this._inputLayerSize = memorySize + promptSize;
        this._outputLayerSize = tokenizer.labelCount;
        this._initializeModel = initializeModel;
    }

    evaluate(input: TokenSeries): TokenSeries {
        if (input.tokens.length > this._promptSize) {
            throw new Error('Prompt size is too large for the network; Input should\'ve been fixed to an acceptable size!');
        }

        console.log(`    Evaluating tokens: ${input}`);

        const emptyTokenId = this._tokenizer.handlerOffset(this._tokenizer.emptyTokenHandler);
        const outData: number[] = [];

        const endToken = this._tokenizer.handlerOffset(this._tokenizer.endTokenHandler);
        while (true) {
            const output = new TokenSeries(outData);
            const lastNTokens = output.lastN(this._memorySize, emptyTokenId);
            const lastN = lastNTokens.normalizeTokens(this._tokenizer.maxSize);
            const prompt = input.normalizeTokens(this._tokenizer.maxSize);
            const inData = tf.tensor2d([...(lastN.tokens), ...(prompt.tokens)], [1, this._inputLayerSize]);

            const prediction = this._model!.predict(inData) as tf.Tensor<tf.Rank.R1>;
            const predictionData = prediction.dataSync();
            const maxProbability = Math.max(...predictionData);
            const predictedLabel = predictionData.indexOf(maxProbability);
            outData.push(predictedLabel);

            console.log(`    Prediction: ${predictedLabel} (probability: ${maxProbability})`);

            if (predictedLabel === endToken || outData.length >= 100) {
                break;
            }
        }

        const result = new TokenSeries(outData);
        console.log(`    Evaluation complete, result: ${result}`);
        return result;
    }

    async loadModel(_modelFilePath: string): Promise<void> {
        this._model = await tf.loadLayersModel(`file://${_modelFilePath}`) as tf.Sequential;
        console.log('Model loaded!');
    }

    async saveModel(_modelFilePath: string): Promise<void> {
        await this._model!.save(`file://${_modelFilePath}`);
        console.log('Model saved!');
    }

    loadLayers(file: string): void {
        this._tokenizer.deserialize(file);
    }

    saveLayers(file: string): void {
        this._tokenizer.serialize(file);
    }

    async train(trainFile: string): Promise<void> {
        // Load the data from the CSV file, separator is ;
        const data = tf.data.csv(`file://${trainFile}`, { delimiter: ';' });

        // Extract the input values and labels
        const inputs: number[][] = [];
        await (data.forEachAsync((row) => {
            const inputRow = row['tokens'];
            const inputNumbers: number[] = JSON.parse(inputRow);
            inputs.push(inputNumbers);
        }));

        const labels: number[][] = [];
        await (data.forEachAsync(row => {
            const labelRow = row['labels'];
            const labelNumbers: number[] = JSON.parse(labelRow); // Convert to numbers
            labels.push(labelNumbers);
        }));

        const rowCount = inputs.length;
        const inputSize = inputs[0].length;
        if (inputSize !== this._inputLayerSize) {
            throw new Error(`Data input size ${inputSize} is not equal to the ${this._inputLayerSize} input layer size!`);
        }

        const inputsTensor = tf.tensor2d(inputs);
        const labelsTensor = tf.tensor2d(labels);

        console.log(`Input data shape: ${inputsTensor.shape}, input layer size: ${this._inputLayerSize}`);
        console.log(`Labels data shape: ${labelsTensor.shape}, output layer size: ${this._outputLayerSize}`);

        // Define the _model architecture
        this._model = tf.sequential();
        this._model = this._initializeModel(this._model, this._inputLayerSize, this._outputLayerSize);

        // Compile the _model
        this._model.compile({
            optimizer: this._optimizer,
            loss: this._loss,
            metrics: ['accuracy']
        });

        // Train the _model
        console.log('Training started, you can follow the progress via Tensorboard in the logs directory!');
        await this._model.fit(inputsTensor, labelsTensor, {
            epochs: this._epochs,
            callbacks: tf.node.tensorBoard('../logs/tensorboard')
        });

        // Evaluate the _model
        const evaluation = this._model.evaluate(inputsTensor, labelsTensor);
        console.log(`Accuracy: ${evaluation[1] * 100}%`);
    }
}

export default QueryGenerator;