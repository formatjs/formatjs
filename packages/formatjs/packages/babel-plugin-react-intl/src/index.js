import * as p from 'path';
import {writeFileSync} from 'fs';
import {sync as mkdirpSync} from 'mkdirp';

const COMPONENT_NAMES = [
    'FormattedMessage',
    'FormattedHTMLMessage',
];

const FUNCTION_NAMES = [
    'formatMessage',
    'formatHTMLMessage',
];

const IMPORTED_NAMES   = new Set([...COMPONENT_NAMES, ...FUNCTION_NAMES]);
const DESCRIPTOR_PROPS = new Set(['id', 'description', 'defaultMessage']);

export default function ({Plugin, types: t}) {
    function getModuleSourceName(options) {
        const reactIntlOptions = options.extra['react-intl'] || {};
        return reactIntlOptions.moduleSourceName || 'react-intl';
    }

    function getMessagesDir(options) {
        const reactIntlOptions = options.extra['react-intl'] || {};
        return reactIntlOptions.messagesDir;
    }

    function getMessageDescriptor(propertiesMap) {
        // Force property order on descriptors.
        let descriptor = [...DESCRIPTOR_PROPS].reduce((descriptor, key) => {
            descriptor[key] = undefined;
            return descriptor;
        }, {});

        for (let [key, value] of propertiesMap) {
            key = getMessageDescriptorKey(key);

            if (DESCRIPTOR_PROPS.has(key)) {
                // TODO: Should this be trimming values?
                descriptor[key] = getMessageDescriptorValue(value).trim();
            }
        }

        return descriptor;
    }

    function getMessageDescriptorKey(path) {
        if (path.isIdentifier() || path.isJSXIdentifier()) {
            return path.node.name;
        }

        let evaluated = path.evaluate();
        if (evaluated.confident) {
            return evaluated.value;
        }
    }

    function getMessageDescriptorValue(path) {
        if (path.isJSXExpressionContainer()) {
            path = path.get('expression');
        }

        let evaluated = path.evaluate();
        if (evaluated.confident) {
            return evaluated.value;
        }

        if (path.isTemplateLiteral() && path.get('expressions').length === 0) {
            let str = path.get('quasis')
                .map((quasi) => quasi.node.value.cooked)
                .reduce((str, value) => str + value);

            return str;
        }

        throw path.errorWithNode(
            '[React Intl] Messages must be statically evaluate-able for extraction.'
        );
    }

    function storeMessage(descriptor, node, file) {
        const {id}       = descriptor;
        const {messages} = file.get('react-intl');

        if (!id) {
            throw file.errorWithNode(node,
                '[React Intl] Message is missing an `id`.'
            );
        }

        if (messages.has(id)) {
            throw file.errorWithNode(node,
                `[React Intl] Duplicate message id: "${id}"`
            );
        }

        if (!descriptor.defaultMessage) {
            let {loc} = node;
            file.log.warn(
                `[React Intl] Line ${loc.start.line}: ` +
                `Message "${id}" is missing a \`defaultMessage\` ` +
                `and will not be extracted.`
            );
            return;
        }

        messages.set(id, descriptor);
    }

    function referencesImport(path, mod, importedNames) {
        if (!(path.isIdentifier() || path.isJSXIdentifier())) {
            return false;
        }

        return importedNames.some((name) => path.referencesImport(mod, name));
    }

    return new Plugin('react-intl', {
        visitor: {
            Program: {
                enter(node, parent, scope, file) {
                    const moduleSourceName = getModuleSourceName(file.opts);
                    const {imports} = file.metadata.modules;

                    let mightHaveReactIntlMessages = imports.some((mod) => {
                        if (mod.source === moduleSourceName) {
                            return mod.imported.some((name) => {
                                return IMPORTED_NAMES.has(name);
                            });
                        }
                    });

                    if (mightHaveReactIntlMessages) {
                        file.set('react-intl', {
                            messages: new Map(),
                        });
                    } else {
                        this.skip();
                    }
                },

                exit(node, parent, scope, file) {
                    const {messages}  = file.get('react-intl');
                    const messagesDir = getMessagesDir(file.opts);
                    const {basename, filename} = file.opts;

                    let descriptors = [...messages.values()];
                    file.metadata['react-intl'] = {messages: descriptors};

                    if (messagesDir) {
                        let messagesFilename = p.join(
                            messagesDir,
                            p.dirname(p.relative(process.cwd(), filename)),
                            basename + '.json'
                        );

                        let messagesFile = JSON.stringify(descriptors, null, 2);

                        mkdirpSync(p.dirname(messagesFilename));
                        writeFileSync(messagesFilename, messagesFile);
                    }
                }
            },

            JSXOpeningElement(node, parent, scope, file) {
                const moduleSourceName = getModuleSourceName(file.opts);
                let name = this.get('name');

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    let attributes = this.get('attributes')
                        .map((attr) => [attr.get('name'), attr.get('value')]);

                    let descriptor = getMessageDescriptor(new Map(attributes));
                    storeMessage(descriptor, node, file);
                }
            },

            CallExpression(node, parent, scope, file) {
                const moduleSourceName = getModuleSourceName(file.opts);

                let callee = this.get('callee');

                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
                    let messageArg = this.get('arguments')[1];
                    if (!messageArg) {
                        throw file.errorWithNode(node,
                            `[React Intl] \`${callee.node.name}()\` requires ` +
                            `a message descriptor as the second argument.`
                        );
                    }

                    if (!(messageArg && messageArg.isObjectExpression())) {
                        let {loc} = messageArg.node;
                        file.log.warn(
                            `[React Intl] Line ${loc.start.line}: ` +
                            `\`${callee.node.name}()\` must use an inline ` +
                            `object expression for the message to be extracted.`
                        );
                        return;
                    }

                    let properties = messageArg.get('properties')
                        .map((prop) => [prop.get('key'), prop.get('value')]);

                    let descriptor = getMessageDescriptor(new Map(properties));
                    storeMessage(descriptor, node, file);
                }
            }
        }
    });
}
