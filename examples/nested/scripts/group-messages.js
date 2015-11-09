import * as fs from 'fs';
import * as p from 'path';
import {sync as globSync} from 'glob';
import {sync as mkdirpSync} from 'mkdirp';

const MESSAGES_PATTERN = './build/messages/**/*.json';
const LANG_DIR         = './build/lang/';

// Groups the default messages by namespace that were extracted from the example
// app's React components via the React Intl Babel plugin. An error will be
// thrown if there are messages in the same namespace use the same `id`. The
// result is a collection of namespaced collections of `id: message` pairs for
// the app's default locale, "en-US".
let namespacedMessages = globSync(MESSAGES_PATTERN)
    .map((filename) => fs.readFileSync(filename, 'utf8'))
    .map((file) => JSON.parse(file))
    .reduce((collections, descriptors) => {
        descriptors.forEach(({id, defaultMessage}) => {
            let namespace  = id.split('.')[0];
            let collection = collections[namespace];

            if (!collection) {
                collection = collections[namespace] = {};
            }

            if (collection.hasOwnProperty(id)) {
                throw new Error(`Duplicate message id: ${id}`);
            }

            collection[id] = defaultMessage;
        });

        return collections;
    }, {});

Object.keys(namespacedMessages).forEach((namespace) => {
    let collection = namespacedMessages[namespace];
    let filename   = p.join(LANG_DIR, namespace, 'en-US.json');

    mkdirpSync(p.dirname(filename));
    fs.writeFileSync(filename, JSON.stringify(collection, null, 2));
});
