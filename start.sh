#!/bin/bash

# Start Neo4j instance
# GUI: http://localhost:7474/browser/
# Bolt: bolt://localhost:7687
# Username: neo4j
# Password: password
neo4j console &

# Start Apollo Server
# GUI: http://localhost:4000/
# Endpoint: http://localhost:4000/graphql
cd apollo; npm start &
cd ..

# Start TensorBoard
# GUI: http://localhost:6006/
tensorboard --logdir=logs/tensorboard &

# Start Flask Server
# Endpoint: http://localhost:5000/
cd example/gui; python3 app.py &


