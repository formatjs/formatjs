import * as defaultFormatter from './default'
import {FormatFn, CompileFn} from './default'
import * as transifex from './transifex'
import * as smartling from './smartling'
import * as simple from './simple'
import * as lokalise from './lokalise'
import * as crowdin from './crowdin'
import {Comparator} from 'json-stable-stringify'
import {resolve} from 'path'
import {pathToFileURL} from 'url'

export interface Formatter {
  format: FormatFn
  compile: CompileFn
  compareMessages?: Comparator
}

export async function resolveBuiltinFormatter(
  format?: string | Formatter
): Promise<any> {
  if (!format) {
    return defaultFormatter
  }
  if (typeof format !== 'string') {
    return format
  }
  switch (format) {
    case 'transifex':
      return transifex
    case 'smartling':
      return smartling
    case 'simple':
      return simple
    case 'lokalise':
      return lokalise
    case 'crowdin':
      return crowdin
  }
  try {
    // eslint-disable-next-line import/dynamic-import-chunkname
    return import(pathToFileURL(resolve(process.cwd(), format)).href)
  } catch (e) {
    console.error(`Cannot resolve formatter ${format}`)
    throw e
  }
}
