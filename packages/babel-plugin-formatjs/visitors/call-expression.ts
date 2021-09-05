import {NodePath, PluginPass} from '@babel/core'
import * as t from '@babel/types'
import {Options, State} from '../types'
import {VisitNodeFunction} from '@babel/traverse'
import {
  createMessageDescriptor,
  evaluateMessageDescriptor,
  wasExtracted,
  storeMessage,
  tagAsExtracted,
} from '../utils'
import {parse} from '@formatjs/icu-messageformat-parser'

function assertObjectExpression(
  path: NodePath<any>,
  callee: NodePath<t.Expression | t.V8IntrinsicIdentifier>
): asserts path is NodePath<t.ObjectExpression> {
  if (!path || !path.isObjectExpression()) {
    throw path.buildCodeFrameError(
      `[React Intl] \`${
        (callee.get('property') as NodePath<t.Identifier>).node.name
      }()\` must be called with an object expression with values that are React Intl Message Descriptors, also defined as object expressions.`
    )
  }
}

function isFormatMessageCall(
  callee: NodePath<t.Expression | t.V8IntrinsicIdentifier | t.MemberExpression>,
  functionNames: string[]
) {
  if (functionNames.find(name => callee.isIdentifier({name}))) {
    return true
  }

  if (callee.isMemberExpression()) {
    const property = callee.get('property') as NodePath<t.MemberExpression>
    return !!functionNames.find(name => property.isIdentifier({name}))
  }
  return false
}

function getMessagesObjectFromExpression(
  nodePath: NodePath<any>
): NodePath<any> {
  let currentPath = nodePath
  while (
    t.isTSAsExpression(currentPath.node) ||
    t.isTSTypeAssertion(currentPath.node) ||
    t.isTypeCastExpression(currentPath.node)
  ) {
    currentPath = currentPath.get('expression') as NodePath<any>
  }
  return currentPath
}

export const visitor: VisitNodeFunction<PluginPass & State, t.CallExpression> =
  function (
    path,
    {
      opts,
      file: {
        opts: {filename},
      },
    }
  ) {
    const {
      overrideIdFn,
      idInterpolationPattern,
      removeDefaultMessage,
      ast,
      preserveWhitespace,
    } = opts as Options
    if (wasExtracted(path)) {
      return
    }
    const {messages, functionNames} = this
    const callee = path.get('callee')
    const args = path.get('arguments')

    /**
     * Process MessageDescriptor
     * @param messageDescriptor Message Descriptor
     */
    function processMessageObject(
      messageDescriptor: NodePath<t.ObjectExpression>
    ) {
      assertObjectExpression(messageDescriptor, callee)

      const properties = messageDescriptor.get(
        'properties'
      ) as NodePath<t.ObjectProperty>[]

      const descriptorPath = createMessageDescriptor(
        properties.map(
          prop =>
            [prop.get('key'), prop.get('value')] as [
              NodePath<t.Identifier>,
              NodePath<t.StringLiteral>
            ]
        )
      )

      // If the message is already compiled, don't re-compile it
      if (descriptorPath.defaultMessage?.isArrayExpression()) {
        return
      }

      // Evaluate the Message Descriptor values, then store it.
      const descriptor = evaluateMessageDescriptor(
        descriptorPath,
        false,
        filename || undefined,
        idInterpolationPattern,
        overrideIdFn,
        preserveWhitespace
      )
      storeMessage(
        descriptor,
        messageDescriptor,
        opts as Options,
        filename || undefined,
        messages
      )

      const firstProp = properties[0]
      const defaultMessageProp = properties.find(prop => {
        const keyProp = prop.get('key')
        return (
          keyProp.isIdentifier({name: 'defaultMessage'}) ||
          keyProp.isStringLiteral({value: 'defaultMessage'})
        )
      })
      const idProp = properties.find(prop => {
        const keyProp = prop.get('key')
        return (
          keyProp.isIdentifier({name: 'id'}) ||
          keyProp.isStringLiteral({value: 'id'})
        )
      })

      // Insert ID potentially 1st before removing nodes
      if (idProp) {
        idProp.get('value').replaceWith(t.stringLiteral(descriptor.id))
      } else {
        firstProp.insertBefore(
          t.objectProperty(t.identifier('id'), t.stringLiteral(descriptor.id))
        )
      }

      // Remove description
      properties
        .find(prop => {
          const keyProp = prop.get('key')
          return (
            keyProp.isIdentifier({name: 'description'}) ||
            keyProp.isStringLiteral({value: 'description'})
          )
        })
        ?.remove()

      // Pre-parse or remove defaultMessage
      if (defaultMessageProp) {
        if (removeDefaultMessage) {
          defaultMessageProp?.remove()
        } else if (descriptor.defaultMessage) {
          const valueProp = defaultMessageProp.get('value')
          if (ast) {
            valueProp.replaceWithSourceString(
              JSON.stringify(parse(descriptor.defaultMessage))
            )
          } else {
            valueProp.replaceWith(t.stringLiteral(descriptor.defaultMessage))
          }
        }
      }

      tagAsExtracted(path)
    }

    // Check that this is `defineMessages` call
    if (
      callee.isIdentifier({name: 'defineMessages'}) ||
      callee.isIdentifier({name: 'defineMessage'})
    ) {
      const firstArgument = args[0]
      const messagesObj = getMessagesObjectFromExpression(firstArgument)

      assertObjectExpression(messagesObj, callee)
      if (callee.isIdentifier({name: 'defineMessage'})) {
        processMessageObject(messagesObj as NodePath<t.ObjectExpression>)
      } else {
        const properties = messagesObj.get('properties')
        if (Array.isArray(properties)) {
          properties
            .map(prop => prop.get('value') as NodePath<t.ObjectExpression>)
            .forEach(processMessageObject)
        }
      }
    }

    // Check that this is `intl.formatMessage` call
    if (isFormatMessageCall(callee, functionNames)) {
      const messageDescriptor = args[0]
      if (messageDescriptor.isObjectExpression()) {
        processMessageObject(messageDescriptor)
      }
    }
  }
