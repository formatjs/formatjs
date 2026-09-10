import {useId, type ReactNode} from 'react'
import {useEditorDesignSystem} from '#packages/editor/design-system.js'
export {
  type EditorButtonProps,
  type EditorInputProps,
  type EditorTextInputProps,
  type EditorTextAreaProps,
  type EditorMessageRowProps,
  type EditorPanelProps,
  type EditorLayoutProps,
  type EditorComponents,
  type EditorCheckboxProps,
  type EditorLocalePickerLayoutProps,
  type EditorPreviewTokenProps,
  type EditorCopyStatus,
  type EditorCopyButtonProps,
  type EditorMetadataProps,
  type EditorToolComponents,
  type ResolvedEditorComponents,
  nativeEditorComponents,
  type EditorDesignSystemProviderProps,
  EditorDesignSystemProvider,
  useEditorDesignSystem,
} from '#packages/editor/design-system.js'
export {
  type LocalePickerLabels,
  type LocalePickerProps,
  LocalePicker,
} from '#packages/editor/locale-picker.js'
export {
  type MessagePreviewProps,
  MessagePreview,
} from '#packages/editor/message-preview.js'
export {
  type CopyTextLabels,
  type CopyTextButtonProps,
  CopyTextButton,
} from '#packages/editor/copy-text-button.js'
export {
  type MessageContextLabels,
  type MessageContextProps,
  MessageContext,
} from '#packages/editor/message-context.js'
import type {
  EditorMessage,
  TranslationDraftState,
} from '#packages/editor/workflow.js'
import type {TranslationValidationError} from '#packages/editor/validation.js'

export interface EditorLabels {
  search: string
  messages: string
  source: string
  noMessages: string
  noSelection: string
  loading: string
  copySource: string
  reset: string
  save: string
  saving: string
  saved: string
  unsaved: string
  unchanged: string
  validation: Record<TranslationValidationError, string>
}
const defaultLabels: EditorLabels = {
  search: 'Search messages',
  messages: 'Messages',
  source: 'Source message',
  noMessages: 'No matching messages',
  noSelection: 'Select a message',
  loading: 'Loading messages…',
  copySource: 'Copy source',
  reset: 'Reset',
  save: 'Save translation',
  saving: 'Saving…',
  saved: 'Translation saved.',
  unsaved: 'Unsaved changes',
  unchanged: 'No unsaved changes',
  validation: {
    empty: 'Enter a translation before saving.',
    'invalid-source': 'The source contains invalid ICU syntax.',
    'invalid-translation': 'The translation contains invalid ICU syntax.',
    structure:
      'Preserve ICU arguments, tags, formatting styles, and selector branches.',
  },
}
export type EditorLabelOverrides = Partial<Omit<EditorLabels, 'validation'>> & {
  validation?: Partial<EditorLabels['validation']>
}
function resolveLabels(labels?: EditorLabelOverrides): EditorLabels {
  return {
    ...defaultLabels,
    ...labels,
    validation: {...defaultLabels.validation, ...labels?.validation},
  }
}
interface ViewOptions {
  labels?: EditorLabelOverrides
}
export type EditorViewMessage = Pick<
  EditorMessage,
  'id' | 'defaultMessage' | 'description'
>
export interface EditorSearch {
  value: string
  onValueChange: (value: string) => void
}
export interface EditorMessageRenderState {
  selected: boolean
}
export interface MessageListProps<
  Message extends EditorViewMessage = EditorViewMessage,
> extends ViewOptions {
  messages: readonly Message[]
  selectedId?: string
  onSelect: (id: string) => void
  search?: EditorSearch
  loading?: boolean
  pagination?: ReactNode
  /** Summary or controls between search and the loaded rows. */
  listSummary?: ReactNode
  /** Noninteractive content inside the design-system selection control. */
  renderMessage?: (
    message: Message,
    state: EditorMessageRenderState
  ) => ReactNode
  /** Interactive actions rendered beside, never inside, the selection control. */
  renderMessageActions?: (
    message: Message,
    state: EditorMessageRenderState
  ) => ReactNode
}
/** Controlled list: it never filters, paginates, fetches, or changes selection itself. */
export function MessageList<
  Message extends EditorViewMessage = EditorViewMessage,
>({
  messages,
  selectedId,
  onSelect,
  search,
  loading = false,
  pagination,
  listSummary,
  renderMessage,
  renderMessageActions,
  labels,
}: MessageListProps<Message>): ReactNode {
  const {TextInput, MessageRow} = useEditorDesignSystem()
  const text = resolveLabels(labels)
  const searchId = useId()
  return (
    <nav aria-label={text.messages} aria-busy={loading}>
      {search && (
        <div>
          <label htmlFor={searchId}>{text.search}</label>
          <TextInput
            id={searchId}
            type="search"
            value={search.value}
            onValueChange={search.onValueChange}
          />
        </div>
      )}
      {listSummary}
      {loading && (
        <p>
          <output>{text.loading}</output>
        </p>
      )}
      <ul>
        {messages.map(message => {
          const state = {selected: message.id === selectedId}
          return (
            <li key={message.id}>
              <MessageRow
                selected={state.selected}
                onSelect={() => onSelect(message.id)}
              >
                {renderMessage ? (
                  renderMessage(message, state)
                ) : (
                  <>
                    <span>{message.defaultMessage}</span>{' '}
                    <code>{message.id}</code>
                  </>
                )}
              </MessageRow>
              {renderMessageActions?.(message, state)}
            </li>
          )
        })}
      </ul>
      {!loading && messages.length === 0 && (
        <p>
          <output>{text.noMessages}</output>
        </p>
      )}
      {pagination}
    </nav>
  )
}
export interface SourceMessageProps extends ViewOptions {
  message: EditorViewMessage
  preview?: ReactNode
  context?: ReactNode
}
export function SourceMessage({
  message,
  preview,
  context,
  labels,
}: SourceMessageProps): ReactNode {
  const {Panel} = useEditorDesignSystem()
  const text = resolveLabels(labels)
  return (
    <Panel kind="source" label={text.source}>
      <h2>{text.source}</h2>
      <code>{message.id}</code>
      {preview ?? <pre>{message.defaultMessage}</pre>}
      {message.description && <p>{message.description}</p>}
      {context}
    </Panel>
  )
}
export type TranslationFieldDraft = Pick<
  TranslationDraftState,
  | 'value'
  | 'validationError'
  | 'changed'
  | 'isSaving'
  | 'saveError'
  | 'saved'
  | 'setTranslation'
  | 'reset'
