import * as React from 'react'

// Default head tags for all pages
export function Head(): React.ReactNode {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/img/logo-icon.svg" type="image/svg+xml" />
      <meta name="theme-color" content="#6f3c97" />

      {/* Google Analytics */}
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-4H6ZM973P2"
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4H6ZM973P2');
          `,
        }}
      />
    </>
  )
}
