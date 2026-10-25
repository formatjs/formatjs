import * as React from 'react'

const LOGOS: {
  src: string
  alt: string
  width: number
  height: number
  label?: boolean
  nativeColor?: boolean
  className?: string
}[] = [
  {src: '/img/anthropic.svg', alt: 'Anthropic', width: 182, height: 24},
  {src: '/img/perplexity.svg', alt: 'Perplexity', width: 1588, height: 400},
  {src: '/img/openai.svg', alt: 'OpenAI', width: 269.659, height: 72.5157},
  {src: '/img/discord.svg', alt: 'Discord', width: 219, height: 32},
  {
    src: '/img/atlassian.svg',
    alt: 'Atlassian',
    width: 256,
    height: 256,
    label: true,
  },
  {src: '/img/elastic.svg', alt: 'Elastic', width: 24, height: 24, label: true},
  {
    src: '/img/salesforce.svg',
    alt: 'Salesforce',
    width: 999,
    height: 699.242,
    nativeColor: true,
  },
  {
    src: '/img/grafana.svg',
    alt: 'Grafana Labs',
    width: 256,
    height: 279,
    label: true,
  },
  {src: '/img/redhat.svg', alt: 'Red Hat', width: 24, height: 24, label: true},
  {
    src: '/img/mattermost.svg',
    alt: 'Mattermost',
    width: 501,
    height: 501,
    label: true,
  },
  {
    src: '/img/canva.svg',
    alt: 'Canva',
    label: true,
    width: 80,
    height: 80,
    nativeColor: true,
  },
  {src: '/img/google.svg', alt: 'Google', width: 272, height: 92},
  {
    src: '/img/microsoft.svg',
    alt: 'Microsoft',
    width: 256,
    height: 256,
    label: true,
  },
  {
    src: '/img/amazonwebservices.svg',
    alt: 'Amazon Web Services',
    width: 304,
    height: 182,
    className: 'h-10 w-auto',
  },
  {src: '/img/adobe.svg', alt: 'Adobe', width: 91, height: 80, label: true},
  {
    src: '/img/cisco.svg',
    alt: 'Cisco',
    width: 52,
    height: 28,
    className: 'h-10 w-auto',
  },
  {src: '/img/block.svg', alt: 'Block', width: 116, height: 35},
  {
    src: '/img/box.svg',
    alt: 'Box',
    width: 24,
    height: 24,
    className: 'h-12 w-auto',
  },
  {
    src: '/img/databricks.svg',
    alt: 'Databricks',
    width: 24,
    height: 24,
    label: true,
  },
  {
    src: '/img/snowflake.svg',
    alt: 'Snowflake',
    width: 24,
    height: 24,
    label: true,
  },
  {src: '/img/oracle.svg', alt: 'Oracle', width: 800, height: 104.049},
  {src: '/img/yahoo.svg', alt: 'Yahoo', width: 264.583, height: 73.3754},
  {src: '/img/dropbox.svg', alt: 'Dropbox', width: 1000, height: 196.9},
  {src: '/img/tinder.svg', alt: 'Tinder', width: 519, height: 123},
  {
    src: '/img/ethereum.svg',
    alt: 'Ethereum',
    width: 1920,
    height: 1920,
    label: true,
  },
  {src: '/img/mozilla.svg', alt: 'Mozilla', width: 2000, height: 571.9},
  {
    src: '/img/coinbase_white.svg',
    alt: 'Coinbase',
    width: 1101.64,
    height: 196.79,
  },
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
        className="m-0 grid w-full list-none grid-cols-2 items-center gap-x-8 gap-y-9 p-0 sm:grid-cols-3 lg:flex-1 xl:grid-cols-4"
      >
        {LOGOS.map(logo => (
          <li key={logo.alt} className="flex min-w-0 items-center gap-3">
            <img
              src={logo.src}
              alt={logo.label ? '' : logo.alt}
              width={logo.width}
              height={logo.height}
              loading="lazy"
              className={`max-w-full shrink-0 object-contain ${logo.nativeColor ? '' : 'brightness-0 invert-[.95]'} ${logo.className ?? (logo.label ? 'h-9 w-9' : logo.nativeColor ? 'h-12 w-[72px]' : 'h-[26px] w-auto sm:h-7')}`}
            />
            {logo.label && (
              <span className="text-lg font-medium">{logo.alt}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
