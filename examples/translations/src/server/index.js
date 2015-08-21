import express from 'express';
import {sync as globSync} from 'glob';
import {readFileSync} from 'fs';
import * as path from 'path';

const translations = globSync('./build/lang/*.json')
    .map((filename) => [
        path.basename(filename, '.json'),
        readFileSync(filename, 'utf8')
    ])
    .map(([locale, file]) => [locale, JSON.parse(file)])
    .reduce((collection, [locale, messages]) => {
        collection[locale] = messages;
        return collection;
    }, {});

const app = express();

app.use(express.static('node_modules'));
app.use(express.static('build'));

app.get('/', (req, res) => {
    let locale   = req.query.locale || 'en-US';
    let messages = translations[locale];

    if (!messages) {
        return res.status(404).send('Locale is not supported.');
    }

    res.send(
`
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>React Intl Translations Example</title>
</head>
<body>
    <div id="container"></div>
    <script>
        window.App = {
            locale  : ${JSON.stringify(locale)},
            messages: ${JSON.stringify(messages, null, 2)}
        };
    </script>
    <script src="https://cdn.polyfill.io/v1/polyfill.min.js?features=Intl.~locale.en"></script>
    <script src="react/dist/react.js"></script>
    <script src="bundle.js"></script>
</body>
</html>
`
    );
});

app.listen(8080, () => {
    console.log('React Intl Example server listening at: http://localhost:3000');
});
