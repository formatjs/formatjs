import * as React from 'react'

export default function RosettaSection(): React.ReactNode {
  return (
    <section
      aria-labelledby="stone-title"
      className="grid grid-cols-1 items-end gap-10 px-[clamp(20px,2.2vw,32px)] pt-[140px] pb-[120px] sm:grid-cols-12 sm:gap-6 sm:pt-[160px] sm:pb-[160px] lg:pt-[200px]"
    >
      <div className="grid content-end gap-6 sm:col-span-6 lg:col-span-5">
        <h2
          id="stone-title"
          data-reveal
          className="m-0 text-[clamp(2rem,1.3rem+3.2vw,4rem)] leading-none font-bold tracking-[-0.03em] uppercase"
        >
          One message, three scripts
        </h2>
        <p
          data-reveal
          style={{'--d': '80ms'} as React.CSSProperties}
          className="m-0 max-w-[46ch]"
        >
          The Rosetta Stone carries a single decree from 196 BC in hieroglyphic,
          Demotic and Greek, so that priests, officials and Greek readers all
          got the same message. A FormatJS catalog does the same job for every
          locale you ship: one ID, one meaning, many translations.
        </p>
        <figure
          data-reveal
          style={{'--d': '160ms'} as React.CSSProperties}
          className="m-0"
        >
          <img
            src="/img/home/rosetta-greek.webp"
            width={800}
            height={534}
            loading="lazy"
            alt="Close-up of the Greek inscription carved into the dark granodiorite of the Rosetta Stone"
            className="aspect-[3/2] w-full object-cover"
          />
          <figcaption className="mt-2.5 text-sm text-home-muted">
            The Greek text, the part scholars could already read.
          </figcaption>
        </figure>
      </div>
      <figure
        data-reveal
        style={{'--d': '120ms'} as React.CSSProperties}
        className="-order-1 m-0 sm:order-none sm:col-span-6 sm:col-start-7"
      >
        <div className="overflow-clip">
          <img
            src="/img/home/rosetta-front.webp"
            width={960}
            height={1123}
            loading="lazy"
            alt="The front face of the Rosetta Stone with hieroglyphic text at the top, Demotic in the middle and Greek at the bottom"
            className="home-drift aspect-[6/7] w-full object-cover"
          />
        </div>
        <figcaption className="mt-2.5 text-sm text-home-muted">
          The Rosetta Stone, British Museum. Hieroglyphic at the top, Demotic in
          the middle, Greek below.
        </figcaption>
      </figure>
    </section>
  )
}
