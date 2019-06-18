/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as p from 'path';
import { writeFileSync } from 'fs';
import { mkdirpSync } from 'fs-extra';
import printICUMessage from './print-icu-message';
const { declare } = require('@babel/helper-plugin-utils') as any;
import { types as t, PluginObj } from '@babel/core';
import {
  ObjectExpression,
  JSXAttribute,
  StringLiteral,
  JSXIdentifier,
  JSXExpressionContainer,
  Identifier,
  ObjectProperty,
  SourceLocation,
  Expression
} from '@babel/types';
import { NodePath } from '@babel/traverse';

const DEFAULT_COMPONENT_NAMES = ['FormattedMessage', 'FormattedHTMLMessage'];

const FUNCTION_NAMES = ['defineMessages'];
const EXTRACTED = Symbol('ReactIntlExtracted');
const DESCRIPTOR_PROPS = new Set(['id', 'description', 'defaultMessage']);

interface MessageDescriptor {
  id: string;
  defaultMessage?: string;
  description?: string;
}

type ExtractedMessageDescriptor = MessageDescriptor &
  Partial<SourceLocation> & { file?: string };

type MessageDescriptorPath = Record<
  keyof MessageDescriptor,
  NodePath<StringLiteral> | undefined
>;

export interface Opts {
  moduleSourceName?: string;
  enforceDefaultMessage?: boolean;
  enforceDescriptions?: boolean;
  extractSourceLocation?: boolean;
  messagesDir: string;
  overrideIdFn?(id: string, defaultMessage: string, descriptor: string): string;
  removeDefaultMessage?: boolean;
  extractFromFormatMessageCall?: boolean;
  additionalComponentNames?: string[];
}

// From https://github.com/babel/babel/blob/master/packages/babel-core/src/transformation/plugin-pass.js
interface PluginPass<O> {
  key?: string;
  file: BabelTransformationFile;
  opts: O;
  cwd: string;
  filename?: string;
}

interface BabelTransformationFile {
  opts: {
    filename: string;
    babelrc: boolean;
    configFile: boolean;
    passPerPreset: boolean;
    envName: string;
    cwd: string;
    root: string;
    plugins: unknown[];
    presets: unknown[];
    parserOpts: object;
    generatorOpts: object;
  };
  declarations: {};
  path: NodePath | null;
  ast: {};
  scope: unknown;
  metadata: {};
  code: string;
  inputMap: object | null;
}

interface State {
  ReactIntlMessages: Map<string, ExtractedMessageDescriptor>;
}

function getICUMessageValue(
  messagePath?: NodePath<StringLiteral>,
  { isJSXSource = false } = {}
) {
  if (!messagePath) {
    return '';
  }
  const message = getMessageDescriptorValue(messagePath);

  try {
    return printICUMessage(message);
  } catch (parseError) {
    if (
      isJSXSource &&
      messagePath.isLiteral() &&
      message.indexOf('\\\\') >= 0
    ) {
      throw messagePath.buildCodeFrameError(
        '[React Intl] Message failed to parse. ' +
          'It looks like `\\`s were used for escaping, ' +
          "this won't work with JSX string literals. " +
          'Wrap with `{}`. ' +
          'See: http://facebook.github.io/react/docs/jsx-gotchas.html'
      );
    }

    throw messagePath.buildCodeFrameError(
      '[React Intl] Message failed to parse. ' +
        'See: http://formatjs.io/guides/message-syntax/' +
        `\n${parseError}`
    );
  }
}

function evaluatePath(path: NodePath): string {
  const evaluated = path.evaluate();
  if (evaluated.confident) {
    return evaluated.value;
  }

  throw path.buildCodeFrameError(
    '[React Intl] Messages must be statically evaluate-able for extraction.'
  );
}

function getMessageDescriptorKey(path: NodePath) {
  if (path.isIdentifier() || path.isJSXIdentifier()) {
    return path.node.name;
  }

  return evaluatePath(path);
}

