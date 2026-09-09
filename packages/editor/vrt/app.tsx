import React from 'react'
import ReactDOM from 'react-dom'
import App from '../index'
import {EditorTestShell} from './shell'

ReactDOM.render(
  <EditorTestShell>
    <App />
  </EditorTestShell>,
  document.getElementById('editor-root')
)
