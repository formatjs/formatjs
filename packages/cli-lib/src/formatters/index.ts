import type {Comparator} from 'json-stable-stringify'
import {resolve} from 'path'
import {pathToFileURL} from 'url'
import * as crowdin from './crowdin.js'
import * as defaultFormatter from './default.js'
import {type CompileFn, type FormatFn, type SerializeFn} from './default.js'
import * as lokalise from './lokalise.js'
import * as simple from './simple.js'
import * as smartling from './smartling.js'
import * as transifex from './transifex.js'

export interface Formatter<T> {
  serialize?: SerializeFn<T>
  format: FormatFn<T>
  compile: CompileFn<T>
  compareMessages?: Comparator
}

export async function resolveBuiltinFormatter(
  format?: string | Formatter<unknown>
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