function getMessageDescriptorValue(
  path?: NodePath<StringLiteral> | NodePath<JSXExpressionContainer>
) {
  if (!path) {
    return '';
  }
  if (path.isJSXExpressionContainer()) {
    path = path.get('expression') as NodePath<StringLiteral>;
  }

  // Always trim the Message Descriptor values.
  const descriptorValue = evaluatePath(path);

  if (typeof descriptorValue === 'string') {
    return descriptorValue.trim();
  }

  return descriptorValue;
}

function createMessageDescriptor(
  propPaths: [
    NodePath<JSXIdentifier> | NodePath<Identifier>,
    NodePath<StringLiteral> | NodePath<JSXExpressionContainer>
  ][]
): MessageDescriptorPath {
  return propPaths.reduce(
    (hash: MessageDescriptorPath, [keyPath, valuePath]) => {
      const key = getMessageDescriptorKey(keyPath);

      if (DESCRIPTOR_PROPS.has(key)) {
        hash[key as 'id'] = valuePath as NodePath<StringLiteral>;
      }

      return hash;
    },
    {
      id: undefined,
      defaultMessage: undefined,
      description: undefined
    }
  );
}

function evaluateMessageDescriptor(
  descriptorPath: MessageDescriptorPath,
  isJSXSource = false,
  overrideIdFn?: Opts['overrideIdFn']
) {
  let id = getMessageDescriptorValue(descriptorPath.id);
  const defaultMessage = getICUMessageValue(descriptorPath.defaultMessage, {
    isJSXSource
  });
  const description = getMessageDescriptorValue(descriptorPath.description);

  if (overrideIdFn) {
    id = overrideIdFn(id, defaultMessage, description);
  }
  const descriptor: MessageDescriptor = {
    id
  };

  if (description) {
    descriptor.description = description;
  }
  if (defaultMessage) {
    descriptor.defaultMessage = defaultMessage;
  }

  return descriptor;
}

function storeMessage(
  { id, description, defaultMessage }: MessageDescriptor,
  path: NodePath,
  {
    enforceDescriptions,
    enforceDefaultMessage = true,
    extractSourceLocation
  }: Opts,
  filename: string,
  messages: Map<string, ExtractedMessageDescriptor>
) {
  if (!id || (enforceDefaultMessage && !defaultMessage)) {
    throw path.buildCodeFrameError(
      '[React Intl] Message Descriptors require an `id` and `defaultMessage`.'
    );
  }

  if (messages.has(id)) {
    const existing = messages.get(id);

    if (
      description !== existing!.description ||
      defaultMessage !== existing!.defaultMessage
    ) {
      throw path.buildCodeFrameError(
        `[React Intl] Duplicate message id: "${id}", ` +
          'but the `description` and/or `defaultMessage` are different.'
      );
    }
  }

  if (enforceDescriptions) {
    if (
      !description ||
      (typeof description === 'object' && Object.keys(description).length < 1)
    ) {
      throw path.buildCodeFrameError(
        '[React Intl] Message must have a `description`.'
      );
    }
  }

  let loc = {};
  if (extractSourceLocation) {
    loc = {
      file: p.relative(process.cwd(), filename),
      ...path.node.loc
    };
  }

  messages.set(id, { id, description, defaultMessage, ...loc });
}

function referencesImport(
  path: NodePath,
  mod: string,
  importedNames: string[]
) {
  if (!(path.isIdentifier() || path.isJSXIdentifier())) {
    return false;
  }

  return importedNames.some(name => path.referencesImport(mod, name));
}

function isFormatMessageCall(callee: NodePath<Expression>) {
  if (!callee.isMemberExpression()) {
    return false;
  }

  const object = callee.get('object');
  const property = callee.get('property') as NodePath<Identifier>;

  return (
    property.isIdentifier() &&
    property.node.name === 'formatMessage' &&
    // things like `intl.formatMessage`
    ((object.isIdentifier() && object.node.name === 'intl') ||
      // things like `this.props.intl.formatMessage`
      (object.isMemberExpression() &&
        (object.get('property') as NodePath<Identifier>).node.name === 'intl'))
  );
}

