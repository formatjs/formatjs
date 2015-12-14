import express from 'express';
import * as p from 'path';

const app = express();

app.get('/', (req, res) => res.sendFile(p.resolve('index.html')));

app.get('/translations', (req, res) => {
    res.json({
        hello: 'Hello',
        world: 'World',
    });
});

app.use(express.static('build'));
app.use(express.static('../../node_modules'));

app.listen(8080, () => {
    console.log('React Intl Example server listening at: http://localhost:8080');
});
