import * as stylex from '@stylexjs/stylex'
import {FormattedMessage} from 'react-intl'
import {useId, type ReactElement} from 'react'
import {useTranslationEditor, type TranslationEditorOptions} from '../index.js'
import {EditorView} from './demo.js'
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
  return (
    <EditorView
      editor={{...editor, messages: workflow.pageMessages}}
      messageCount={editor.messages.length}
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
      validation={
        workflow.changed &&
        workflow.validationError && (
          <FormattedMessage
            id="editor.validation"
            defaultMessage="{reason, select, empty {Enter a translation before saving.} invalid-source {The source contains invalid ICU syntax.} invalid-translation {The translation contains invalid ICU syntax.} other {Preserve ICU arguments, tags, formatting styles, and selector branches.}}"
            description="Reason a translation cannot be saved"
            values={{reason: workflow.validationError}}
          />
        )
      }
      notice={
        workflow.saveError ? (
          <span role="alert">
            <FormattedMessage
              id="editor.save-error"
              defaultMessage="Save failed: {error}"
              description="Translation persistence failed; error is the consumer diagnostic"
              values={{error: workflow.saveError.message}}
            />
          </span>
        ) : workflow.saved ? (
          <output>
            <FormattedMessage
              id="editor.saved"
              defaultMessage="Translation saved."
              description="Successful translation persistence confirmation"
            />
          </output>
        ) : (
          <FormattedMessage
            id="editor.unsaved"
            defaultMessage="{changed, select, yes {Unsaved changes} other {No unsaved changes}}"
            description="Whether the selected translation has unpersisted edits"
            values={{changed: workflow.changed ? 'yes' : 'no'}}
          />
        )
      }
      actions={
        <>
          <Button onClick={editor.copySource}>
            <FormattedMessage
              id="editor.copy-source"
              defaultMessage="Copy source"
              description="Button copying the source into the translation"
            />
          </Button>
          <Button
            onClick={workflow.reset}
            disabled={!workflow.changed || workflow.isSaving}
          >
            <FormattedMessage
              id="editor.reset"
              defaultMessage="Reset"
              description="Restore the selected translation to its saved value"
            />
          </Button>
          <Button
            variant="primary"
            disabled={
              !workflow.changed ||
              !!workflow.validationError ||
              workflow.isSaving
            }
            onClick={() => {
              void workflow.save()
            }}
          >
            <FormattedMessage
              id="editor.save"
              defaultMessage="{saving, select, yes {Saving…} other {Save translation}}"
              description="Button persisting the selected translation"
              values={{saving: workflow.isSaving ? 'yes' : 'no'}}
            />
          </Button>
        </>
      }
    />
  )
}
