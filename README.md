# DataAssistant

DataAssistant is an artificial intelligence library that can generate GraphQL queries from natural language prompts, with the help of a specifically trained neural network.

The project uses a chat version of [TinyLlama](https://github.com/jzhang38/TinyLlama) to retrain the model using a provided dataset.

## Why?

The goal of this project is to create a tool that can help users, developers and database administrators to easily query databases without having to learn SQL or other query languages.


## Advantages

-  **Easy to use**: The user only needs to write a natural language prompt, and the library will generate the corresponding query.

-  **Single point of entry**: Using the recommended [Apollo Graphql Server](https://www.apollographql.com/docs/apollo-server/) as a backend, the user can query multiple databases using a single endpoint, without having to migrate data or change the database schema.

-  **Flexibility**: The library can be used with any database, parts of your database schema should be passed to the model to get better results.



## Setup

### Preparation

By default the model tries to use an ROCm instance. Change your pip packages accordingly.

Install Python requirements using:
```bash
pip install -r requirements.txt
```
### Commands

App Arguments:

- --action (evaluate/serve/train/visualize) What action to perform with the model
    - evaluate: Run some examples on the model and store the results in results.json
    - serve: Run a simple REST API that can generate a query for a request
    - train: Train the model using the 'data/training_data.json' dataset
    - visualize: Create a head view and a model view using [BertViz](https://github.com/jessevig/bertviz)
- --dtype (float16/float32) What data type to use with your model
- --device (gpu/cpu) Which device to run the model on

Before training the model will download a version of TinyLlama-Chat model to fine tune, then it will save the model to the 'model' directory.

After training the 'evaluate', 'serve' and 'visualize' actions will load the trained model from the 'model' directory.

## Training Data

The library uses a neural network to generate queries from natural language prompts, and the neural network needs to be trained with a dataset of natural language prompts and their corresponding queries.

You can find the training data used for the example in the `data/training_data.json` file.


## Documentation

[Thesis and technical documentation](https://drive.google.com/file/d/1dv3wYUtqWzl_mzrPydMyEx4TXKFjVOY1/view?usp=drive_link)
