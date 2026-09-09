import * as stylex from '@stylexjs/stylex'
import type {ComponentProps, ReactElement, ReactNode} from 'react'
import {tokens} from './tokens.stylex.js'

const styles = stylex.create({
  button: {
    alignItems: 'center',
    display: 'inline-flex',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    paddingInline: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.line,
    borderRadius: 8,
    backgroundColor: {default: tokens.surface, ':hover': tokens.subtle},
    color: tokens.text,
    fontFamily: tokens.font,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    outlineColor: tokens.accent,
    outlineOffset: 3,
    opacity: {default: 1, ':disabled': 0.5},
  },
  primary: {
    backgroundColor: {default: tokens.accent, ':hover': tokens.accentHover},
    color: '#fff',
    borderColor: tokens.accent,
  },
  field: {
    boxSizing: 'border-box',
    width: '100%',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: {default: tokens.line, ':focus': tokens.accent},
    borderRadius: 8,
    backgroundColor: tokens.surface,
    color: tokens.text,
    fontFamily: tokens.font,
    fontSize: 14,
    lineHeight: 1.6,
    paddingBlock: 11,
    paddingInline: 13,
    outlineColor: tokens.accent,
    outlineOffset: 2,
  },
  textarea: {
    fontFamily: tokens.mono,
    fontSize: 15,
    minHeight: 180,
    resize: 'vertical',
  },
  invalid: {
    borderColor: tokens.danger,
    outlineColor: tokens.danger,
    backgroundColor: tokens.dangerSoft,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 5,
    paddingInline: 10,
    borderRadius: 6,
    backgroundColor: tokens.subtle,
    color: tokens.muted,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  positive: {backgroundColor: tokens.accentSoft, color: tokens.accent},
  panel: {
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: tokens.line,
    borderRadius: tokens.radius,
    minWidth: 0,
    overflow: 'hidden',
  },
})

export function Button({
  variant = 'secondary',
  ...props
}: Omit<ComponentProps<'button'>, 'className' | 'style'> & {
  variant?: 'primary' | 'secondary'
}): ReactElement {
  return (
    <button
      type="button"
      {...props}
      {...stylex.props(styles.button, variant === 'primary' && styles.primary)}
    />
  )
}

export function TextInput(
  props: Omit<ComponentProps<'input'>, 'className' | 'style'>
): ReactElement {
  return (
    <input
      {...props}
      {...stylex.props(
        styles.field,
        props['aria-invalid'] === true && styles.invalid
      )}
    />
  )
}

export function TextArea(
  props: Omit<ComponentProps<'textarea'>, 'className' | 'style'>
): ReactElement {
  return (
    <textarea
      {...props}
      {...stylex.props(
        styles.field,
        styles.textarea,
        props['aria-invalid'] === true && styles.invalid
      )}
    />
  )
}

export function Badge({
  children,
  positive = false,
}: {
  children: ReactNode
  positive?: boolean
}): ReactElement {
  return (
    <span {...stylex.props(styles.badge, positive && styles.positive)}>
      {children}
    </span>
  )
}

export function Panel({children}: {children: ReactNode}): ReactElement {
  return <section {...stylex.props(styles.panel)}>{children}</section>
}

export function Select(
  props: Omit<ComponentProps<'select'>, 'className' | 'style'>
): ReactElement {
  return <select {...props} {...stylex.props(styles.field)} />
}
