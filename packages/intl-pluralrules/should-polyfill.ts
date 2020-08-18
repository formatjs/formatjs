export function shouldPolyfill() {
  return (
    typeof Intl === 'undefined' ||
    !('PluralRules' in Intl) ||
    new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1) ===
      'one'
  );
}
