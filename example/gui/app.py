import sys

sys.path.append('../..')

from dbassistant.analysis.Logging import Logging
from dbassistant.DBAssistant import DBAssistant
from dbassistant.layers.DeTokenizationLayer import DeTokenizationLayer
from dbassistant.layers.EnTokenizationLayer import EnTokenizationLayer
from dbassistant.layers.EvaluationLayer import EvaluationLayer
from dbassistant.layers.PromptPreparationLayer import PromptPreparationLayer
from dbassistant.layers.QueryPreparationLayer import QueryPreparationLayer
from dbassistant.neural.QueryGenerator import QueryGenerator
from tensorflow.keras.optimizers import SGD
from tensorflow.keras.losses import SparseCategoricalCrossentropy
from focal_loss import SparseCategoricalFocalLoss
from dbassistant.tokens.Tokenizer import Tokenizer
from example.Apollo import Apollo
from example.GlossaryHandlerFactory import ApolloGlossaryHandlerFactory
from flask import Flask, render_template
from flask_cors import CORS
import os

current_path = os.path.dirname(os.path.realpath(__file__+ "/../.."))
Logging.setPath(current_path)

# apollo is running on localhost:4000
app = Flask(__name__)
CORS(app)


prompt_size = 20
memory_size = 10
argument_size = 5
word_size = 150

optimizer = SGD(learning_rate=0.01, momentum=0.9, nesterov=True)
loss = SparseCategoricalFocalLoss(gamma=2.0)

tokenizer = Tokenizer(ApolloGlossaryHandlerFactory(Apollo()),prompt_size, argument_size, word_size)

queryGenerator = QueryGenerator(prompt_size, memory_size, optimizer, loss, tokenizer)

dbassistant = DBAssistant(queryGenerator, tokenizer, prompt_size)

if not os.path.exists(current_path + "/model"):
    os.makedirs(current_path + "/model")
    
#load model if exists
if os.path.exists(current_path + "/model/model.h5"):
    dbassistant.load_model(current_path + "/model/model.h5")
    dbassistant.load_layers(current_path + "/model")
    tokenizer.genericTokenHandler._mutable = True

def fetch(graphql_query):
    import requests
    import json

    url = 'http://localhost:4000/'
    headers = {'Content-Type': 'application/json'}
    query = "query { " + graphql_query + " }"
    response = requests.post(url, json={'query': query}, headers=headers)
    return json.loads(response.text)



def train():
    training_file = current_path + "/example/training_data.csv"
    processed_file = current_path + "/model/training_data_converted.csv"
    dbassistant.convert_data(training_file, processed_file)
    dbassistant.train(processed_file)
    dbassistant.save_model(current_path + "/model/model.h5")
    dbassistant.save_layers(current_path + "/model")

def evaluate(text):
    result = dbassistant.evaluate(text)
    json = {"result": result}
    return json


@app.route("/")
def home():
   return render_template('index.html')

@app.route("/train")
def train_route():
    train()
    return "Training finished"

@app.route("/evaluate/<text>")
def evaluate_route(text):
    return evaluate(text)

if __name__ == '__main__':
    app.run()