function assertObjectExpression(
  path: NodePath,
  callee: NodePath<Expression>
): path is NodePath<ObjectExpression> {
  if (!path || !path.isObjectExpression()) {
    throw path.buildCodeFrameError(
      `[React Intl] \`${
        (callee.get('property') as NodePath<Identifier>).node.name
      }()\` must be ` +
        'called with an object expression with values ' +
        'that are React Intl Message Descriptors, also ' +
        'defined as object expressions.'
    );
  }
  return true;
}

export default declare((api: any) => {
  api.assertVersion(7);
  /**
   * Store this in the node itself so that multiple passes work. Specifically
   * if we remove `description` in the 1st pass, 2nd pass will fail since
   * it expect `description` to be there.
   * HACK: We store this in the node instance since this persists across
   * multiple plugin runs
   */
  function tagAsExtracted(path: NodePath) {
    (path.node as any)[EXTRACTED] = true;
  }

  function wasExtracted(path: NodePath) {
    return !!(path.node as any)[EXTRACTED];
  }
  return {
    pre() {
      if (!this.ReactIntlMessages) {
        this.ReactIntlMessages = new Map();
      }
    },

    post(state) {
      const {
        file: {
          opts: { filename }
        },
        opts: { messagesDir }
      } = this;
      const basename = p.basename(filename, p.extname(filename));
      const { ReactIntlMessages: messages } = this;
      const descriptors = Array.from(messages.values());
      state.metadata['react-intl'] = { messages: descriptors };

      if (messagesDir && descriptors.length > 0) {
        // Make sure the relative path is "absolute" before
        // joining it with the `messagesDir`.
        let relativePath = p.join(p.sep, p.relative(process.cwd(), filename));
        // Solve when the window user has symlink on the directory, because
        // process.cwd on windows returns the symlink root,
        // and filename (from babel) returns the original root
        if (process.platform === 'win32') {
          const { name } = p.parse(process.cwd());
          if (relativePath.includes(name)) {
            relativePath = relativePath.slice(
              relativePath.indexOf(name) + name.length
            );
          }
        }

        const messagesFilename = p.join(
          messagesDir,
          p.dirname(relativePath),
          basename + '.json'
        );

        const messagesFile = JSON.stringify(descriptors, null, 2);

        mkdirpSync(p.dirname(messagesFilename));
        writeFileSync(messagesFilename, messagesFile);
      }
    },

    visitor: {
      JSXOpeningElement(
        path,
        {
          opts,
          file: {
            opts: { filename }
          }
        }
      ) {
        const {
          moduleSourceName = 'react-intl',
          additionalComponentNames = [],
          enforceDefaultMessage,
          removeDefaultMessage,
          overrideIdFn
        } = opts;
        if (wasExtracted(path)) {
          return;
        }

        const name = path.get('name');

        if (name.referencesImport(moduleSourceName, 'FormattedPlural')) {
          if (path.node && path.node.loc)
            console.warn(
              `[React Intl] Line ${path.node.loc.start.line}: ` +
                'Default messages are not extracted from ' +
                '<FormattedPlural>, use <FormattedMessage> instead.'
            );

          return;
        }

        if (
          name.isJSXIdentifier() &&
          (referencesImport(name, moduleSourceName, DEFAULT_COMPONENT_NAMES) ||
            additionalComponentNames.includes(name.node.name))
        ) {
          const attributes = path
            .get('attributes')
            .filter((attr): attr is NodePath<JSXAttribute> =>
              attr.isJSXAttribute()
            );

          let descriptorPath = createMessageDescriptor(
            attributes.map(attr => [
              attr.get('name') as NodePath<JSXIdentifier>,
              attr.get('value') as NodePath<StringLiteral>
            ])
          );

          // In order for a default message to be extracted when
          // declaring a JSX element, it must be done with standard
          // `key=value` attributes. But it's completely valid to
          // write `<FormattedMessage {...descriptor} />` or
          // `<FormattedMessage id={dynamicId} />`, because it will be
          // skipped here and extracted elsewhere. The descriptor will
          // be extracted only if a `defaultMessage` prop exists and
          // `enforceDefaultMessage` is `true`.
          if (
            enforceDefaultMessage === false ||
            descriptorPath.defaultMessage
          ) {
            // Evaluate the Message Descriptor values in a JSX
            // context, then store it.
            const descriptor = evaluateMessageDescriptor(
              descriptorPath,
              true,
              overrideIdFn
            );

            storeMessage(
              descriptor,
              path,
              opts,
              filename,
              this.ReactIntlMessages
            );

            attributes.forEach(attr => {
              const ketPath = attr.get('name');
              const msgDescriptorKey = getMessageDescriptorKey(ketPath);
              if (
                // Remove description since it's not used at runtime.
                msgDescriptorKey === 'description' ||
                // Remove defaultMessage if opts says so.
                (removeDefaultMessage && msgDescriptorKey === 'defaultMessage')
              ) {
                attr.remove();
              } else if (
                overrideIdFn &&
                getMessageDescriptorKey(ketPath) === 'id'
              ) {
                attr.get('value').replaceWith(t.stringLiteral(descriptor.id));
              }
            });

            // Tag the AST node so we don't try to extract it twice.
            tagAsExtracted(path);
          }
        }
      },

      CallExpression(
        path,
        {
          opts,
          file: {
            opts: { filename }
          }
        }
      ) {
        const { ReactIntlMessages: messages } = this;
        const {
          moduleSourceName = 'react-intl',
          overrideIdFn,
          removeDefaultMessage,
          extractFromFormatMessageCall
        } = opts;
        const callee = path.get('callee');

        /**
         * Process MessageDescriptor
         * @param messageDescriptor Message Descriptor
         */
        function processMessageObject(
          messageDescriptor: NodePath<ObjectExpression>
        ) {
          assertObjectExpression(messageDescriptor, callee);

          if (wasExtracted(messageDescriptor)) {
            return;
          }

          const properties = messageDescriptor.get('properties') as NodePath<
            ObjectProperty
          >[];

          const descriptorPath = createMessageDescriptor(
            properties.map(
              prop =>
                [prop.get('key'), prop.get('value')] as [
                  NodePath<Identifier>,
                  NodePath<StringLiteral>
                ]
            )
          );

          // Evaluate the Message Descriptor values, then store it.
          const descriptor = evaluateMessageDescriptor(
            descriptorPath,
            false,
            overrideIdFn
          );
          storeMessage(descriptor, messageDescriptor, opts, filename, messages);

          // Remove description since it's not used at runtime.
          messageDescriptor.replaceWith(
            t.objectExpression([
              t.objectProperty(
                t.stringLiteral('id'),
                t.stringLiteral(descriptor.id)
              ),
              ...(!removeDefaultMessage && descriptor.defaultMessage
                ? [
                    t.objectProperty(
                      t.stringLiteral('defaultMessage'),
                      t.stringLiteral(descriptor.defaultMessage)
                    )
                  ]
                : [])
            ])
          );

          // Tag the AST node so we don't try to extract it twice.
          tagAsExtracted(messageDescriptor);
        }

        // Check that this is `defineMessages` call
        if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
          const messagesObj = path.get('arguments')[0];

          if (assertObjectExpression(messagesObj, callee)) {
            messagesObj
              .get('properties')
              .map(prop => prop.get('value') as NodePath<ObjectExpression>)
              .forEach(processMessageObject);
          }
        }

        // Check that this is `intl.formatMessage` call
        if (extractFromFormatMessageCall && isFormatMessageCall(callee)) {
          const messageDescriptor = path.get('arguments')[0];
          if (messageDescriptor.isObjectExpression()) {
            processMessageObject(messageDescriptor);
          }
        }
      }
    }
  } as PluginObj<PluginPass<Opts> & State>;
});
