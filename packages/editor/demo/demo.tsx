import {useId, useState, type ReactElement, type ReactNode} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import * as stylex from '@stylexjs/stylex'
import {Braces, Check, Copy, FileText, Languages, Search} from 'lucide-react'
import {
  useMessageEditor,
  type EditorState,
  type TranslatedMessage,
} from '../index.js'
import {
  Badge,
  Button,
  Panel,
  TextArea,
  TextInput,
} from './design-system/components.js'
import {tokens} from './design-system/tokens.stylex.js'

const styles = stylex.create({
  page: {
    boxSizing: 'border-box',
    minHeight: '100vh',
    backgroundColor: tokens.canvas,
    color: tokens.text,
    fontFamily: tokens.font,
    fontSize: 14,
    lineHeight: 1.5,
    paddingBlock: {default: 36, '@media (max-width: 680px)': 20},
    paddingInline: {default: 40, '@media (max-width: 680px)': 16},
  },
  container: {maxWidth: 1200, marginInline: 'auto'},
  masthead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.line,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  logo: {
    display: 'grid',
    placeItems: 'center',
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: tokens.accent,
    color: '#fff',
  },
  mastheadNote: {
    color: tokens.muted,
    fontSize: 12,
    display: {default: 'block', '@media (max-width: 680px)': 'none'},
  },
  titleRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingBlock: 30,
  },
  eyebrow: {
    color: tokens.accent,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '1.4px',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: {default: 32, '@media (max-width: 680px)': 26},
    lineHeight: 1.2,
    letterSpacing: '-1px',
    marginBlock: 0,
    fontWeight: 650,
  },
  subtitle: {color: tokens.muted, marginTop: 10, marginBottom: 0, fontSize: 14},
  grid: {
    display: 'grid',
    gridTemplateColumns: {
      default: '310px minmax(0, 1fr)',
      '@media (max-width: 800px)': '1fr',
    },
    alignItems: 'start',
    gap: 22,
  },
  sidebarHead: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.line,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    fontWeight: 650,
    marginBottom: 10,
  },
  list: {
    padding: 10,
    margin: 0,
    listStyleType: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: {default: 480, '@media (max-width: 800px)': 220},
    overflowY: 'auto',
  },
  message: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'start',
    gap: 12,
    width: '100%',
    padding: 14,
    textAlign: 'start',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    backgroundColor: {default: 'transparent', ':hover': tokens.subtle},
    color: tokens.text,
    cursor: 'pointer',
    fontFamily: tokens.font,
    outlineColor: tokens.accent,
    outlineOffset: 1,
  },
  selected: {
    backgroundColor: {default: tokens.accentSoft, ':hover': tokens.accentSoft},
    borderColor: '#c7dccd',
  },
  messageIcon: {color: tokens.muted, flexShrink: 0, marginTop: 3},
  messageBody: {display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0},
  messageId: {
    fontFamily: tokens.mono,
    fontSize: 10,
    color: tokens.muted,
    overflowWrap: 'anywhere',
  },
  messageText: {fontSize: 13, lineHeight: 1.6, overflowWrap: 'anywhere'},
  content: {padding: {default: 28, '@media (max-width: 680px)': 20}},
  sourceHeader: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    fontSize: 14,
    fontWeight: 650,
    margin: 0,
  },
  source: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: tokens.subtle,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.line,
    fontFamily: tokens.mono,
    fontSize: 15,
    lineHeight: 1.8,
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  description: {color: tokens.muted, fontSize: 13, marginBottom: 0},
  divider: {height: 1, backgroundColor: tokens.line, marginBlock: 26},
  translationLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 650,
    marginBottom: 12,
  },
  help: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: tokens.muted,
    marginTop: 10,
    marginBottom: 0,
  },
  valid: {color: tokens.accent},
  error: {
    fontSize: 12,
    color: tokens.danger,
    backgroundColor: tokens.dangerSoft,
    borderRadius: 6,
    padding: 12,
    overflowWrap: 'anywhere',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 28,
  },
  actions: {display: 'flex', flexWrap: 'wrap', gap: 8},
  note: {color: tokens.muted, fontSize: 11, margin: 0},
  empty: {display: 'block', padding: 24, color: tokens.muted, fontSize: 13},
  bottom: {
    marginTop: 22,
    fontSize: 12,
    color: tokens.muted,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  },
})

