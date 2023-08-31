import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';
import express from 'express';
import path from 'path';
import * as assistant from "data-assistant";
import Apollo from './apollo.ts';
import ApolloGlossaryHandlerFactory from './GlossaryHandlerFactory.ts';


const app = express();
const port = 3000;

const currentPath = path.dirname(new URL(import.meta.url).pathname);

app.use(express.static(path.join(currentPath, 'public')));
app.set('views', path.join(currentPath, 'views'));

const promptSize = 20;
const memorySize = 10;
const argumentSize = 5;
const wordSize = 150;

const epochs = 500;

const optimizer = tf.train.momentum(0.01,0.9,true); // Nesterovs momentum optimizer

const loss = "categoricalCrossentropy";//assistant.extras.focalLoss(2.0,0.25);

const tokenizer = new assistant.Tokenizer(new ApolloGlossaryHandlerFactory(new Apollo()),promptSize, argumentSize, wordSize);
await tokenizer.initialize();

const modelInitializer = (model:tf.Sequential,inputSize:number,outputSize:number) => {
    model.add(tf.layers.dense({ units: 150, activation: 'relu', inputShape: [inputSize] }));
    model.add(tf.layers.dense({ units: 250, activation: 'relu' }));
    model.add(tf.layers.dense({ units: outputSize, activation: 'softmax' }));
    return model;
}

const queryGenerator = new assistant.QueryGenerator(promptSize, memorySize, epochs, optimizer, loss, tokenizer, modelInitializer);

const dbassistant = new assistant.DataAssistant(queryGenerator, tokenizer, promptSize);


//if app has argument of --train, train the model
if (process.argv.indexOf('--train') > -1) {
    await dbassistant.convertData(path.join(currentPath,"./training_data.csv"),path.join(currentPath,"./model/training_data_converted.csv"));
    await dbassistant.train(path.join(currentPath,"./model/training_data_converted.csv"));
    dbassistant.saveModel(currentPath + "/model/model.h5");
    dbassistant.saveLayers(currentPath + "/model/model.layers");
} 
else if (fs.existsSync(path.join(currentPath,'model/model.h5'))) {
    dbassistant.loadModel(currentPath + "/model/model.h5");
    dbassistant.loadLayers(currentPath + "/model/model.layers");
    tokenizer.genericTokenHandler.mutable = true;
}


app.get('/', (req, res) => {
    res.sendFile(path.join(currentPath, 'views/index.html'));
});

app.get('/train', async (req, res) => {
    await dbassistant.convertData(path.join(currentPath,"./training_data.csv"),path.join(currentPath,"./model/training_data_converted.csv"));
    await dbassistant.train(path.join(currentPath,"./model/training_data_converted.csv"));
    res.send('Training finished');
});

app.get('/evaluate/:text', (req, res) => {
    const result = dbassistant.evaluate(req.params.text);
    res.json(result);
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});