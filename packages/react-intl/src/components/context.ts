import * as React from 'react'
import {type IntlShape} from '../types.js'

const IntlContext: React.Context<IntlShape> = React.createContext<IntlShape>(
  null as any
)
const Provider: React.Provider<IntlShape> = IntlContext.Provider

export {Provider, IntlContext as Context}
