import * as React from 'react'
import {Box} from '@mui/material'

interface TabItemProps {
  children: React.ReactNode
  value: string
  label?: string
}

export default function TabItem({children}: TabItemProps): React.ReactNode {
  return <Box>{children}</Box>
}