>
export interface TranslationFieldProps extends ViewOptions {
  locale: string
  /** Human-readable label; defaults to the locale identifier. */
  label?: string
  source: string
  draft: TranslationFieldDraft
  /** The caller owns confirmation, context, persistence, and receipt presentation. */
  onSave?: () => void
  /** Overrides the default copy/reset/save actions, including with null. */
  actions?: ReactNode
  preview?: ReactNode
}
export function TranslationField({
  locale,
  label = locale,
  source,
  draft,
  onSave,
  actions,
  preview,
  labels,
}: TranslationFieldProps): ReactNode {
  const {Panel, TextArea, Button} = useEditorDesignSystem()
  const text = resolveLabels(labels)
  const id = useId()
  const errorId = `${id}-error`
  const statusId = `${id}-status`
  const validation = draft.validationError
    ? text.validation[draft.validationError]
    : null
  const error = validation ?? draft.saveError?.message
  return (
    <Panel kind="translation" label={label}>
      <label htmlFor={id}>{label}</label>
      <TextArea
        id={id}
        value={draft.value}
        onValueChange={draft.setTranslation}
        aria-invalid={!!validation}
        aria-describedby={error ? `${errorId} ${statusId}` : statusId}
      />
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
      <p>
        <output id={statusId}>
          {draft.isSaving
            ? text.saving
            : draft.saved
              ? text.saved
              : draft.changed
                ? text.unsaved
                : text.unchanged}
        </output>
      </p>
      {preview}
      {actions !== undefined ? (
        actions
      ) : (
        <div>
          <Button
            variant="secondary"
            disabled={draft.isSaving}
            onPress={() => draft.setTranslation(source)}
          >
            {text.copySource}
          </Button>
          <Button
            variant="secondary"
            disabled={!draft.changed || draft.isSaving}
            onPress={draft.reset}
          >
            {text.reset}
          </Button>
          {onSave && (
            <Button
              variant="primary"
              disabled={
                !draft.changed || !!draft.validationError || draft.isSaving
              }
              onPress={onSave}
            >
              {draft.isSaving ? text.saving : text.save}
            </Button>
          )}
        </div>
      )}
    </Panel>
  )
}
export type EditorTranslation = Omit<TranslationFieldProps, 'source'>
export interface TranslationEditorViewProps<
  Message extends EditorViewMessage = EditorViewMessage,
> extends MessageListProps<Message> {
  /** May be outside the loaded list, e.g. during a server-side page change. */
  selectedMessage?: EditorViewMessage
  translations: readonly EditorTranslation[]
  filters?: ReactNode
  context?: ReactNode
  sourcePreview?: ReactNode
  notice?: ReactNode
  sidebar?: ReactNode
  /** Replaces the no-selection status; null suppresses it. */
  emptyState?: ReactNode
  /** Wrap the generated locale fields without recreating their wiring. */
  renderTranslations?: (fields: ReactNode) => ReactNode
  /** Wrap the entire detail region, including notices and the empty state. */
  renderContent?: (content: ReactNode) => ReactNode
}
/** A stateless composition over caller-owned navigation and locale drafts. */
export function TranslationEditorView<
  Message extends EditorViewMessage = EditorViewMessage,
>({
  selectedMessage,
  selectedId = selectedMessage?.id,
  translations,
  filters,
  context,
  sourcePreview,
  notice,
  sidebar,
  emptyState,
  renderTranslations,
  renderContent,
  labels,
  ...list
}: TranslationEditorViewProps<Message>): ReactNode {
  const {Layout} = useEditorDesignSystem()
  const text = resolveLabels(labels)
  const fields = selectedMessage
    ? translations.map(translation => (
        <TranslationField
          {...translation}
          key={`${selectedMessage.id}:${translation.locale}`}
          source={selectedMessage.defaultMessage}
          labels={{
            ...labels,
            ...translation.labels,
            validation: {
              ...labels?.validation,
              ...translation.labels?.validation,
            },
          }}
        />
      ))
    : null
  const content = (
    <>
      {notice}
      {selectedMessage ? (
        <>
          <SourceMessage
            message={selectedMessage}
            preview={sourcePreview}
            context={context}
            labels={labels}
          />
          {renderTranslations ? renderTranslations(fields) : fields}
        </>
      ) : emptyState !== undefined ? (
        emptyState
      ) : (
        <p>
          <output>{text.noSelection}</output>
        </p>
      )}
    </>
  )
  return (
    <Layout
      toolbar={filters}
      navigation={
        <MessageList {...list} selectedId={selectedId} labels={labels} />
      }
      content={renderContent ? renderContent(content) : content}
      sidebar={sidebar}
    />
  )
}
