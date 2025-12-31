import * as React from 'react'

// Default head tags for all pages
export function Head(): React.ReactNode {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/img/logo-icon.svg" type="image/svg+xml" />
      <meta name="theme-color" content="#6f3c97" />
    </>
  )
}
