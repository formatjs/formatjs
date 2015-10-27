/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as p from 'path';
import {writeFileSync} from 'fs';
import {sync as mkdirpSync} from 'mkdirp';
import printICUMessage from './print-icu-message';

const COMPONENT_NAMES = [
    'FormattedMessage',
    'FormattedHTMLMessage',
    'FormattedPlural',
];

const FUNCTION_NAMES = [
    'defineMessages',
];

const IMPORTED_NAMES   = new Set([...COMPONENT_NAMES, ...FUNCTION_NAMES]);
const DESCRIPTOR_PROPS = new Set(['id', 'description', 'defaultMessage']);

export default function ({Plugin, types: t}) {
    function getReactIntlOptions(options) {
        return options.extra['react-intl'] || {};
    }

    function getModuleSourceName(options) {
        return getReactIntlOptions(options).moduleSourceName || 'react-intl';
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

    function createMessageDescriptor(propPaths, options = {}) {
        const {isJSXSource = false} = options;

        return propPaths.reduce((hash, [keyPath, valuePath]) => {
            let key = getMessageDescriptorKey(keyPath);

            if (DESCRIPTOR_PROPS.has(key)) {
                let value = getMessageDescriptorValue(valuePath).trim();

                if (key === 'defaultMessage') {
                    try {
                        hash[key] = printICUMessage(value);
                    } catch (e) {
                        if (isJSXSource &&
                            valuePath.isLiteral() &&
                            value.indexOf('\\\\') >= 0) {

                            throw valuePath.errorWithNode(
                                '[React Intl] Message failed to parse. ' +
                                'It looks like `\\`s were used for escaping, ' +
                                'this won\'t work with JSX string literals. ' +
                                'Wrap with `{}`. ' +
                                'See: http://facebook.github.io/react/docs/jsx-gotchas.html'
                            );
                        }

                        throw valuePath.errorWithNode(
                            `[React Intl] Message failed to parse: ${e} ` +
                            'See: http://formatjs.io/guides/message-syntax/'
                        );
                    }
                } else {
                    hash[key] = value;
                }
            }

            return hash;
        }, {});
    }

    function createPropNode(key, value) {
        return t.property('init', t.literal(key), t.literal(value));
    }

    function storeMessage({id, description, defaultMessage}, node, file) {
        const {enforceDescriptions} = getReactIntlOptions(file.opts);
        const {messages}            = file.get('react-intl');

        if (!id) {
            throw file.errorWithNode(node,
                '[React Intl] Message is missing an `id`.'
            );
        }

        if (messages.has(id)) {
            let existing = messages.get(id);

            if (description !== existing.description ||
                defaultMessage !== existing.defaultMessage) {

                throw file.errorWithNode(node,
                    `[React Intl] Duplicate message id: "${id}", ` +
                    'but the `description` and/or `defaultMessage` are different.'
                );
            }
        }

        if (!defaultMessage) {
            let {loc} = node;
            file.log.warn(
                `[React Intl] Line ${loc.start.line}: ` +
                'Message is missing a `defaultMessage` and will not be extracted.'
            );

            return;
        }

        if (enforceDescriptions && !description) {
            throw file.errorWithNode(node,
                '[React Intl] Message must have a `description`.'
            );
        }

        messages.set(id, {id, description, defaultMessage});
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
                    const {messagesDir} = getReactIntlOptions(file.opts);
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
                },
            },

            JSXOpeningElement(node, parent, scope, file) {
                const moduleSourceName = getModuleSourceName(file.opts);

                let name = this.get('name');

                if (name.referencesImport(moduleSourceName, 'FormattedPlural')) {
                    let {loc} = node;
                    file.log.warn(
                        `[React Intl] Line ${loc.start.line}: ` +
                        'Default messages are not extracted from ' +
                        '<FormattedPlural>, use <FormattedMessage> instead.'
                    );

                    return;
                }

                if (referencesImport(name, moduleSourceName, COMPONENT_NAMES)) {
                    let attributes = this.get('attributes')
                        .filter((attr) => attr.isJSXAttribute());

                    let descriptor = createMessageDescriptor(
                        attributes.map((attr) => [
                            attr.get('name'),
                            attr.get('value'),
                        ]),
                        {isJSXSource: true}
                    );

                    // In order for a default message to be extracted when
                    // declaring a JSX element, it must be done with standard
                    // `key=value` attributes. But it's completely valid to
                    // write `<FormattedMessage {...descriptor} />`, because it
                    // will be skipped here and extracted elsewhere. When
                    // _either_ an `id` or `defaultMessage` prop exists, the
                    // descriptor will be checked; this way mixing an object
                    // spread with props will fail.
                    if (descriptor.id || descriptor.defaultMessage) {
                        storeMessage(descriptor, node, file);

                        attributes
                            .filter((attr) => {
                                let keyPath = attr.get('name');
                                let key = getMessageDescriptorKey(keyPath);
                                return key === 'description';
                            })
                            .forEach((attr) => attr.dangerouslyRemove());
                    }
                }
            },

            CallExpression(node, parent, scope, file) {
                const moduleSourceName = getModuleSourceName(file.opts);

                function processMessageObject(messageObj) {
                    if (!(messageObj && messageObj.isObjectExpression())) {
                        throw file.errorWithNode(node,
                            `[React Intl] \`${callee.node.name}()\` must be ` +
                            `called with message descriptors defined as ` +
                            `object expressions.`
                        );
                    }

                    let properties = messageObj.get('properties');

                    let descriptor = createMessageDescriptor(
                        properties.map((prop) => [
                            prop.get('key'),
                            prop.get('value'),
                        ])
                    );

                    storeMessage(descriptor, node, file);

                    messageObj.replaceWith(t.objectExpression([
                        createPropNode('id', descriptor.id),
                        createPropNode('defaultMessage', descriptor.defaultMessage),
                    ]));
                }

                let callee = this.get('callee');

                if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
                    let messagesObj = this.get('arguments')[0];

                    messagesObj.get('properties')
                        .map((prop) => prop.get('value'))
                        .forEach(processMessageObject);
                }
            },
        },
    });
}
