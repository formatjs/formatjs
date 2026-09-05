import {
  isArgumentElement,
  isDateElement,
  isLiteralElement,
  isNumberElement,
  isPluralElement,
  isPoundElement,
  isSelectElement,
  isTagElement,
  isTimeElement,
  parse,
} from '@formatjs/icu-messageformat-parser'
import type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import type {ReactNode} from 'react'

export type MessageTokenKind =
  | 'argument'
  | 'date'
  | 'number'
  | 'pound'
  | 'selector'
  | 'tag'
  | 'time'

export interface MessageToken {
  kind: MessageTokenKind
  label: string
}

export interface MessagePreviewProps {
  message: string
  className?: string
  renderToken?: (token: MessageToken, key: string) => ReactNode
}

interface PreviewResult {
  content?: ReactNode[]
  error?: string
}

function defaultRenderToken(token: MessageToken, key: string): ReactNode {
  return (
    <span className="formatjs-editor__token" data-kind={token.kind} key={key}>
      {token.label}
    </span>
  )
}

function renderElements(
  elements: MessageFormatElement[],
  prefix: string,
  renderToken: (token: MessageToken, key: string) => ReactNode
): ReactNode[] {
  const rendered: ReactNode[] = []
  elements.forEach((element, index) => {
    const key = `${prefix}-${index}`
    if (isLiteralElement(element)) {
      rendered.push(<span key={key}>{element.value}</span>)
      return
    }
    if (isPoundElement(element)) {
      rendered.push(renderToken({kind: 'pound', label: '#'}, key))
      return
    }
    if (isArgumentElement(element)) {
      rendered.push(
        renderToken({kind: 'argument', label: `{${element.value}}`}, key)
      )
      return
    }
    if (
      isNumberElement(element) ||
      isDateElement(element) ||
      isTimeElement(element)
    ) {
      const kind = isNumberElement(element)
        ? 'number'
        : isDateElement(element)
          ? 'date'
          : 'time'
      rendered.push(
        renderToken({kind, label: `{${element.value}, ${kind}}`}, key)
      )
      return
    }
    if (isTagElement(element)) {
      rendered.push(
        renderToken({kind: 'tag', label: `<${element.value}>`}, `${key}-open`),
        ...renderElements(element.children, `${key}-child`, renderToken),
        renderToken({kind: 'tag', label: `</${element.value}>`}, `${key}-close`)
      )
      return
    }
    if (isSelectElement(element) || isPluralElement(element)) {
      const kind = isPluralElement(element) ? element.pluralType : 'select'
      rendered.push(
        renderToken(
          {kind: 'selector', label: `{${element.value}, ${kind}}`},
          `${key}-open`
        )
      )
      Object.keys(element.options).forEach((selector, optionIndex) => {
        rendered.push(
          renderToken(
            {kind: 'selector', label: selector},
            `${key}-selector-${selector}`
          ),
          ...renderElements(
            element.options[selector].value,
            `${key}-option-${optionIndex}`,
            renderToken
          )
        )
      })
      rendered.push(renderToken({kind: 'selector', label: '}'}, `${key}-close`))
    }
  })
  return rendered
}

function parsePreview(
  message: string,
  renderToken: (token: MessageToken, key: string) => ReactNode
): PreviewResult {
  try {
    return {content: renderElements(parse(message), 'message', renderToken)}
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid ICU message',
    }
  }
}

export function MessagePreview({
  message,
  className,
  renderToken = defaultRenderToken,
}: MessagePreviewProps): ReactNode {
  const preview = parsePreview(message, renderToken)
  if (preview.error) {
    return (
      <span className="formatjs-editor__error" role="alert">
        {preview.error}
      </span>
    )
  }

  return (
    <span className={className ?? 'formatjs-editor__message-preview'}>
      {preview.content}
    </span>
  )
}
