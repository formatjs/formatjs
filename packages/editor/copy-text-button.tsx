import {useEffect, useRef, useState, type ReactNode} from 'react'
import {
  useEditorDesignSystem,
  type EditorCopyStatus,
} from '#packages/editor/design-system.js'

export interface CopyTextLabels {
  copy: (label: string) => string
  copying: (label: string) => string
  copied: (label: string) => string
  failed: (label: string) => string
}
export interface CopyTextButtonProps {
  value: string
  label: string
  disabled?: boolean
  /** Injectable clipboard boundary; rejects when the write fails. */
  writeText?: (value: string) => Promise<void>
  onCopy?: (value: string) => void
  onError?: (error: Error, value: string) => void
  feedbackDurationMs?: number
  labels?: Partial<CopyTextLabels>
}
const defaults: CopyTextLabels = {
  copy: label => `Copy ${label}`,
  copying: label => `Copying ${label}…`,
  copied: label => `Copied ${label}`,
  failed: label => `Could not copy ${label}`,
}
async function writeClipboard(value: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard access is unavailable')
  }
  await navigator.clipboard.writeText(value)
}

/** Copies exact text; feedback belongs to the current value and mounted control. */
export function CopyTextButton({
  value,
  label,
  disabled = false,
  writeText = writeClipboard,
  onCopy,
  onError,
  feedbackDurationMs = 1500,
  labels,
}: CopyTextButtonProps): ReactNode {
  const {CopyButton} = useEditorDesignSystem()
  const [status, setStatus] = useState<EditorCopyStatus>('idle')
  const operation = useRef({
    generation: 0,
    pending: false,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  })
  useEffect(() => {
    const current = operation.current
    current.generation++
    current.pending = false
    setStatus('idle')
    clearTimeout(current.timer)
    return () => {
      current.generation++
      clearTimeout(current.timer)
    }
  }, [value, writeText])
  const copy = async (): Promise<void> => {
    const current = operation.current
    if (disabled || current.pending) return
    current.pending = true
    const request = ++current.generation
    clearTimeout(current.timer)
    setStatus('copying')
    let error: Error | undefined
    try {
      await writeText(value)
    } catch (failure) {
      error = failure instanceof Error ? failure : new Error(String(failure))
    }
    if (request !== current.generation) return
    current.pending = false
    setStatus(error ? 'error' : 'copied')
    current.timer = setTimeout(
      () => {
        if (request === current.generation) setStatus('idle')
      },
      Math.max(0, feedbackDurationMs)
    )
    if (error) onError?.(error, value)
    else onCopy?.(value)
  }
  const text = {...defaults, ...labels}
  const buttonLabel = (
    status === 'copying'
      ? text.copying
      : status === 'copied'
        ? text.copied
        : status === 'error'
          ? text.failed
          : text.copy
  )(label)
  return (
    <span>
      <CopyButton
        label={buttonLabel}
        status={status}
        disabled={disabled || status === 'copying'}
        onPress={() => {
          void copy()
        }}
      />
      {status === 'copied' && <output>{text.copied(label)}</output>}
      {status === 'error' && <span role="alert">{text.failed(label)}</span>}
    </span>
  )
}
