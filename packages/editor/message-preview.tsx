import {
  parse,
  TYPE,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'
import {useMemo, type ReactNode} from 'react'
import {
  useEditorDesignSystem,
  type EditorPreviewTokenProps,
} from '#packages/editor/design-system.js'

export interface MessagePreviewProps {
  message: string
  /** Customize a parser error without suppressing the alert semantics. */
  formatError?: (error: Error) => ReactNode
}

/** Structural ICU preview: shows every branch, without evaluating values or HTML. */
export function MessagePreview({
  message,
  formatError,
}: MessagePreviewProps): ReactNode {
  const {PreviewToken} = useEditorDesignSystem()
  const parsed = useMemo(() => {
    try {
      return {ast: parse(message, {captureLocation: true}), error: null}
    } catch (error) {
      return {
        ast: null,
        error: error instanceof Error ? error : new Error(String(error)),
      }
    }
  }, [message])
  if (parsed.error)
    return (
      <p role="alert">
        {formatError ? formatError(parsed.error) : parsed.error.message}
      </p>
    )
  const token = (
    text: string,
    kind: EditorPreviewTokenProps['kind'],
    key: string
  ): ReactNode => (
    <PreviewToken key={key} kind={kind}>
      <bdi dir="ltr">{text}</bdi>
    </PreviewToken>
  )
  const elements = (ast: MessageFormatElement[], prefix: string): ReactNode[] =>
    ast.flatMap((element, index) => {
      const key = `${prefix}-${index}`
      switch (element.type) {
        case TYPE.literal:
          return <span key={key}>{element.value}</span>
        case TYPE.pound:
          return token('#', 'pound', key)
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          return token(
            message.slice(
              element.location!.start.offset,
              element.location!.end.offset
            ),
            TYPE[element.type] as 'argument' | 'number' | 'date' | 'time',
            key
          )
        case TYPE.tag:
          return [
            token(`<${element.value}>`, 'tag', `${key}-open`),
            ...elements(element.children, `${key}-children`),
            token(`</${element.value}>`, 'tag', `${key}-close`),
          ]
        case TYPE.select:
        case TYPE.plural: {
          const kind =
            element.type === TYPE.select
              ? 'select'
              : element.pluralType === 'ordinal'
                ? 'selectordinal'
                : 'plural'
          const offset =
            element.type === TYPE.plural && element.offset
              ? ` offset:${element.offset}`
              : ''
          return [
            token(
              `{${element.value}, ${kind},${offset}`,
              element.type === TYPE.select ? 'selector' : 'plural',
              `${key}-open`
            ),
            ...Object.entries(element.options).flatMap(([selector, option]) => [
              token(`${selector} {`, 'selector', `${key}-${selector}`),
              ...elements(option.value, `${key}-${selector}`),
              token('}', 'syntax', `${key}-${selector}-close`),
            ]),
            token('}', 'syntax', `${key}-close`),
          ]
        }
      }
    })
  return (
    <div dir="auto" style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>
      {elements(parsed.ast!, 'message')}
    </div>
  )
}
