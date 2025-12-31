import * as React from 'react'
import {Alert, AlertDescription, AlertTitle} from './ui/alert'
import {Info, Lightbulb, AlertTriangle, AlertCircle} from 'lucide-react'

interface AdmonitionProps {
  type?: 'note' | 'tip' | 'info' | 'caution' | 'warning' | 'danger'
  title?: string
  children: React.ReactNode
}

const typeToTitle = {
  note: 'Note',
  tip: 'Tip',
  info: 'Info',
  caution: 'Caution',
  warning: 'Warning',
  danger: 'Danger',
} as const

const typeToIcon = {
  note: Info,
  tip: Lightbulb,
  info: Info,
  caution: AlertTriangle,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const

const typeToClassName = {
  note: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
  tip: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100',
  info: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100',
  caution:
    'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-100',
  warning:
    'border-orange-500 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
  danger:
    'border-red-500 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100',
} as const

export default function Admonition({
  type = 'note',
  title,
  children,
}: AdmonitionProps): React.ReactNode {
  const defaultTitle = typeToTitle[type]
  const Icon = typeToIcon[type]
  const className = typeToClassName[type]

  return (
    <Alert className={`my-4 ${className}`}>
      <Icon className="h-4 w-4" />
      {(title || defaultTitle) && (
        <AlertTitle>{title || defaultTitle}</AlertTitle>
      )}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
