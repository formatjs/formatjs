import * as React from 'react'

interface TabItemProps {
  children: React.ReactNode
  value: string
  label?: string
}

export default function TabItem({children}: TabItemProps): React.ReactNode {
  return <div>{children}</div>
}
