import {
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser'
import {useMemo, type ReactNode} from 'react'

export type ParsedMessage =
  | {ast: MessageFormatElement[]; error: null}
  | {ast: null; error: Error}

/** Retains every ICU branch and skeleton; incomplete edits are valid input. */
export function parseMessage(message: string): ParsedMessage {
  try {
    return {ast: parse(message), error: null}
  } catch (error) {
    return {
      ast: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

export interface MessageProps {
  message: string
  children: (parsed: ParsedMessage) => ReactNode
}

export function Message({message, children}: MessageProps): ReactNode {
  const parsed = useMemo(() => parseMessage(message), [message])
  return children(parsed)
}
