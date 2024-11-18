import * as t from '@babel/types'
import {parse} from '@formatjs/icu-messageformat-parser'
import {interpolateName} from '@formatjs/ts-transformer'

import {NodePath} from '@babel/core'
import {
  ExtractedMessageDescriptor,
  MessageDescriptor,
  MessageDescriptorPath,
  Options,
} from './types'

const DESCRIPTOR_PROPS = new Set<keyof MessageDescriptorPath>([
  'id',
  'description',
  'defaultMessage',
])

function evaluatePath(path: NodePath<any>): string {
  const evaluated = path.evaluate()
  if (evaluated.confident) {
    return evaluated.value
  }

  throw path.buildCodeFrameError(
    '[React Intl] Messages must be statically evaluate-able for extraction.'
  )
}

export function getMessageDescriptorKey(path: NodePath<any>) {
  if (path.isIdentifier() || path.isJSXIdentifier()) {
    return path.node.name
  }

  return evaluatePath(path)
}

function getMessageDescriptorValue(
  path?:
    | NodePath<t.StringLiteral>
    | NodePath<t.JSXExpressionContainer>
    | NodePath<t.TemplateLiteral>,
  isMessageNode?: boolean
) {
  if (!path) {
    return ''
  }
  if (path.isJSXExpressionContainer()) {
    // If this is already compiled, no need to recompiled it
    if (isMessageNode && path.get('expression').isArrayExpression()) {
      return ''
    }
    path = path.get('expression') as NodePath<t.StringLiteral>
  }

  // Always trim the Message Descriptor values.
  const descriptorValue = evaluatePath(path)

  return descriptorValue
}

export function createMessageDescriptor(
  propPaths: [
    NodePath<t.JSXIdentifier> | NodePath<t.Identifier>,
    NodePath<t.StringLiteral> | NodePath<t.JSXExpressionContainer>,
  ][]
): MessageDescriptorPath {
  return propPaths.reduce(
    (hash: MessageDescriptorPath, [keyPath, valuePath]) => {
      const key = getMessageDescriptorKey(
        keyPath
      ) as keyof MessageDescriptorPath

      if (DESCRIPTOR_PROPS.has(key)) {
        hash[key] = valuePath
      }

      return hash
    },
    {
      id: undefined,
      defaultMessage: undefined,
      description: undefined,
    }
  )
}

export function evaluateMessageDescriptor(
  descriptorPath: MessageDescriptorPath,
  isJSXSource = false,
  filename: string | undefined,
  idInterpolationPattern?: string,
  overrideIdFn?: Options['overrideIdFn'],
  preserveWhitespace?: Options['preserveWhitespace']
) {
  let id = getMessageDescriptorValue(descriptorPath.id)
  const defaultMessage = getICUMessageValue(
    descriptorPath.defaultMessage,
    {
      isJSXSource,
    },
    preserveWhitespace
  )
  const description = getMessageDescriptorValue(descriptorPath.description)

  if (overrideIdFn) {
    id = overrideIdFn(id, defaultMessage, description, filename)
  } else if (!id && idInterpolationPattern && defaultMessage) {
    id = interpolateName(
      {resourcePath: filename} as any,
      idInterpolationPattern,
      {
        content: description
          ? `${defaultMessage}#${description}`
          : defaultMessage,
      }
    )
  }
  const descriptor: MessageDescriptor = {
    id,
  }

  if (description) {
    descriptor.description = description
  }
  if (defaultMessage) {
    descriptor.defaultMessage = defaultMessage
  }

  return descriptor
}

function getICUMessageValue(
  messagePath?:
    | NodePath<t.StringLiteral>
    | NodePath<t.TemplateLiteral>
    | NodePath<t.JSXExpressionContainer>,
  {isJSXSource = false} = {},
  preserveWhitespace?: Options['preserveWhitespace']
) {
  if (!messagePath) {
    return ''
  }
  let message = getMessageDescriptorValue(messagePath, true)

  if (!preserveWhitespace) {
    message = message.trim().replace(/\s+/gm, ' ')
  }

  try {
    parse(message)
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
      )
    }

    throw messagePath.buildCodeFrameError(
      '[React Intl] Message failed to parse. ' +
        'See: https://formatjs.github.io/docs/core-concepts/icu-syntax' +
        `\n${parseError}`
    )
  }
  return message
}
const EXTRACTED = Symbol('FormatJSExtracted')
/**
 * Tag a node as extracted
 * Store this in the node itself so that multiple passes work. Specifically
 * if we remove `description` in the 1st pass, 2nd pass will fail since
 * it expect `description` to be there.
 * HACK: We store this in the node instance since this persists across
 * multiple plugin runs
 * @param path
 */
export function tagAsExtracted(path: NodePath<any>) {
  path.node[EXTRACTED] = true
}
/**
 * Check if a node was extracted
 * @param path
 */
export function wasExtracted(path: NodePath<any>) {
  return !!path.node[EXTRACTED]
}

/**
 * Store a message in our global messages
 * @param messageDescriptor
 * @param path
 * @param opts
 * @param filename
 * @param messages
 */
export function storeMessage(
  {id, description, defaultMessage}: MessageDescriptor,
  path: NodePath<any>,
  {extractSourceLocation}: Options,

  filename: string | undefined,
  messages: ExtractedMessageDescriptor[]
) {
  if (!id && !defaultMessage) {
    throw path.buildCodeFrameError(
      '[React Intl] Message Descriptors require an `id` or `defaultMessage`.'
    )
  }

  let loc = {}
  if (extractSourceLocation) {
    loc = {
      file: filename,
      ...path.node.loc,
    }
  }
  messages.push({id, description, defaultMessage, ...loc})
}
