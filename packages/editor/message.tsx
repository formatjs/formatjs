import React from 'react'
import {Chip, Avatar} from '@material-ui/core'
import {
  parse,
  isLiteralElement,
  isNumberElement,
  isDateElement,
  isTimeElement,
  isTagElement,
  MessageFormatElement,
  isArgumentElement,
  isPoundElement,
} from '@formatjs/icu-messageformat-parser'
import {CallSplit, Event, Schedule} from '@material-ui/icons'

interface Props {
  message: string
}

function formatAst(ast: MessageFormatElement[]): React.ReactNode[] {
  const els: React.ReactNode[] = []
  for (const el of ast) {
    if (isLiteralElement(el)) {
      els.push(el.value)
    } else if (isArgumentElement(el)) {
      els.push(
        <Chip variant="outlined" size="small" label={el.value} disabled />
      )
    } else if (isPoundElement(el)) {
      els.push(<Chip variant="outlined" size="small" label="#" disabled />)
    } else if (isNumberElement(el)) {
      els.push(
        <Chip
          variant="outlined"
          size="small"
          label={el.value}
          avatar={<Avatar>N</Avatar>}
          disabled
        />
      )
    } else if (isDateElement(el)) {
      els.push(
        <Chip
          variant="outlined"
          size="small"
          label={el.value}
          avatar={
            <Avatar>
              <Event fontSize="small" />
            </Avatar>
          }
          disabled
        />
      )
    } else if (isTimeElement(el)) {
      els.push(
        <Chip
          variant="outlined"
          size="small"
          label={el.value}
          avatar={
            <Avatar>
              <Schedule fontSize="small" />
            </Avatar>
          }
          disabled
        />
      )
    } else if (isTagElement(el)) {
      els.push(
        <Chip
          variant="outlined"
          size="small"
          label={`<${el.value}>`}
          disabled
        />,
        ...formatAst(el.children),
        <Chip
          variant="outlined"
          size="small"
          label={`</${el.value}>`}
          disabled
        />
      )
    } else {
      els.push(
        <Chip
          variant="outlined"
          size="small"
          label={el.value}
          avatar={
            <Avatar>
              <CallSplit fontSize="small" />
            </Avatar>
          }
          disabled
        />,
        ...formatAst(el.options.other.value)
      )
    }
  }
  return els
}

const Message: React.FC<Props> = ({message}) => {
  const ast = parse(message)
  return <>{formatAst(ast)}</>
}

export default Message
