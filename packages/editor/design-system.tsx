import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react'
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
export interface EditorComponents extends Partial<EditorToolComponents> {
  Button: ComponentType<EditorButtonProps>
  TextInput: ComponentType<EditorTextInputProps>
  TextArea: ComponentType<EditorTextAreaProps>
  MessageRow: ComponentType<EditorMessageRowProps>
  Panel: ComponentType<EditorPanelProps>
  Layout: ComponentType<EditorLayoutProps>
}
export interface EditorCheckboxProps {
  id: string
  checked: boolean | 'indeterminate'
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}
export interface EditorLocalePickerLayoutProps {
  id: string
  title: string
  summary: string
  triggerLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
  controls: ReactNode
  /** Contiguous, balanced columns in the caller's locale order. */
  columns: readonly ReactNode[]
}
export interface EditorPreviewTokenProps {
  children: ReactNode
  kind:
    | 'argument'
    | 'number'
    | 'date'
    | 'time'
    | 'tag'
    | 'selector'
    | 'plural'
    | 'pound'
    | 'syntax'
}
export type EditorCopyStatus = 'idle' | 'copying' | 'copied' | 'error'
export interface EditorCopyButtonProps {
  label: string
  status: EditorCopyStatus
  disabled: boolean
  onPress: () => void
}
export interface EditorMetadataProps {
  label: string
  children: ReactNode
}
/** Optional additions preserve existing complete design-system registries. */
export interface EditorToolComponents {
  Checkbox: ComponentType<EditorCheckboxProps>
  LocalePickerLayout: ComponentType<EditorLocalePickerLayoutProps>
  PreviewToken: ComponentType<EditorPreviewTokenProps>
  CopyButton: ComponentType<EditorCopyButtonProps>
  Metadata: ComponentType<EditorMetadataProps>
}
export type ResolvedEditorComponents = Required<EditorComponents>
/** Unstyled native controls; no CSS, icons, or localization provider is required. */
export const nativeEditorComponents: ResolvedEditorComponents = {
  Checkbox: function NativeCheckbox({checked, onCheckedChange, ...props}) {
    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => {
      if (ref.current) ref.current.indeterminate = checked === 'indeterminate'
    }, [checked])
    return (
      <input
        {...props}
        ref={ref}
        type="checkbox"
        checked={checked === true}
        aria-checked={checked === 'indeterminate' ? 'mixed' : checked}
        onChange={event => onCheckedChange(event.target.checked)}
      />
    )
  },
  LocalePickerLayout: ({
    id,
    title,
    summary,
    triggerLabel,
    open,
    onOpenChange,
    controls,
    columns,
  }) => (
    <div>
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => onOpenChange(!open)}
      >
        {summary}
      </button>
      <fieldset id={id} hidden={!open}>
        <legend>{title}</legend>
        {controls}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          {columns.map((column, index) => (
            <div key={index}>{column}</div>
          ))}
        </div>
      </fieldset>
    </div>
  ),
  PreviewToken: ({children}) => <code>{children}</code>,
  CopyButton: ({label, onPress, disabled}) => (
    <button type="button" disabled={disabled} onClick={() => onPress()}>
      {label}
    </button>
  ),
  Metadata: ({label, children}) => <aside aria-label={label}>{children}</aside>,
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
const EditorDesignSystemContext = createContext<
  Readonly<ResolvedEditorComponents>
>(nativeEditorComponents)

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
    () => ({
      ...parent,
      ...Object.fromEntries(
        Object.entries(components).filter(([, value]) => value !== undefined)
      ),
    }),
    [parent, components]
  )
  return (
    <EditorDesignSystemContext value={value}>
      {children}
    </EditorDesignSystemContext>
  )
}
/** Read the resolved controls, including native defaults outside a provider. */
export function useEditorDesignSystem(): Readonly<ResolvedEditorComponents> {
  return useContext(EditorDesignSystemContext)
}
