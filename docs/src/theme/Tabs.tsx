import * as React from 'react'
import {useState} from 'react'
import {Tabs as MuiTabs, Tab, Box} from '@mui/material'

interface TabsProps {
  children: React.ReactNode
  groupId?: string
  defaultValue?: string
  values?: Array<{label: string; value: string}>
}

export default function Tabs({
  children,
  defaultValue,
  values,
}: TabsProps): React.ReactNode {
  const childrenArray = React.Children.toArray(children)
  const tabLabels =
    values ||
    childrenArray.map((child: any, index) => ({
      label: child.props?.value || `Tab ${index + 1}`,
      value: child.props?.value || String(index),
    }))

  const [selectedTab, setSelectedTab] = useState(
    defaultValue || tabLabels[0]?.value || '0'
  )

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue)
  }

  return (
    <Box sx={{width: '100%', mb: 2}}>
      <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
        <MuiTabs value={selectedTab} onChange={handleChange}>
          {tabLabels.map(tab => (
            <Tab key={tab.value} label={tab.label} value={tab.value} />
          ))}
        </MuiTabs>
      </Box>
      {childrenArray.map((child: any, index) => {
        const value = child.props?.value || String(index)
        return (
          <Box
            key={value}
            role="tabpanel"
            hidden={selectedTab !== value}
            sx={{pt: 2}}
          >
            {selectedTab === value && child}
          </Box>
        )
      })}
    </Box>
  )
}
