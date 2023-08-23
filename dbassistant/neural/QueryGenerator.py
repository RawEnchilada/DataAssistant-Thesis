import os
import numpy as np
import pandas as pd
from keras.models import Sequential
from keras.layers import Dense, Activation
from keras.utils import np_utils
from keras.models import model_from_json
from keras.models import load_model
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.callbacks import TensorBoard
from dbassistant.analysis.Logging import Logging
from dbassistant.tokens.TokenSeries import TokenSeries
from dbassistant.tokens.Tokenizer import Tokenizer

class QueryGenerator:
    def __init__(self, promptSize, memorySize, optimizer, loss, tokenizer):
        self.promptSize = promptSize
        self.memorySize = memorySize
        self.tokenizer = tokenizer
        self.optimizer = optimizer
        self.loss = loss

        self.model = None
        self.inputLayerSize = memorySize + promptSize
        self.outputLayerSize = tokenizer.labelCount

    def evaluate(self, input:TokenSeries):
        if len(input.tokens) > self.promptSize:
            raise Exception("Prompt size is too large for the network; Input should've been fixed to an acceptable size!")

        Logging.println("    Evaluating tokens: {}...".format(input))

        emptyTokenId = self.tokenizer.handlerOffset(self.tokenizer.emptyTokenHandler)
        outData = []

        endToken = self.tokenizer.handlerOffset(self.tokenizer.endTokenHandler)
        while True:
            output = TokenSeries(outData)
            lastNTokens = output.lastN(self.memorySize, emptyTokenId)
            lastN = lastNTokens.normalizeTokens(self.tokenizer.maxSize)
            prompt = input.normalizeTokens(self.tokenizer.maxSize)
            inData = np.array(lastN + prompt).reshape(1, self.inputLayerSize)

            prediction = self.model.predict(inData)[0]
            maxProbability = np.max(prediction)
            predictedLabel = np.argmax(prediction)
            outData.append(predictedLabel)

            Logging.println("    Prediction: {} (probability: {})".format(predictedLabel, maxProbability))

            if predictedLabel == endToken or len(outData) >= 100:
                break

        result = TokenSeries(outData)
        Logging.println("    Evaluation complete, result: {}".format(result))
        return result

    def loadModel(self, modelFilePath):
        self.model = load_model(modelFilePath)
        Logging.println("Model loaded!")

    def saveModel(self, modelFilePath):
        self.model.save(modelFilePath)
        Logging.println("Model saved!")

    def loadLayers(self, file):
        self.tokenizer.deserialize(file)

    def saveLayers(self, file):
        self.tokenizer.serialize(file)


    def train(self,train_file: str):

        # Load the data from the CSV file, separator is ;
        data = pd.read_csv(train_file, sep=';', header=0)

        # Extract the input values and labels
        # inputs : Array<Array<Float>>
        # labels : Array<Array<Float>>
        inputArrays = data.iloc[:, 0].values
        inputs = []
        for inputArrayString in inputArrays:
            # convert string to array of floats, remove the first and last "
            inputArrayString = inputArrayString[1:-1]
            inputArray = inputArrayString.split(',')
            inputArray = [float(i) for i in inputArray]
            inputs.append(np.array(inputArray))


        labelArrays = data.iloc[:, 1].values
        labels = []
        for labelArrayString in labelArrays:
            # convert string to array of floats
            labelArrayString = labelArrayString[1:-1]
            labelArray = labelArrayString.split(',')
            labelArray = [float(i) for i in labelArray]
            label_count = len(labelArray)
            label = np.argmax(labelArray)
            labels.append(label)

        # Convert inputs and labels to numpy arrays
        row_count = len(inputs)
        input_size = len(inputs[0])
        if input_size != self.inputLayerSize:
            raise Exception("Input size is not equal to the input layer size!")
        inputs = np.array(inputs).reshape(row_count, self.inputLayerSize)
        labels = np.array(labels).reshape(row_count)

        print(f'Inputs shape: {inputs.shape}')
        print(f'Labels shape: {labels.shape}')
        print(f'Output size: {label_count}')

        # Define the model architecture
        self.model = keras.Sequential([
            layers.Dense(150, activation='relu', input_shape=(self.inputLayerSize,)),
            layers.Dense(250, activation='relu'),
            layers.Dense(label_count, activation='softmax')
        ])

        # Compile the model
        self.model.compile(optimizer=self.optimizer,
                    loss=self.loss,
                    metrics=['accuracy'])

        current_path = Logging.currentDir

        # Set up TensorBoard callback
        tensorboard_callback = TensorBoard(log_dir=f'{current_path}/logs/tensorboard', histogram_freq=1, write_graph=True)


        print(f'Training started, you can follow the progress with Tensorboard by running \"tensorboard --logdir {current_path}/logs/tensorboard\"')
        # Train the model with TensorBoard callback
        self.model.fit(inputs, labels, epochs=500, batch_size=64, callbacks=[tensorboard_callback])

        # Evaluate the model
        _, accuracy = self.model.evaluate(inputs, labels)
        print(f'Accuracy: {accuracy * 100}%')

    def __str__(self):
        text = "QueryGenerator Model"
        return text

