import * as React from 'react'

export default function TrustedBySection(): React.ReactNode {
  return (
    <div className="bg-gray-900 py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-8">
          Trusted by industry leaders.
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          <img
            src="/img/yahoo.svg"
            alt="Yahoo"
            className="h-[30px] md:h-10 brightness-75"
          />
          <img
            src="/img/dropbox.svg"
            alt="Dropbox"
            className="h-[30px] md:h-10 brightness-75"
          />
          <img
            src="/img/tinder.svg"
            alt="Tinder"
            className="h-[30px] md:h-10 brightness-75"
          />
          <img
            src="/img/ethereum.svg"
            alt="Ethereum"
            className="h-[30px] md:h-10 brightness-75"
          />
          <img
            src="/img/mozilla.svg"
            alt="Mozilla"
            className="h-[30px] md:h-10 brightness-75"
          />
          <img
            src="/img/coinbase_white.svg"
            alt="Coinbase"
            className="h-[30px] md:h-10"
          />
        </div>
      </div>
    </div>
  )
}
