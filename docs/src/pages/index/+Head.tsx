import * as React from 'react'

export function Head(): React.ReactNode {
  return (
    <>
      <title>
        FormatJS - Internationalize your web apps on the client & server
      </title>
      <meta
        name="description"
        content="Industry-standard i18n libraries for JavaScript. FormatJS provides modular libraries for formatting numbers, dates, and strings for React, Vue, and vanilla JS. Built on ICU Message syntax and ECMA-402."
      />
      <meta
        property="og:title"
        content="FormatJS - Internationalize your web apps"
      />
      <meta
        property="og:description"
        content="Industry-standard i18n libraries for JavaScript. Built on ICU Message syntax."
      />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://formatjs.io/" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="FormatJS - Internationalize your web apps"
      />
      <meta
        name="twitter:description"
        content="Industry-standard i18n libraries for JavaScript. Built on ICU Message syntax."
      />
      <link rel="canonical" href="https://formatjs.io/" />
    </>
  )
}
