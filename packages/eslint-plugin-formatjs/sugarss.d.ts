declare module 'sugarss' {
  import type {Parser, ProcessOptions, Root} from 'postcss'

  export function parse(css: string, opts?: ProcessOptions): Root

  const sugarss: Parser<Root>
  export default sugarss
}