/** Optional StyleX consumer; the headless entry point never imports this layer. */
export function EditorDemo({
  initialMessages,
}: {
  initialMessages: TranslatedMessage[]
}): ReactElement {
  const [messages, setMessages] = useState(initialMessages)
  const editor = useMessageEditor({
    messages,
    onMessageChange: updated =>
      setMessages(current =>
        current.map(message => (message.id === updated.id ? updated : message))
      ),
  })
  return <EditorView editor={editor} messageCount={messages.length} />
}

export interface EditorViewProps {
  editor: EditorState
  messageCount: number
  filters?: ReactNode
  pagination?: ReactNode
  context?: ReactNode
  actions?: ReactNode
  notice?: ReactNode
  validation?: ReactNode
}

/** Shared optional StyleX view for immediate edits and persisted workflows. */
export function EditorView({
  editor,
  messageCount,
  filters,
  pagination,
  context,
  actions,
  notice,
  validation,
}: EditorViewProps): ReactElement {
  const intl = useIntl()
  const errorId = useId()
  const inputId = useId()
  const hintId = useId()
  const searchId = useId()
  return (
    <main {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.container)}>
        <header {...stylex.props(styles.masthead)}>
          <div {...stylex.props(styles.brand)}>
            <span {...stylex.props(styles.logo)}>
              <Braces size={23} aria-hidden="true" />
            </span>
            <FormattedMessage
              id="editor.brand"
              defaultMessage="FormatJS"
              description="FormatJS product name"
            />
          </div>
          <span {...stylex.props(styles.mastheadNote)}>
            <FormattedMessage
              id="editor.workspace"
              defaultMessage="Translation workspace"
              description="Name of the editor workspace"
            />
          </span>
        </header>
        <div {...stylex.props(styles.titleRow)}>
          <div>
            <div {...stylex.props(styles.eyebrow)}>
              <FormattedMessage
                id="editor.eyebrow"
                defaultMessage="Words, in context"
                description="Short introduction above the editor heading"
              />
            </div>
            <h1 {...stylex.props(styles.title)}>
              <FormattedMessage
                id="editor.heading"
                defaultMessage="Message editor"
                description="Heading for the translation editor example"
              />
            </h1>
            <p {...stylex.props(styles.subtitle)}>
              <FormattedMessage
                id="editor.subtitle"
                defaultMessage="Thoughtful translations start with the right context."
                description="Description of the translation workspace"
              />
            </p>
          </div>
          <Badge>
            <Languages size={14} aria-hidden="true" />
            <FormattedMessage
              id="editor.message-count"
              defaultMessage="{count, plural, one {# message} other {# messages}}"
              description="Number of messages in the catalog"
              values={{count: messageCount}}
            />
          </Badge>
        </div>
        {filters}
        <div {...stylex.props(styles.grid)}>
          <Panel>
            <div {...stylex.props(styles.sidebarHead)}>
              <label htmlFor={searchId} {...stylex.props(styles.label)}>
                <Search size={14} aria-hidden="true" />
                <FormattedMessage
                  id="editor.search"
                  defaultMessage="Search messages"
                  description="Search field label in the translation editor"
                />
              </label>
              <TextInput
                id={searchId}
                type="search"
                value={editor.query}
                onChange={event => editor.setQuery(event.target.value)}
              />
            </div>
            <nav
              aria-label={intl.formatMessage({
                id: 'editor.messages',
                defaultMessage: 'Messages',
                description: 'Accessible label for the message selection list',
              })}
            >
              <ul {...stylex.props(styles.list)}>
                {editor.messages.map(message => (
                  <li key={message.id}>
                    <button
                      type="button"
                      aria-label={message.defaultMessage}
                      aria-current={
                        message.id === editor.selectedMessage?.id
                          ? 'true'
                          : undefined
                      }
                      onClick={() => editor.selectMessage(message.id)}
                      {...stylex.props(
                        styles.message,
                        message.id === editor.selectedMessage?.id &&
                          styles.selected
                      )}
                    >
                      <FileText
                        size={17}
                        aria-hidden="true"
                        {...stylex.props(styles.messageIcon)}
                      />
                      <span {...stylex.props(styles.messageBody)}>
                        <span {...stylex.props(styles.messageId)}>
                          {message.id}
                        </span>
                        <span {...stylex.props(styles.messageText)}>
                          {message.defaultMessage}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            {pagination}
            {editor.messages.length === 0 && (
              <output {...stylex.props(styles.empty)}>
                <FormattedMessage
                  id="editor.no-matches"
                  defaultMessage="No matching messages"
                  description="Empty search results in the editor"
                />
              </output>
            )}
          </Panel>
          <Panel>
            {editor.selectedMessage ? (
              <div {...stylex.props(styles.content)}>
                <div {...stylex.props(styles.sourceHeader)}>
                  <h2 {...stylex.props(styles.heading)}>
                    <FileText size={17} aria-hidden="true" />
                    <FormattedMessage
                      id="editor.source"
                      defaultMessage="Source message"
                      description="Heading above the original ICU message"
                    />
                  </h2>
                  <Badge>{editor.selectedMessage.id}</Badge>
                </div>
                <p {...stylex.props(styles.source)}>
                  {editor.selectedMessage.defaultMessage}
                </p>
                {editor.selectedMessage.description && (
                  <p {...stylex.props(styles.description)}>
                    {editor.selectedMessage.description}
                  </p>
                )}
                {context}
                <div {...stylex.props(styles.divider)} />
                <label
                  htmlFor={inputId}
                  {...stylex.props(styles.translationLabel)}
                >
                  <FormattedMessage
                    id="editor.translation"
                    defaultMessage="Translation"
                    description="Translation input label"
                  />
                </label>
                <TextArea
                  id={inputId}
                  rows={6}
                  value={editor.selectedMessage.translatedMessage}
                  onChange={event => editor.setTranslation(event.target.value)}
                  aria-invalid={!!validation || !!editor.translation?.error}
                  aria-describedby={
                    validation || editor.translation?.error ? errorId : hintId
                  }
                />
                {validation || editor.translation?.error ? (
                  <p id={errorId} role="alert" {...stylex.props(styles.error)}>
                    {validation ?? (
                      <FormattedMessage
                        id="editor.invalid-message"
                        defaultMessage="Invalid ICU message: {error}"
                        description="ICU syntax error while editing a translation; error is the parser diagnostic"
                        values={{error: editor.translation?.error?.message}}
                      />
                    )}
                  </p>
                ) : (
                  <p
                    id={hintId}
                    {...stylex.props(
                      styles.help,
                      !!editor.selectedMessage.translatedMessage && styles.valid
                    )}
                  >
                    {!!editor.selectedMessage.translatedMessage && (
                      <Check size={14} aria-hidden="true" />
                    )}
                    {editor.selectedMessage.translatedMessage ? (
                      <FormattedMessage
                        id="editor.valid"
                        defaultMessage="ICU syntax valid"
                        description="Indicates valid ICU syntax, not translation correctness"
                      />
                    ) : (
                      <FormattedMessage
                        id="editor.placeholder-hint"
                        defaultMessage="Keep placeholders and ICU syntax intact."
                        description="Hint below the translation field"
                      />
                    )}
                  </p>
                )}
                <div {...stylex.props(styles.footer)}>
                  <p {...stylex.props(styles.note)}>
                    {notice ?? (
                      <FormattedMessage
                        id="editor.session-note"
                        defaultMessage="Changes stay in this session."
                        description="Clarifies that the demo does not persist changes"
                      />
                    )}
                  </p>
                  <div {...stylex.props(styles.actions)}>
                    {actions ?? (
                      <>
                        <Button
                          onClick={editor.clearTranslation}
                          disabled={!editor.selectedMessage.translatedMessage}
                        >
                          <FormattedMessage
                            id="editor.clear-translation"
                            defaultMessage="Clear translation"
                            description="Button clearing the translation"
                          />
                        </Button>
                        <Button variant="primary" onClick={editor.copySource}>
                          <Copy size={14} aria-hidden="true" />
                          <FormattedMessage
                            id="editor.copy-source"
                            defaultMessage="Copy source"
                            description="Button copying the source into the translation"
                          />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <output {...stylex.props(styles.empty)}>
                <FormattedMessage
                  id="editor.empty"
                  defaultMessage="No messages"
                  description="Empty message catalog in the editor"
                />
              </output>
            )}
          </Panel>
        </div>
        <div {...stylex.props(styles.bottom)}>
          <Braces size={14} aria-hidden="true" />
          <FormattedMessage
            id="editor.format-note"
            defaultMessage="Built for ICU MessageFormat"
            description="Caption describing the supported message syntax"
          />
        </div>
      </div>
    </main>
  )
}
