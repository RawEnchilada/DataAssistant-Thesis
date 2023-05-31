from dbassistant.interfaces.IDBConnection import IDBConnection 

class Apollo(IDBConnection):

    def connect(self):
        pass

    def disconnect(self):
        pass

    def query(self, graphql_query):
        import requests
        import json

        url = 'http://localhost:4000/'
        headers = {'Content-Type': 'application/json'}
        query = "query { " + graphql_query + " }"
        response = requests.post(url, json={'query': query}, headers=headers)
        return json.loads(response.text)