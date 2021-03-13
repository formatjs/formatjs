import IntlListFormat from '@formatjs/intl-listformat'

declare global {
  namespace Intl {
    const ListFormat: typeof IntlListFormat
  }
}
