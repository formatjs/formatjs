import type {ReactElement} from 'react'
import {EditorDemo} from '../demo/demo.js'
import {EditorTestShell} from './shell.js'

export function Editable({
  direction = 'ltr',
}: {
  direction?: 'ltr' | 'rtl'
}): ReactElement {
  return (
    <EditorTestShell direction={direction}>
      <EditorDemo
        initialMessages={[
          {
            id: 'welcome',
            defaultMessage: 'Welcome, {name}',
            translatedMessage: '',
          },
          {
            id: 'messages',
            defaultMessage: 'You have {count, number} messages',
            translatedMessage: '',
          },
        ]}
      />
    </EditorTestShell>
  )
}
