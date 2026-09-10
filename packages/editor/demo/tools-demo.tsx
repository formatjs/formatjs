import {useId, useState, type ReactElement} from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  CopyTextButton,
  EditorDesignSystemProvider,
  LocalePicker,
  MessageContext,
  MessagePreview,
} from '@formatjs/editor/ui'
import {stylexEditorComponents} from './design-system/editor-components.js'
import {TextArea} from './design-system/components.js'
import {tokens} from './design-system/tokens.stylex.js'

const styles = stylex.create({
  page: {
    padding: 20,
    backgroundColor: tokens.canvas,
    color: tokens.text,
    fontFamily: tokens.font,
    display: 'grid',
    gap: 16,
    minWidth: 0,
  },
  panel: {
    padding: 16,
    backgroundColor: tokens.surface,
    borderRadius: tokens.radius,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
})
const source =
  '{count, plural, offset:1 one {<strong># guest</strong>} other {# guests}} — {price, number, ::currency/USD}'
const locales = ['ar', 'de', 'es', 'fr', 'ja']

/** Standalone tools share the same registry as the composed translation view. */
export function TranslationToolsDemo(): ReactElement {
  const [selected, setSelected] = useState(['fr'])
  const [message, setMessage] = useState(source)
  const id = useId()
  return (
    <EditorDesignSystemProvider components={stylexEditorComponents}>
      <div {...stylex.props(styles.page)}>
        <h1>Translation tools</h1>
        <LocalePicker
          locales={locales}
          selectedLocales={selected}
          onChange={setSelected}
        />
        <section
          aria-label="Structural preview"
          {...stylex.props(styles.panel)}
        >
          <label htmlFor={id}>ICU message</label>
          <TextArea
            dir="auto"
            id={id}
            value={message}
            onChange={event => setMessage(event.target.value)}
            rows={4}
          />
          <MessagePreview message={message} />
          <CopyTextButton value={message} label="ICU message" />
        </section>
        <MessageContext
          message={{
            id: 'guest-total',
            description: 'Guest count with a formatted price',
            catalogs: ['web', 'mobile'],
            locations: [{file: 'src/guests.tsx', start: 12, end: 18}],
          }}
        />
      </div>
    </EditorDesignSystemProvider>
  )
}
