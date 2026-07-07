import {
  createIntl as _createIntl,
  type IntlConfig,
  type IntlFormatters,
  type IntlShape,
  type MessageDescriptor,
} from '@formatjs/intl'
import type {Plugin} from 'vue'
import {intlKey} from '#packages/vue-intl/injection-key.js'

export type Translate = (
  id: NonNullable<MessageDescriptor['id']>,
  values?: Parameters<IntlFormatters['formatMessage']>[1],
  opts?: Parameters<IntlFormatters['formatMessage']>[2]
) => ReturnType<IntlFormatters['formatMessage']>

declare module 'vue' {
  interface ComponentCustomProperties {
    $intl: IntlShape
    $t: Translate
    $formatMessage: IntlFormatters['formatMessage']
    $formatDate: IntlFormatters['formatDate']
    $formatTime: IntlFormatters['formatTime']
    $formatDateTimeRange: IntlFormatters['formatDateTimeRange']
    $formatRelativeTime: IntlFormatters['formatRelativeTime']
    $formatDisplayName: IntlFormatters['formatDisplayName']
    $formatNumber: IntlFormatters['formatNumber']
    $formatList: IntlFormatters['formatList']
  }
}

export const createIntl = (options: IntlConfig): Plugin => ({
  install(app) {
    if (!options) {
      throw new Error('Missing `options` for vue-intl plugin')
    }
    const intl = _createIntl(options)

    app.config.globalProperties.$intl = intl
    app.config.globalProperties.$t = (id, values, opts) =>
      intl.formatMessage({id}, values as never, opts)
    app.config.globalProperties.$formatMessage = intl.formatMessage
    app.config.globalProperties.$formatDate = intl.formatDate
    app.config.globalProperties.$formatTime = intl.formatTime
    app.config.globalProperties.$formatDateTimeRange = intl.formatDateTimeRange
    app.config.globalProperties.$formatRelativeTime = intl.formatRelativeTime
    app.config.globalProperties.$formatDisplayName = intl.formatDisplayName
    app.config.globalProperties.$formatNumber = intl.formatNumber
    app.config.globalProperties.$formatList = intl.formatList

    app.provide(intlKey, intl)
  },
})
