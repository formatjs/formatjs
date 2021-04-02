import {List, ListItem, ListItemText} from '@material-ui/core'
import React from 'react'
import {TranslatedMessage} from './types'

export interface Props {
  messages: TranslatedMessage[]
}

const Messages: React.FC<Props> = ({messages}) => {
  return (
    <List dense>
      {messages.map(m => (
        <ListItem key={m.id} dense divider>
          <ListItemText
            primary={m.defaultMessage}
            secondary={m.translatedMessage}
          />
        </ListItem>
      ))}
    </List>
  )
}

export default Messages
