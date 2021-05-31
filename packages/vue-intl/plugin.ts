import {createIntl as _createIntl, IntlConfig} from '@formatjs/intl'
import Vue from 'vue'
import {intlKey} from './injection-key'

export const createIntl = (options: IntlConfig): Vue.Plugin => ({
  install(app) {
    if (!options) {
      throw new Error('Missing `options` for vue-intl plugin')
    }
    const intl = _createIntl(options)

    app.config.globalProperties.$intl = intl
    app.config.globalProperties.$formatMessage = intl.formatMessage
    app.config.globalProperties.$formatDate = intl.formatDate
    app.config.globalProperties.$formatTime = intl.formatTime
    app.config.globalProperties.$formatDateTimeRange = intl.formatDateTimeRange
    app.config.globalProperties.$formatRelativeTime = intl.formatRelativeTime
    app.config.globalProperties.$formatDisplayName = intl.formatDisplayName
    app.config.globalProperties.$formatNumber = intl.formatNumber

    app.provide(intlKey, intl)
  },
})
