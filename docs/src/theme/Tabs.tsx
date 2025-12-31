import * as React from 'react'
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs'

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

  const initialValue = defaultValue || tabLabels[0]?.value || '0'

  return (
    <ShadcnTabs defaultValue={initialValue} className="w-full mb-4">
      <TabsList>
        {tabLabels.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {childrenArray.map((child: any, index) => {
        const value = child.props?.value || String(index)
        return (
          <TabsContent key={value} value={value}>
            {child}
          </TabsContent>
        )
      })}
    </ShadcnTabs>
  )
}
