import {LocaleData} from './core'

export interface DurationLocaleData {
  digitalFormat: {
    separator: string
  }
  nu: string[]
}

export type DurationPatternLocaleData = LocaleData<DurationLocaleData>
