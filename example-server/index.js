import http from 'http';
import querystring from 'querystring';
import url from 'url';
import { pipeline, env } from '@xenova/transformers';

class TrainedDataAssistantPipeline {
    static task = 'question-answering';
    static model = 'tuned-gql-assistant';
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            env.cacheDir = './.cache';
            env.localModelPath = '../data/models/';
            env.allowRemoteModels = false;

            this.instance = pipeline(this.task, this.model, { progress_callback });
        }

        return this.instance;
    }
}

const app = express();
const port = 3000;

const currentPath = path.dirname(new URL(import.meta.url).pathname);

app.use(express.static(path.join(currentPath, 'public')));
app.set('views', path.join(currentPath, 'views'));

async function runQuery(query){
    const url = 'http://localhost:4000/';
    const headers = { 'Content-Type': 'application/json' };
    const query = `query { ${query} }`;

    const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: query })
    }).then(response => response.json());

    return response;
}

server.on('request', async (req, res) => {
    const parsedUrl = url.parse(req.url);
    const { text } = querystring.parse(parsedUrl.query);

    res.setHeader('Content-Type', 'application/json');

    let response;
    if (parsedUrl.pathname === '/respond' && text) {
        const generator = await TrainedDataAssistantPipeline.getInstance();
        response = await generator(text, {
            max_new_tokens: 100
        });
        res.statusCode = 200;
    } else {
        response = { 'error': 'Bad request' }
        res.statusCode = 400;
    }
    res.end(JSON.stringify(response));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(currentPath, 'views/index.html'));
});

app.get('/evaluate/:text', async (req, res) => {
    const generator = await TrainedDataAssistantPipeline.getInstance();
    const result = await generator(req.params.text, {
        max_new_tokens: 100
    });
    res.json(result);
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
