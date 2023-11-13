import clsx from 'clsx'
import * as React from 'react'
import {IntlProvider} from 'react-intl'
import {LiveEditor, LiveError, LivePreview, LiveProvider} from 'react-live'

import styles from './styles.module.css'

function Playground({children, theme, transformCode, ...props}) {
  return (
    <LiveProvider
      code={children.replace(/\n$/, '')}
      transformCode={transformCode || (code => `<>{${code}}</>`)}
      theme={theme}
      {...props}
    >
      <div
        className={clsx(styles.playgroundHeader, styles.playgroundEditorHeader)}
      >
        Live Editor
      </div>
      <LiveEditor className={styles.playgroundEditor} />
      <div
        className={clsx(
          styles.playgroundHeader,
          styles.playgroundPreviewHeader
        )}
      >
        Result
      </div>
      <div className={styles.playgroundPreview}>
        <IntlProvider
          locale={typeof navigator !== 'undefined' ? navigator.language : 'en'}
        >
          <LivePreview />
        </IntlProvider>
        <LiveError />
      </div>
    </LiveProvider>
  )
}

export default Playground
