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
} from 'intl-messageformat-parser'

interface Props {
  message: string
}

function formatAst(ast: MessageFormatElement[]): React.ReactNodeArray {
  const els: React.ReactNodeArray = []
  for (const el of ast) {
    if (isLiteralElement(el)) {
      els.push(el.value)
    } else if (isArgumentElement(el)) {
      els.push(<Chip size="small" label={el.value} />)
    } else if (isNumberElement(el)) {
      els.push(
        <Chip size="small" label={el.value} avatar={<Avatar>N</Avatar>} />
      )
    } else if (isDateElement(el)) {
      els.push(
        <Chip size="small" label={el.value} avatar={<Avatar>D</Avatar>} />
      )
    } else if (isTimeElement(el)) {
      els.push(
        <Chip size="small" label={el.value} avatar={<Avatar>T</Avatar>} />
      )
    } else if (isTagElement(el)) {
      els.push(
        <Chip size="small" label={`<${el.value}>`} />,
        ...formatAst(el.children),
        <Chip size="small" label={`</${el.value}>`} />
      )
    } else {
      els.push('unsupported')
    }
  }
  return els
}

const Message: React.FC<Props> = ({message}) => {
  const ast = parse(message)
  return <>{formatAst(ast)}</>
}

export default Message
