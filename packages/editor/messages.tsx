import {List, ListItem, Typography} from '@material-ui/core'
import {Skeleton} from '@material-ui/lab'
import React from 'react'
import {TranslatedMessage} from './types'
import Message from './message'
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
        <ListItem key={m.id} dense divider>
          <Typography variant="body2" component="div">
            <Message message={m.defaultMessage} />
          </Typography>
          <Typography variant="body2" color="textSecondary" component="div">
            <Message message={m.translatedMessage} />
          </Typography>
        </ListItem>
      ))}
    </List>
  )
}

export default Messages
