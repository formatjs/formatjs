import {
  createContext,
  useContext,
  useId,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react'
import type {
  EditorMessage,
  TranslationDraftState,
} from '#packages/editor/workflow.js'
import type {TranslationValidationError} from '#packages/editor/validation.js'

export interface EditorButtonProps {
  children: ReactNode
  /** Called once per activation, without a DOM event; disabled controls must not call it. */
  onPress: () => void
  disabled?: boolean
  variant: 'primary' | 'secondary'
}
export interface EditorInputProps {
  id: string
  value: string
  /** Reports the complete next string value; never a DOM event. */
  onValueChange: (value: string) => void
  disabled?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}
export interface EditorTextInputProps extends EditorInputProps {
  type: 'text' | 'search'
}
export interface EditorTextAreaProps extends EditorInputProps {
  /** Visible rows when supported by the control; defaults to six. */
  rows?: number
}
export interface EditorMessageRowProps {
  children: ReactNode
  selected: boolean
  /** Activates this row without changing controlled selection itself. */
  onSelect: () => void
}
export interface EditorPanelProps {
  children: ReactNode
  label: string
  kind: 'source' | 'translation'
}
export interface EditorLayoutProps {
  toolbar: ReactNode
  navigation: ReactNode
  content: ReactNode
  /** Optional secondary content, arranged by the design-system layout. */
  sidebar?: ReactNode
}
/** Define adapters outside render so controls retain focus across edits. */
export interface EditorComponents {
  Button: ComponentType<EditorButtonProps>
  TextInput: ComponentType<EditorTextInputProps>
  TextArea: ComponentType<EditorTextAreaProps>
  MessageRow: ComponentType<EditorMessageRowProps>
  Panel: ComponentType<EditorPanelProps>
  Layout: ComponentType<EditorLayoutProps>
}
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
/** Unstyled native controls; no CSS, icons, or localization provider is required. */
export const nativeEditorComponents: EditorComponents = {
  Button: ({children, onPress, disabled}) => (
    <button type="button" disabled={disabled} onClick={() => onPress()}>
      {children}
    </button>
  ),
  TextInput: ({onValueChange, ...props}) => (
    <input {...props} onChange={event => onValueChange(event.target.value)} />
  ),
  TextArea: ({onValueChange, rows = 6, ...props}) => (
    <textarea
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
    >
      {children}
    </button>
  ),
  Panel: ({children, label}) => (
    <section aria-label={label}>{children}</section>
  ),
  Layout: ({toolbar, navigation, content, sidebar}) => (
    <div>
      {toolbar}
      <div>
        {navigation}
        {content}
        {sidebar}
      </div>
    </div>
  ),
}
const EditorDesignSystemContext = createContext<Readonly<EditorComponents>>(
  nativeEditorComponents
)

export interface EditorDesignSystemProviderProps {
  /** Overrides inherit unspecified components from the nearest provider. */
  components: Partial<EditorComponents>
  children: ReactNode
}
/** Configure a tree once; sibling providers remain independent. */
export function EditorDesignSystemProvider({
  components,
  children,
}: EditorDesignSystemProviderProps): ReactNode {
  const parent = useEditorDesignSystem()
  const value = useMemo(
    () => ({...parent, ...components}),
    [parent, components]
  )
  return (
    <EditorDesignSystemContext value={value}>
      {children}
    </EditorDesignSystemContext>
  )
}
/** Read the resolved controls, including native defaults outside a provider. */
export function useEditorDesignSystem(): Readonly<EditorComponents> {
  return useContext(EditorDesignSystemContext)
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
