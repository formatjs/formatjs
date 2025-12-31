import * as React from 'react'

export default function BrowserSection(): React.ReactNode {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
      <h2 className="text-xl md:text-2xl font-semibold mb-4">
        Runs in the browser and Node.js.
      </h2>
      <p className="text-sm md:text-base text-muted-foreground mb-4">
        FormatJS has been tested in all the major browsers (IE11, Chrome, FF &
        Safari) on both desktop and mobile devices. For many web apps rendering
        happens on the server, so we made sure FormatJS works perfectly in
        Node.js. This allows developers to use FormatJS on both the server and
        client-side of their apps.
      </p>
      <div className="flex flex-wrap gap-4 md:gap-8 my-8 items-center">
        <img src="/img/chrome.png" alt="Chrome" className="h-10 md:h-[60px]" />
        <img
          src="/img/firefox.png"
          alt="Firefox"
          className="h-10 md:h-[60px]"
        />
        <img src="/img/safari.png" alt="Safari" className="h-10 md:h-[60px]" />
        <img src="/img/edge.png" alt="Edge" className="h-10 md:h-[60px]" />
        <img src="/img/ie11.png" alt="IE11" className="h-10 md:h-[60px]" />
        <img src="/img/node.svg" alt="Node.js" className="h-10 md:h-[60px]" />
      </div>
    </div>
  )
}
