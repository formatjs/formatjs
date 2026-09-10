import * as stylex from '@stylexjs/stylex'
import {FormattedMessage, useIntl} from 'react-intl'
import {useId, type ReactElement} from 'react'
import {
  useTranslationEditor,
  type TranslationEditorOptions,
} from '@formatjs/editor'
import {
  TranslationEditorView,
  type EditorLabelOverrides,
} from '@formatjs/editor/ui'
import {stylexEditorComponents} from './design-system/editor-components.js'
import {Button, Select} from './design-system/components.js'
import {tokens} from './design-system/tokens.stylex.js'

const styles = stylex.create({
  filters: {display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20},
  label: {display: 'grid', gap: 6, fontSize: 13, minWidth: 150},
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 16,
    fontSize: 12,
  },
  context: {fontSize: 12, color: tokens.muted, overflowWrap: 'anywhere'},
})

/** Optional StyleX workflow view. Its consumer supplies IntlProvider and persistence. */
export function TranslationEditorDemo(
  options: TranslationEditorOptions
): ReactElement {
  const workflow = useTranslationEditor(options)
  const {editor} = workflow
  const controlId = useId()
  const intl = useIntl()
  const labels: EditorLabelOverrides = {
    search: intl.formatMessage({
      id: 'editor.search',
      defaultMessage: 'Search messages',
      description: 'Search field label',
    }),
    messages: intl.formatMessage({
      id: 'editor.messages',
      defaultMessage: 'Messages',
      description: 'Message navigation label',
    }),
    source: intl.formatMessage({
      id: 'editor.source',
      defaultMessage: 'Source message',
      description: 'Source panel heading',
    }),
    noMessages: intl.formatMessage({
      id: 'editor.no-matches',
      defaultMessage: 'No matching messages',
      description: 'Empty message list',
    }),
    noSelection: intl.formatMessage({
      id: 'editor.no-selection',
      defaultMessage: 'Select a message',
      description: 'Empty message selection',
    }),
    loading: intl.formatMessage({
      id: 'editor.loading',
      defaultMessage: 'Loading messages…',
      description: 'Message loading status',
    }),
    copySource: intl.formatMessage({
      id: 'editor.copy-source',
      defaultMessage: 'Copy source',
      description: 'Copy source action',
    }),
    reset: intl.formatMessage({
      id: 'editor.reset',
      defaultMessage: 'Reset',
      description: 'Reset translation action',
    }),
    save: intl.formatMessage({
      id: 'editor.save-label',
      defaultMessage: 'Save translation',
      description: 'Save translation action',
    }),
    saving: intl.formatMessage({
      id: 'editor.saving',
      defaultMessage: 'Saving…',
      description: 'Pending save status',
    }),
    saved: intl.formatMessage({
      id: 'editor.saved',
      defaultMessage: 'Translation saved.',
      description: 'Successful save status',
    }),
    unsaved: intl.formatMessage({
      id: 'editor.dirty',
      defaultMessage: 'Unsaved changes',
      description: 'Dirty translation status',
    }),
    unchanged: intl.formatMessage({
      id: 'editor.clean',
      defaultMessage: 'No unsaved changes',
      description: 'Clean translation status',
    }),
    validation: {
      empty: intl.formatMessage({
        id: 'editor.validation-empty',
        defaultMessage: 'Enter a translation before saving.',
        description: 'Empty translation validation',
      }),
      'invalid-source': intl.formatMessage({
        id: 'editor.validation-source',
        defaultMessage: 'The source contains invalid ICU syntax.',
        description: 'Invalid source validation',
      }),
      'invalid-translation': intl.formatMessage({
        id: 'editor.validation-translation',
        defaultMessage: 'The translation contains invalid ICU syntax.',
        description: 'Invalid translation validation',
      }),
      structure: intl.formatMessage({
        id: 'editor.validation-structure',
        defaultMessage:
          'Preserve ICU arguments, tags, formatting styles, and selector branches.',
        description: 'ICU structure validation',
      }),
    },
  }
  const translation =
    workflow.selectedMessage && workflow.locale
      ? workflow.getTranslation(workflow.selectedMessage.id, workflow.locale)
      : undefined
  return (
    <TranslationEditorView
      components={stylexEditorComponents}
      labels={labels}
      messages={workflow.pageMessages}
      selectedMessage={workflow.selectedMessage}
      onSelect={editor.selectMessage}
      search={{value: editor.query, onValueChange: editor.setQuery}}
      translations={
        translation && workflow.locale
          ? [
              {
                locale: workflow.locale,
                label: intl.formatMessage({
                  id: 'editor.translation',
                  defaultMessage: 'Translation',
                  description: 'Translation field label',
                }),
                draft: translation,
                onSave: () => {
                  void translation.save()
                },
              },
            ]
          : []
      }
      filters={
        <div {...stylex.props(styles.filters)}>
          <label
            htmlFor={`${controlId}-locale`}
            {...stylex.props(styles.label)}
          >
            <FormattedMessage
              id="editor.locale"
              defaultMessage="Target locale"
              description="Target language selector label"
            />
            <Select
              id={`${controlId}-locale`}
              value={workflow.locale ?? ''}
              disabled={!options.locales.length}
              onChange={event => workflow.setLocale(event.target.value)}
            >
              {options.locales.map(locale => (
                <option key={locale} value={locale}>
                  {locale}
                </option>
              ))}
            </Select>
          </label>
          <label
            htmlFor={`${controlId}-catalog`}
            {...stylex.props(styles.label)}
          >
            <FormattedMessage
              id="editor.catalog"
              defaultMessage="Catalog"
              description="Message catalog filter label"
            />
            <Select
              id={`${controlId}-catalog`}
              value={workflow.catalog}
              onChange={event => workflow.setCatalog(event.target.value)}
            >
              <option value="">
                <FormattedMessage
                  id="editor.all-catalogs"
                  defaultMessage="All catalogs"
                  description="Option showing every message catalog"
                />
              </option>
              {workflow.catalogs.map(catalog => (
                <option key={catalog} value={catalog}>
                  {catalog}
                </option>
              ))}
            </Select>
          </label>
          <label
            htmlFor={`${controlId}-status`}
            {...stylex.props(styles.label)}
          >
            <FormattedMessage
              id="editor.status"
              defaultMessage="Status"
              description="Persisted translation status filter label"
            />
            <Select
              id={`${controlId}-status`}
              value={workflow.status}
              onChange={event =>
                workflow.setStatus(
                  event.target.value as 'all' | 'translated' | 'missing'
                )
              }
            >
              <option value="all">
                <FormattedMessage
                  id="editor.all-messages"
                  defaultMessage="All messages"
                  description="Option showing all translation statuses"
                />
              </option>
              <option value="translated">
                <FormattedMessage
                  id="editor.translated"
                  defaultMessage="Translated"
                  description="Option showing saved translations"
                />
              </option>
              <option value="missing">
                <FormattedMessage
                  id="editor.missing"
                  defaultMessage="Missing"
                  description="Option showing messages without saved translations"
                />
              </option>
            </Select>
          </label>
        </div>
      }
      pagination={
        workflow.pageCount > 1 && (
          <div {...stylex.props(styles.pagination)}>
            <Button
              disabled={workflow.page === 0}
              onClick={() => workflow.setPage(workflow.page - 1)}
            >
              <FormattedMessage
                id="editor.previous"
                defaultMessage="Previous"
                description="Previous page of messages"
              />
            </Button>
            <span>
              <FormattedMessage
                id="editor.page"
                defaultMessage="Page {page, number} of {pages, number}"
                description="Current message page and total pages"
                values={{page: workflow.page + 1, pages: workflow.pageCount}}
              />
            </span>
            <Button
              disabled={workflow.page + 1 >= workflow.pageCount}
              onClick={() => workflow.setPage(workflow.page + 1)}
            >
              <FormattedMessage
                id="editor.next"
                defaultMessage="Next"
                description="Next page of messages"
              />
            </Button>
          </div>
        )
      }
      context={
        workflow.selectedMessage && (
          <div {...stylex.props(styles.context)}>
            {!!workflow.selectedMessage.catalogs?.length && (
              <p>{workflow.selectedMessage.catalogs.join(', ')}</p>
            )}
            <ul>
              {workflow.selectedMessage.locations?.map((location, index) => (
                <li key={`${location.file}:${location.start ?? ''}:${index}`}>
                  <bdi>
                    {location.file}
                    {location.start === undefined ? '' : `:${location.start}`}
                    {location.end === undefined ||
                    location.end === location.start
                      ? ''
                      : `–${location.end}`}
                  </bdi>
                </li>
              ))}
            </ul>
          </div>
        )
      }
    />
  )
}
