import {useId, useState, type ReactElement} from 'react'
import {useIntl, FormattedMessage} from 'react-intl'
import {Editor, type TranslatedMessage} from './index.js'

/** Example consumer. Replace this view with components from your design system. */
export function EditorDemo({
  initialMessages,
}: {
  initialMessages: TranslatedMessage[]
}): ReactElement {
  const intl = useIntl()
  const [messages, setMessages] = useState(initialMessages)
  const errorId = useId()
  return (
    <Editor
      messages={messages}
      onMessageChange={updated =>
        setMessages(current =>
          current.map(message =>
            message.id === updated.id ? updated : message
          )
        )
      }
    >
      {editor => (
        <main>
          <h1>
            <FormattedMessage
              id="editor.heading"
              defaultMessage="Message editor"
              description="Heading for the translation editor example"
            />
          </h1>
          <label>
            <FormattedMessage
              id="editor.search"
              defaultMessage="Search messages"
              description="Search field label in the translation editor"
            />
            <input
              type="search"
              value={editor.query}
              onChange={event => editor.setQuery(event.target.value)}
            />
          </label>
          <nav
            aria-label={intl.formatMessage({
              id: 'editor.messages',
              defaultMessage: 'Messages',
              description: 'Accessible label for the message selection list',
            })}
          >
            <ul>
              {editor.messages.map(message => (
                <li key={message.id}>
                  <button
                    type="button"
                    aria-current={
                      message.id === editor.selectedMessage?.id
                        ? 'true'
                        : undefined
                    }
                    onClick={() => editor.selectMessage(message.id)}
                  >
                    {message.defaultMessage}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          {editor.messages.length === 0 && (
            <output>
              <FormattedMessage
                id="editor.no-matches"
                defaultMessage="No matching messages"
                description="Empty search results in the editor"
              />
            </output>
          )}
          {editor.selectedMessage ? (
            <section>
              <h2>
                <FormattedMessage
                  id="editor.source"
                  defaultMessage="Source message"
                  description="Heading above the original ICU message"
                />
              </h2>
              <p>{editor.selectedMessage.defaultMessage}</p>
              {editor.selectedMessage.description && (
                <p>{editor.selectedMessage.description}</p>
              )}
              <label>
                <FormattedMessage
                  id="editor.translation"
                  defaultMessage="Translation"
                  description="Translation input label"
                />
                <textarea
                  rows={4}
                  value={editor.selectedMessage.translatedMessage}
                  onChange={event => editor.setTranslation(event.target.value)}
                  aria-invalid={!!editor.translation?.error}
                  aria-describedby={
                    editor.translation?.error ? errorId : undefined
                  }
                />
              </label>
              {editor.translation?.error && (
                <p id={errorId} role="alert">
                  <FormattedMessage
                    id="editor.invalid-message"
                    defaultMessage="Invalid ICU message: {error}"
                    description="ICU syntax error while editing a translation; error is the parser diagnostic"
                    values={{error: editor.translation.error.message}}
                  />
                </p>
              )}
              <div>
                <button type="button" onClick={editor.copySource}>
                  <FormattedMessage
                    id="editor.copy-source"
                    defaultMessage="Copy source"
                    description="Button copying the source into the translation"
                  />
                </button>
                <button type="button" onClick={editor.clearTranslation}>
                  <FormattedMessage
                    id="editor.clear-translation"
                    defaultMessage="Clear translation"
                    description="Button clearing the translation"
                  />
                </button>
              </div>
            </section>
          ) : (
            <output>
              <FormattedMessage
                id="editor.empty"
                defaultMessage="No messages"
                description="Empty message catalog in the editor"
              />
            </output>
          )}
        </main>
      )}
    </Editor>
  )
}
