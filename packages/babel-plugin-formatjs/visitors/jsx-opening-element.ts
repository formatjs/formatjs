import {NodePath, PluginPass} from '@babel/core';

import {State} from '../types';
import * as t from '@babel/types';
import {VisitNodeFunction} from '@babel/traverse';
import {OptionsSchema} from '../options';
import {parse} from 'intl-messageformat-parser';
import {
  createMessageDescriptor,
  evaluateMessageDescriptor,
  getMessageDescriptorKey,
  storeMessage,
  tagAsExtracted,
  wasExtracted,
} from '../utils';
import template from '@babel/template';
export const visitor: VisitNodeFunction<
  PluginPass<OptionsSchema> & State,
  t.JSXOpeningElement
> = function (
  path,
  {
    opts,
    file: {
      opts: {filename},
    },
  }
) {
  const {
    additionalComponentNames = [],
    removeDefaultMessage,
    idInterpolationPattern,
    overrideIdFn,
    ast,
    preserveWhitespace,
  } = opts;
  const messages = this.ReactIntlMessages;
  if (wasExtracted(path)) {
    return;
  }

  const name = path.get('name');

  if (
    !name.isJSXIdentifier({name: 'FormattedMessage'}) &&
    !additionalComponentNames.find(n => name.isJSXIdentifier({name: n}))
  ) {
    return;
  }

  const attributes = path
    .get('attributes')
    .filter(attr => attr.isJSXAttribute());

  const descriptorPath = createMessageDescriptor(
    attributes.map(attr => [
      attr.get('name') as NodePath<t.JSXIdentifier>,
      attr.get('value') as NodePath<t.StringLiteral>,
    ])
  );

  // In order for a default message to be extracted when
  // declaring a JSX element, it must be done with standard
  // `key=value` attributes. But it's completely valid to
  // write `<FormattedMessage {...descriptor} />`, because it will be
  // skipped here and extracted elsewhere. The descriptor will
  // be extracted only (storeMessage) if a `defaultMessage` prop.
  if (!descriptorPath.id && !descriptorPath.defaultMessage) {
    return;
  }

  // Evaluate the Message Descriptor values in a JSX
  // context, then store it.
  const descriptor = evaluateMessageDescriptor(
    descriptorPath,
    true,
    filename || undefined,
    idInterpolationPattern,
    overrideIdFn,
    preserveWhitespace
  );

  storeMessage(descriptor, path, opts, filename || undefined, messages);

  let idAttr: NodePath<t.JSXAttribute> | undefined;
  let descriptionAttr: NodePath<t.JSXAttribute> | undefined;
  let defaultMessageAttr: NodePath<t.JSXAttribute> | undefined;
  for (const attr of attributes) {
    if (!attr.isJSXAttribute()) {
      continue;
    }
    switch (
      getMessageDescriptorKey((attr as NodePath<t.JSXAttribute>).get('name'))
    ) {
      case 'description':
        descriptionAttr = attr;
        break;
      case 'defaultMessage':
        defaultMessageAttr = attr;
        break;
      case 'id':
        idAttr = attr;
        break;
    }
  }

  if (descriptionAttr) {
    descriptionAttr.remove();
  }

  if (defaultMessageAttr) {
    if (removeDefaultMessage) {
      defaultMessageAttr.remove();
    } else if (ast && descriptor.defaultMessage) {
      defaultMessageAttr
        .get('value')
        .replaceWith(
          t.jsxExpressionContainer(
            template.expression`${JSON.stringify(
              parse(descriptor.defaultMessage)
            )}`()
          )
        );
    }
  }

  if (overrideIdFn || (descriptor.id && idInterpolationPattern)) {
    if (idAttr) {
      idAttr.get('value').replaceWith(t.stringLiteral(descriptor.id));
    } else if (defaultMessageAttr) {
      defaultMessageAttr.insertBefore(
        t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(descriptor.id))
      );
    }
  }

  // Tag the AST node so we don't try to extract it twice.
  tagAsExtracted(path);
};
