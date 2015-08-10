import * as path from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {sync as mkdirpSync} from 'mkdirp';

const COMPONENT_NAMES = [
    'FormattedMessage',
    'FormattedHTMLMessage',
];

const FUNCTION_NAMES = [
    'formatMessage',
    'formatHTMLMessage',
];

const IMPORTED_NAMES = new Set([...COMPONENT_NAMES, ...FUNCTION_NAMES]);
const ATTR_WHITELIST = new Set(['id', 'description', 'defaultMessage']);

export default function ({Plugin, types: t}) {
    function referencesImport(node, mod, importedNames) {
        if (!(t.isIdentifier(node) || t.isJSXIdentifier(node))) {
            return false;
        }

        return importedNames.some((name) => node.referencesImport(mod, name));
    }

    function checkMessageId(messages, message, node, file) {
        if (!message.id) {
            throw file.errorWithNode(node,
                'React Intl message is missing an `id`.'
            );
        }

        if (messages.hasOwnProperty(message.id)) {
            throw file.errorWithNode(node,
                `Duplicate React Intl message id: "${message.id}"`
            );
        }
    }

    return new Plugin('react-intl', {
        visitor: {
            Program: {
                enter(node, parent, scope, file) {
                    const {moduleSourceName} = file.opts.extra.reactIntl;
                    const {imports} = file.metadata.modules;

                    let hasReactIntlMessages = imports.some((mod) => {
                        if (mod.source === moduleSourceName) {
                            return mod.imported.some((name) => {
                                return IMPORTED_NAMES.has(name);
                            });
                        }
                    });

                    if (hasReactIntlMessages) {
                        file.reactIntl = {
                            messages: {}
                        };
                    } else {
                        this.skip();
                    }
                },

                exit(node, parent, scope, file) {
                    const {basename, filename} = file.opts;
                    const {messagesDir} = file.opts.extra.reactIntl;

                    let messagesFilename = path.join(
                        messagesDir, path.dirname(filename), basename + '.json'
                    );

                    let {messages}   = file.reactIntl;
                    let messagesFile = JSON.stringify(messages, null, 2);

                    mkdirpSync(path.dirname(messagesFilename));
                    writeFileSync(messagesFilename, messagesFile);
                }
            },

            JSXOpeningElement(node, parent, scope, file) {
                const {moduleSourceName} = file.opts.extra.reactIntl;
                let name = this.get('name');

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    let message = node.attributes
                        .filter((attr) => ATTR_WHITELIST.has(attr.name.name))
                        .reduce((message, attr) => {
                            message[attr.name.name] = attr.value.value;
                            return message;
                        }, {});

                    let {messages} = file.reactIntl;

                    checkMessageId(messages, message, node, file);
                    Object.assign(messages, {[message.id]: message});
                }
            },

            CallExpression(node, parent, scope, file) {
                const {moduleSourceName} = file.opts.extra.reactIntl;

                let callee = this.get('callee');
                let messageArg = node.arguments[1];

                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES) &&
                    t.isObjectExpression(messageArg)) {

                    let message = messageArg.properties
                        .filter((prop) => ATTR_WHITELIST.has(prop.key.name))
                        .reduce((message, prop) => {
                            message[prop.key.name] = prop.value.value;
                            return message;
                        }, {});

                    let {messages} = file.reactIntl;

                    checkMessageId(messages, message, node, file);
                    Object.assign(messages, {[message.id]: message});
                }
            }
        }
    });
}
