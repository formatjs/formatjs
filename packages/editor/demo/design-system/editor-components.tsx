import * as stylex from '@stylexjs/stylex'
import type {EditorComponents} from '@formatjs/editor/ui'
import {Button, TextArea, TextInput} from './components.js'
import {tokens} from './tokens.stylex.js'

const styles = stylex.create({
  page: {
    backgroundColor: tokens.canvas,
    color: tokens.text,
    fontFamily: tokens.font,
    padding: 24,
  },
  columns: {
    display: 'grid',
    gap: 20,
    gridTemplateColumns: {
      default: '280px minmax(0, 1fr)',
      '@media (max-width: 800px)': '1fr',
    },
  },
  content: {display: 'grid', gap: 20, minWidth: 0},
  panel: {
    backgroundColor: tokens.surface,
    borderRadius: tokens.radius,
    padding: 20,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
    textAlign: 'start',
    padding: 12,
    borderWidth: 0,
    backgroundColor: {default: 'transparent', ':hover': tokens.subtle},
    color: tokens.text,
    cursor: 'pointer',
    fontFamily: tokens.font,
  },
  selected: {
    backgroundColor: {default: tokens.accentSoft, ':hover': tokens.accentSoft},
  },
})

/** The same public view can use another design system without these dependencies. */
export const stylexEditorComponents: EditorComponents = {
  Button: ({onPress, ...props}) => (
    <Button {...props} onClick={() => onPress()} />
  ),
  TextInput: ({onValueChange, ...props}) => (
    <TextInput
      {...props}
      onChange={event => onValueChange(event.target.value)}
    />
  ),
  TextArea: ({onValueChange, rows = 6, ...props}) => (
    <TextArea
      {...props}
      rows={rows}
      onChange={event => onValueChange(event.target.value)}
    />
  ),
  MessageRow: ({children, selected, onSelect}) => (
    <button
      type="button"
      aria-current={selected ? 'true' : undefined}
      onClick={() => onSelect()}
      {...stylex.props(styles.row, selected && styles.selected)}
    >
      {children}
    </button>
  ),
  Panel: ({label, children}) => (
    <section aria-label={label} {...stylex.props(styles.panel)}>
      {children}
    </section>
  ),
  Layout: ({toolbar, navigation, content, sidebar}) => (
    <div {...stylex.props(styles.page)}>
      {toolbar}
      <div {...stylex.props(styles.columns)}>
        {navigation}
        <div {...stylex.props(styles.content)}>{content}</div>
        {sidebar}
      </div>
    </div>
  ),
}
