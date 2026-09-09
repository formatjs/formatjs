import React from 'react'

/** Test-owned document settings; the editor supplies its theme/i18n providers. */
export function EditorTestShell({children}: {children: React.ReactNode}) {
  return (
    <div lang="en" dir="ltr">
      {children}
    </div>
  )
}
