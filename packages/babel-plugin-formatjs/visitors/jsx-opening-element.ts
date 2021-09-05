import {NodePath, PluginPass} from '@babel/core'

import {Options, State} from '../types'
import * as t from '@babel/types'
import {VisitNodeFunction} from '@babel/traverse'
import {parse} from '@formatjs/icu-messageformat-parser'
import {
  createMessageDescriptor,
  evaluateMessageDescriptor,
  getMessageDescriptorKey,
  storeMessage,
  tagAsExtracted,
  wasExtracted,
} from '../utils'

export const visitor: VisitNodeFunction<
  PluginPass & State,
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
    removeDefaultMessage,
    idInterpolationPattern,
    overrideIdFn,
    ast,
    preserveWhitespace,
  } = opts as Options

  const {componentNames, messages} = this
  if (wasExtracted(path)) {
    return
  }

  const name = path.get('name')

  if (!componentNames.find(n => name.isJSXIdentifier({name: n}))) {
    return
  }

  const attributes = path
    .get('attributes')
    .filter(attr => attr.isJSXAttribute())

  const descriptorPath = createMessageDescriptor(
    attributes.map(attr => [
      attr.get('name') as NodePath<t.JSXIdentifier>,
      attr.get('value') as
        | NodePath<t.StringLiteral>
        | NodePath<t.JSXExpressionContainer>,
    ])
  )

  // In order for a default message to be extracted when
  // declaring a JSX element, it must be done with standard
  // `key=value` attributes. But it's completely valid to
  // write `<FormattedMessage {...descriptor} />`, because it will be
  // skipped here and extracted elsewhere. The descriptor will
  // be extracted only (storeMessage) if a `defaultMessage` prop.
  if (!descriptorPath.defaultMessage) {
    return
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
  )

  storeMessage(
    descriptor,
    path,
    opts as Options,
    filename || undefined,
    messages
  )

  let idAttr: NodePath<t.JSXAttribute> | undefined
  let descriptionAttr: NodePath<t.JSXAttribute> | undefined
  let defaultMessageAttr: NodePath<t.JSXAttribute> | undefined
  const firstAttr = attributes[0]
  for (const attr of attributes) {
    if (!attr.isJSXAttribute()) {
      continue
    }
    switch (
      getMessageDescriptorKey((attr as NodePath<t.JSXAttribute>).get('name'))
    ) {
      case 'description':
        descriptionAttr = attr
        break
      case 'defaultMessage':
        defaultMessageAttr = attr
        break
      case 'id':
        idAttr = attr
        break
    }
  }

  // Insert ID before removing node to prevent null node insertBefore
  if (overrideIdFn || (descriptor.id && idInterpolationPattern)) {
    if (idAttr) {
      idAttr.get('value').replaceWith(t.stringLiteral(descriptor.id))
    } else if (firstAttr) {
      firstAttr.insertBefore(
        t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(descriptor.id))
      )
    }
  }

  if (descriptionAttr) {
    descriptionAttr.remove()
  }

  if (defaultMessageAttr) {
    if (removeDefaultMessage) {
      defaultMessageAttr.remove()
    } else if (ast && descriptor.defaultMessage) {
      defaultMessageAttr
        .get('value')
        .replaceWith(t.jsxExpressionContainer(t.nullLiteral()))
      const valueAttr = defaultMessageAttr.get(
        'value'
      ) as NodePath<t.JSXExpressionContainer>
      valueAttr
        .get('expression')
        .replaceWithSourceString(
          JSON.stringify(parse(descriptor.defaultMessage))
        )
    }
  }

  // Tag the AST node so we don't try to extract it twice.
  tagAsExtracted(path)
}
