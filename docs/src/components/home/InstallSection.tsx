import * as React from 'react'

const PACKAGES = [
  {value: 'react-intl', label: 'react-intl'},
  {value: 'vue-intl', label: 'vue-intl'},
  {value: '@formatjs/svelte-intl', label: 'svelte-intl'},
  {value: 'intl-messageformat', label: 'intl-messageformat'},
  {value: '@formatjs/cli', label: '@formatjs/cli'},
]

const control =
  'h-[1.05em] cursor-pointer rounded-none border-0 px-[.25em] text-[length:inherit] leading-none font-bold tracking-[-0.03em] uppercase'

export default function InstallSection(): React.ReactNode {
  const [pkg, setPkg] = React.useState(PACKAGES[0].value)
  const [copied, setCopied] = React.useState(false)
  const command = `npm i ${pkg}`

  React.useEffect(() => setCopied(false), [pkg])

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      aria-labelledby="cta-title"
      className="bg-home-surface px-[clamp(20px,2.2vw,32px)] pt-[120px] pb-[140px] sm:pt-[160px] sm:pb-[200px]"
    >
      <form data-reveal onSubmit={onSubmit}>
        <h2
          id="cta-title"
          className="m-0 text-[10vw] leading-[0.92] font-bold tracking-[-0.03em] uppercase sm:text-[clamp(48px,6vw,108px)]"
        >
          <span className="flex items-center gap-[.18em]">Start with</span>
          <span className="flex flex-wrap items-center gap-[.18em] gap-y-[.15em] sm:flex-nowrap">
            <label className="sr-only" htmlFor="pkg">
              Package
            </label>
            <select
              id="pkg"
              value={pkg}
              onChange={e => setPkg(e.target.value)}
              className={`${control} w-full max-w-none min-w-0 flex-[1_1_100%] appearance-none bg-home-raised text-home-ink transition-colors hover:bg-[#303030] sm:w-auto sm:max-w-[9.5em] sm:flex-none`}
            >
              {PACKAGES.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={`${control} bg-primary text-white transition-[background-color,transform] hover:bg-brand-hover active:scale-[0.98]`}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </span>
        </h2>
        <p aria-live="polite" className="mt-8 mb-0 text-lg">
          {copied ? 'Copied ' : 'Copies '}
          <code>{command}</code>
          {copied ? '. ' : ' to your clipboard. '}
          The{' '}
          <a href="/docs/getting-started/installation">
            installation guide
          </a>{' '}
          takes it from there.
        </p>
      </form>
    </section>
  )
}
