export function shouldPolyfill() {
  return (
    !('PluralRules' in Intl) ||
    new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1) ===
      'one'
  )
}
