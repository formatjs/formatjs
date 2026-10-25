import * as React from 'react'

const LOGOS = [
  {src: '/img/yahoo.svg', alt: 'Yahoo', width: 106, height: 29},
  {src: '/img/dropbox.svg', alt: 'Dropbox', width: 142, height: 28},
  {src: '/img/tinder.svg', alt: 'Tinder', width: 118, height: 28},
  {src: '/img/ethereum.svg', alt: 'Ethereum', width: 36, height: 36},
  {src: '/img/mozilla.svg', alt: 'Mozilla', width: 105, height: 30},
  {src: '/img/coinbase_white.svg', alt: 'Coinbase', width: 157, height: 28},
]

export default function TrustedBySection(): React.ReactNode {
  return (
    <section
      aria-labelledby="proof-title"
      className="flex flex-col items-start gap-8 px-[clamp(20px,2.2vw,32px)] py-[100px] sm:py-[140px] lg:flex-row lg:items-center lg:gap-12"
    >
      <h2
        id="proof-title"
        data-reveal
        className="m-0 text-lg font-medium whitespace-nowrap"
      >
        In production at
      </h2>
      <ul
        data-reveal
        style={{'--d': '80ms'} as React.CSSProperties}
        className="m-0 grid w-full list-none grid-cols-2 items-center gap-x-8 gap-y-9 p-0 sm:flex sm:flex-1 sm:flex-wrap sm:justify-between"
      >
        {LOGOS.map(logo => (
          <li key={logo.alt}>
            <img
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              loading="lazy"
              className={`w-auto opacity-95 brightness-0 invert-[.95] ${logo.width === logo.height ? 'h-9' : 'h-[26px] sm:h-7'}`}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
