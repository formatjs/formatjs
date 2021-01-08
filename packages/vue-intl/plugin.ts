import {createIntl, IntlConfig} from '@formatjs/intl';
import Vue from 'vue';

export const plugin: Vue.Plugin = {
  install: (app, options: IntlConfig) => {
    if (!options) {
      throw new Error('Missing `options` for vue-intl plugin');
    }
    const intl = createIntl(options);

    app.config.globalProperties.$intl = intl;
    app.config.globalProperties.$formatMessage = intl.formatMessage;
    app.config.globalProperties.$formatDate = intl.formatDate;
    app.config.globalProperties.$formatTime = intl.formatTime;
    app.config.globalProperties.$formatDateTimeRange = intl.formatDateTimeRange;
    app.config.globalProperties.$formatRelativeTime = intl.formatRelativeTime;
    app.config.globalProperties.$formatDisplayName = intl.formatDisplayName;
    app.config.globalProperties.$formatNumber = intl.formatNumber;

    app.provide('intl', intl);
  },
};
