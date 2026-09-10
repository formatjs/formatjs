import * as stylex from '@stylexjs/stylex'

export const tokens: stylex.VarGroup<{
  canvas: string
  surface: string
  subtle: string
  text: string
  muted: string
  line: string
  accent: string
  accentHover: string
  accentSoft: string
  danger: string
  dangerSoft: string
  radius: string
  font: string
  mono: string
}> = stylex.defineVars({
  canvas: '#f5f6f3',
  surface: '#ffffff',
  subtle: '#f8faf7',
  text: '#24352d',
  muted: '#64736b',
  line: '#dde4dc',
  accent: '#286447',
  accentHover: '#1c4d35',
  accentSoft: '#eaf3ec',
  danger: '#a52c32',
  dangerSoft: '#fff1f0',
  radius: '12px',
  font: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Consolas, monospace',
})
