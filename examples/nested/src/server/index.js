import express from 'express';
import {sync as globSync} from 'glob';
import {readFileSync} from 'fs';
import * as p from 'path';
import serialize from 'serialize-javascript';

const messages = globSync('./build/lang/*/en-US.json')
    .map((filename) => [
        p.basename(p.dirname(filename)),
        readFileSync(filename, 'utf8'),
    ])
    .map(([namespace, file]) => [namespace, JSON.parse(file)])
    .reduce((messages, [namespace, collection]) => {
        messages[namespace] = collection;
        return messages;
    }, {});

const app = express();

app.get('/', (req, res) => {
    res.send(
`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>React Intl Nested Messages Example</title>
</head>
<body>
    <div id="container"></div>
    <script>
        window.App = ${serialize({locale: 'en-US', messages})};
    </script>
    <script src="https://cdn.polyfill.io/v1/polyfill.min.js?features=Intl.~locale.en"></script>
    <script src="react/dist/react.js"></script>
    <script src="react-dom/dist/react-dom.js"></script>
    <script src="bundle.js"></script>
</body>
</html>
`
    );
});

app.use(express.static('build'));
app.use(express.static('../../node_modules'));

app.listen(8080, () => {
    console.log('React Intl Example server listening at: http://localhost:8080');
});
