import * as ReactIntl from '../../src'

describe('react-intl', () => {
  describe('exports', () => {
    it('exports `defineMessages`', () => {
      expect(ReactIntl.defineMessages).toBeA('function')
    })

    it('exports `defineMessage`', () => {
      expect(ReactIntl.defineMessage).toBeA('function')
    })

    it('exports `injectIntl`', () => {
      expect(ReactIntl.injectIntl).toBeA('function')
    })

    it('exports `useIntl`', () => {
      expect(ReactIntl.useIntl).toBeA('function')
    })

    describe('React Components', () => {
      it('exports `IntlProvider`', () => {
        expect(ReactIntl.IntlProvider).toBeA('function')
      })

      it('exports `FormattedDate`', () => {
        expect(ReactIntl.FormattedDate).toBeA('function')
      })

      it('exports `FormattedTime`', () => {
        expect(ReactIntl.FormattedTime).toBeA('function')
      })

      it('exports `FormattedNumber`', () => {
        expect(ReactIntl.FormattedNumber).toBeA('function')
      })

      it('exports `FormattedDateParts`', () => {
        expect(ReactIntl.FormattedDateParts).toBeA('function')
      })

      it('exports `FormattedTimeParts`', () => {
        expect(ReactIntl.FormattedTimeParts).toBeA('function')
      })

      it('exports `FormattedNumberParts`', () => {
        expect(ReactIntl.FormattedNumberParts).toBeA('function')
      })

      it('exports `FormattedRelativeTime`', () => {
        expect(ReactIntl.FormattedRelativeTime).toBeA('function')
      })

      it('exports `FormattedPlural`', () => {
        expect(ReactIntl.FormattedPlural).toBeA('function')
      })

      it('exports `FormattedMessage`', () => {
        expect(ReactIntl.FormattedMessage).toBeA('function')
      })

      it('exports `FormattedDisplayNames`', () => {
        expect(ReactIntl.FormattedDisplayName).toBeA('function')
      })
    })
  })
})
