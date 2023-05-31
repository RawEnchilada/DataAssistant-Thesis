# Python file that takes in the following arguments:
# train {file_path}, example: python3 main.py train model/training_data.csv
#   runs dbassistant/neural/Trainer.py
# evaluate {text}, example: python3 main.py evaluate "What is the weather like today?"
#   runs dbassistant/DBAssistant.py
import sys

sys.path.append('..')

from dbassistant.analysis.Logging import Logging
from dbassistant.DBAssistant import DBAssistant
from dbassistant.neural.QueryGenerator import QueryGenerator
from tensorflow.keras.optimizers import SGD
from tensorflow.keras.losses import SparseCategoricalCrossentropy
from focal_loss import SparseCategoricalFocalLoss
from dbassistant.tokens.Tokenizer import Tokenizer
from example.GlossaryHandlerFactory import ApolloGlossaryHandlerFactory
from example.Apollo import Apollo
import os


current_path = os.path.dirname(os.path.realpath(__file__+ "/.."))
Logging.setPath(current_path)

if __name__ == "__main__":

    if len(sys.argv) < 2:
        print("Please provide arguments: train {file_path} or evaluate {text}")
        exit(1)

    #dbconfig = lambda: None
    #dbconfig.url = "0.0.0.0"
    #dbconfig.db = "exampledb"
    #dbconfig.user = "root"
    #dbconfig.password = "root"

    #orient = Orient(dbconfig)

    prompt_size = 20
    memory_size = 10
    argument_size = 5
    word_size = 150

    optimizer = SGD(learning_rate=0.01, momentum=0.9, nesterov=True)
    loss = SparseCategoricalFocalLoss(gamma=2.0)

    tokenizer = Tokenizer(ApolloGlossaryHandlerFactory(Apollo()),prompt_size, argument_size, word_size)

    queryGenerator = QueryGenerator(prompt_size, memory_size, optimizer, loss, tokenizer)

    dbassistant = DBAssistant(queryGenerator, tokenizer, prompt_size)

    if sys.argv[1] == "train":
        if len(sys.argv) < 3:
            print("Please provide a file path to the training data")
            exit(1)

        train_file = sys.argv[2]
        if not os.path.isfile(train_file):
            print("Please provide a valid file path to the training data")
            exit(1)

        process_file = current_path + "/model/training_data_converted.csv"

        dbassistant.convert_data(train_file, process_file)

        dbassistant.train(process_file)
        dbassistant.save_model(current_path + "/model/model.h5")
        dbassistant.save_layers(current_path + "/model")
        result = dbassistant.evaluate("Where does Alice live?")
        print(result)

    elif sys.argv[1] == "evaluate":
        if len(sys.argv) < 3:
            print("Please provide a text to evaluate")
            exit(1)

        if not os.path.isfile(current_path + "/model/model.h5"):
            print("Model missing! Please train the model first")
            exit(1)
        
        if not os.path.isfile(current_path + "/model/generic_tokens.layer") or not os.path.isfile(current_path + "/model/glossary_tokens.layer"):
            print("Layers missing! Please train the model first")
            exit(1)

        text = sys.argv[2]

        dbassistant.load_model(current_path + "/model/model.h5")
        dbassistant.load_layers(current_path + "/model")
        result = dbassistant.evaluate(text)
        print(result)

    else:
        print("Please provide arguments: train {file_path} or evaluate {text}")
        exit(1)

