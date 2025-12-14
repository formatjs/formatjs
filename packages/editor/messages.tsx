import {List, ListItem, Box} from '@material-ui/core'
import {CheckCircle} from '@material-ui/icons'
import {Skeleton} from '@material-ui/lab'
import React from 'react'
import {TranslatedMessage} from './types.js'
import Message from './message.js'
export interface Props {
  messages: TranslatedMessage[]
  isLoading?: boolean
  count: number
}

const Messages: React.FC<Props> = ({messages, isLoading, count}) => {
  if (isLoading) {
    const placeholders = []
    for (let i = 0; i < count; i++) {
      placeholders.push(
        <ListItem key={i} dense divider>
          <Skeleton width="100%" height={60} />
        </ListItem>
      )
    }
    return <List dense>{placeholders}</List>
  }
  return (
    <List dense>
      {messages.map(m => (
        <ListItem key={m.id} dense divider alignItems="flex-start">
          <CheckCircle />
          <Box component="span" paddingLeft={1}>
            <Message message={m.defaultMessage} />
          </Box>
        </ListItem>
      ))}
    </List>
  )
}

export default Messages
