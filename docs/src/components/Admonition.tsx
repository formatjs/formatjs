import * as React from 'react'
import {Alert, AlertTitle} from '@mui/material'

interface AdmonitionProps {
  type?: 'note' | 'tip' | 'info' | 'caution' | 'warning' | 'danger'
  title?: string
  children: React.ReactNode
}

const typeToSeverity = {
  note: 'info',
  tip: 'success',
  info: 'info',
  caution: 'warning',
  warning: 'warning',
  danger: 'error',
} as const

const typeToTitle = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  caution: 'Caution',
  warning: 'Warning',
  danger: 'Danger',
} as const

export default function Admonition({
  type = 'note',
  title,
  children,
}: AdmonitionProps): React.ReactNode {
  const severity = typeToSeverity[type]
  const defaultTitle = typeToTitle[type]

  return (
    <Alert severity={severity} variant="filled" sx={{my: 2}}>
      {(title || defaultTitle) && (
        <AlertTitle>{title || defaultTitle}</AlertTitle>
      )}
      {children}
    </Alert>
  )
}
