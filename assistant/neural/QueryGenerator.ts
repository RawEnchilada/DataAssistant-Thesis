import * as tf from '@tensorflow/tfjs-node';
import TokenSeries from '../tokens/TokenSeries'; // Make sure to import TokenSeries and Tokenizer classes
import Tokenizer from '../tokens/Tokenizer'; // Adjust the paths according to your project structure

class QueryGenerator {
    private _promptSize: number;  public get promptSize(): number { return this._promptSize; }
    private _memorySize: number;  public get memorySize(): number { return this._memorySize; }
    private _tokenizer: Tokenizer;  public get tokenizer(): Tokenizer { return this._tokenizer; }
    private _optimizer: tf.Optimizer;
    private _loss: string;
    private _model: tf.LayersModel | null = null;
    private _inputLayerSize: number;
    private _outputLayerSize: number;

    constructor(promptSize: number, memorySize: number, optimizer: tf.Optimizer, loss: string, tokenizer: Tokenizer) {
        this._promptSize = promptSize;
        this._memorySize = memorySize;
        this._tokenizer = tokenizer;
        this._optimizer = optimizer;
        this._loss = loss;

        this._inputLayerSize = memorySize + promptSize;
        this._outputLayerSize = tokenizer.labelCount;
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
            const inData = tf.tensor2d([...lastN, ...prompt], [1, this._inputLayerSize]);

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

    loadModel(_modelFilePath: string): void {
        this._model = tf.loadLayersModel(`file://${_modelFilePath}`);
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
        const data = await tf.data.csv(trainFile, { delimiter: ';' });

        // Extract the input values and labels
        const inputArrays = await data.column(0).toArray() as string[];
        const inputs: number[][] = inputArrays.map(inputArrayString => {
            const inputArray = inputArrayString.slice(1, -1).split(',').map(Number);
            return inputArray;
        });

        const labelArrays = await data.column(1).toArray() as string[];
        const labels: number[] = labelArrays.map(labelArrayString => {
            const labelArray = labelArrayString.slice(1, -1).split(',').map(Number);
            const label = labelArray.findIndex(val => val === Math.max(...labelArray));
            return label;
        });

        const rowCount = inputs.length;
        const inputSize = inputs[0].length;
        if (inputSize !== this._inputLayerSize) {
            throw new Error('Input size is not equal to the input layer size!');
        }

        const inputsTensor = tf.tensor2d(inputs);
        const labelsTensor = tf.tensor1d(labels, 'int32');

        console.log(`Inputs shape: ${inputsTensor.shape}`);
        console.log(`Labels shape: ${labelsTensor.shape}`);
        console.log(`Output size: ${this._outputLayerSize}`);

        // Define the _model architecture
        this._model = tf.sequential();
        this._model.add(tf.layers.dense({ units: 150, activation: 'relu', inputShape: [this._inputLayerSize] }));
        this._model.add(tf.layers.dense({ units: 250, activation: 'relu' }));
        this._model.add(tf.layers.dense({ units: this._outputLayerSize, activation: 'softmax' }));

        // Compile the _model
        this._model.compile({
            _optimizer: this._optimizer,
            _loss: this._loss,
            metrics: ['accuracy']
        });

        const currentPath = '.'; // Set your desired path here

        // Train the _model
        console.log(`Training started, you can follow the progress.`);
        await this._model.fit(inputsTensor, labelsTensor, {
            epochs: 500,
            batchSize: 64,
            callbacks: tf.node.tensorBoard({
                logDir: `${currentPath}/logs/tensorboard`,
                histogramFreq: 1,
                writeGraph: true
            })
        });

        // Evaluate the _model
        const evaluation = await this._model.evaluate(inputsTensor, labelsTensor);
        console.log(`Accuracy: ${evaluation[1] * 100}%`);
    }

    toString(): string {
        return 'QueryGenerator Model';
    }
}

export default QueryGenerator;