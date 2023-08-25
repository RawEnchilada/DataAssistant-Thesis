import * as tf from '@tensorflow/tfjs-node';
import TokenSeries from '../tokens/TokenSeries'; // Make sure to import TokenSeries and Tokenizer classes
import Tokenizer from '../tokens/Tokenizer'; // Adjust the paths according to your project structure

class QueryGenerator {
    private promptSize: number;
    private memorySize: number;
    private tokenizer: Tokenizer;
    private optimizer: tf.Optimizer;
    private loss: string;
    private model: tf.LayersModel | null = null;
    private inputLayerSize: number;
    private outputLayerSize: number;

    constructor(promptSize: number, memorySize: number, optimizer: tf.Optimizer, loss: string, tokenizer: Tokenizer) {
        this.promptSize = promptSize;
        this.memorySize = memorySize;
        this.tokenizer = tokenizer;
        this.optimizer = optimizer;
        this.loss = loss;

        this.inputLayerSize = memorySize + promptSize;
        this.outputLayerSize = tokenizer.labelCount;
    }

    evaluate(input: TokenSeries): TokenSeries {
        if (input.tokens.length > this.promptSize) {
            throw new Error('Prompt size is too large for the network; Input should\'ve been fixed to an acceptable size!');
        }

        console.log(`    Evaluating tokens: ${input}`);

        const emptyTokenId = this.tokenizer.handlerOffset(this.tokenizer.emptyTokenHandler);
        const outData: number[] = [];

        const endToken = this.tokenizer.handlerOffset(this.tokenizer.endTokenHandler);
        while (true) {
            const output = new TokenSeries(outData);
            const lastNTokens = output.lastN(this.memorySize, emptyTokenId);
            const lastN = lastNTokens.normalizeTokens(this.tokenizer.maxSize);
            const prompt = input.normalizeTokens(this.tokenizer.maxSize);
            const inData = tf.tensor2d([...lastN, ...prompt], [1, this.inputLayerSize]);

            const prediction = this.model!.predict(inData) as tf.Tensor<tf.Rank.R1>;
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

    loadModel(modelFilePath: string): void {
        this.model = tf.loadLayersModel(`file://${modelFilePath}`);
        console.log('Model loaded!');
    }

    async saveModel(modelFilePath: string): Promise<void> {
        await this.model!.save(`file://${modelFilePath}`);
        console.log('Model saved!');
    }

    loadLayers(file: string): void {
        this.tokenizer.deserialize(file);
    }

    saveLayers(file: string): void {
        this.tokenizer.serialize(file);
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
        if (inputSize !== this.inputLayerSize) {
            throw new Error('Input size is not equal to the input layer size!');
        }

        const inputsTensor = tf.tensor2d(inputs);
        const labelsTensor = tf.tensor1d(labels, 'int32');

        console.log(`Inputs shape: ${inputsTensor.shape}`);
        console.log(`Labels shape: ${labelsTensor.shape}`);
        console.log(`Output size: ${this.outputLayerSize}`);

        // Define the model architecture
        this.model = tf.sequential();
        this.model.add(tf.layers.dense({ units: 150, activation: 'relu', inputShape: [this.inputLayerSize] }));
        this.model.add(tf.layers.dense({ units: 250, activation: 'relu' }));
        this.model.add(tf.layers.dense({ units: this.outputLayerSize, activation: 'softmax' }));

        // Compile the model
        this.model.compile({
            optimizer: this.optimizer,
            loss: this.loss,
            metrics: ['accuracy']
        });

        const currentPath = '.'; // Set your desired path here

        // Train the model
        console.log(`Training started, you can follow the progress.`);
        await this.model.fit(inputsTensor, labelsTensor, {
            epochs: 500,
            batchSize: 64,
            callbacks: tf.node.tensorBoard({
                logDir: `${currentPath}/logs/tensorboard`,
                histogramFreq: 1,
                writeGraph: true
            })
        });

        // Evaluate the model
        const evaluation = await this.model.evaluate(inputsTensor, labelsTensor);
        console.log(`Accuracy: ${evaluation[1] * 100}%`);
    }

    toString(): string {
        return 'QueryGenerator Model';
    }
}

export default QueryGenerator;