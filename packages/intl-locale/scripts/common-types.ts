import type {ParsedArgs} from 'minimist'

export interface Args extends ParsedArgs {
  zone: string[]
}
