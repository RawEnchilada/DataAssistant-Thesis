import {IDBConnection} from "data-assistant";

export default class Apollo implements IDBConnection {
    connect(): void {
        // Implement connect method
    }

    disconnect(): void {
        // Implement disconnect method
    }

    query(graphqlQuery: string): any {
        const url = 'http://localhost:4000/';
        const headers = { 'Content-Type': 'application/json' };
        const query = `query { ${graphqlQuery} }`;

        const response = fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ query: query })
        }).then(response => response.json());

        return response;
    }
}