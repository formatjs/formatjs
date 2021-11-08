import * as ReactIntl from '../../'
import * as ts from 'typescript'
import fs from 'fs'
import lexer from 'cjs-module-lexer'
import path from 'path'

describe('react-intl', () => {
  describe('exports', () => {
    it('exports `defineMessages`', () => {
      expect(typeof ReactIntl.defineMessages).toBe('function')
    })

    it('exports `defineMessage`', () => {
      expect(typeof ReactIntl.defineMessage).toBe('function')
    })

    it('exports `injectIntl`', () => {
      expect(typeof ReactIntl.injectIntl).toBe('function')
    })

    it('exports `useIntl`', () => {
      expect(typeof ReactIntl.useIntl).toBe('function')
    })

    describe('React Components', () => {
      it('exports `IntlProvider`', () => {
        expect(typeof ReactIntl.IntlProvider).toBe('function')
      })

      it('exports `FormattedDate`', () => {
        expect(typeof ReactIntl.FormattedDate).toBe('function')
      })

      it('exports `FormattedTime`', () => {
        expect(typeof ReactIntl.FormattedTime).toBe('function')
      })

      it('exports `FormattedNumber`', () => {
        expect(typeof ReactIntl.FormattedNumber).toBe('function')
      })

      it('exports `FormattedDateParts`', () => {
        expect(typeof ReactIntl.FormattedDateParts).toBe('function')
      })

      it('exports `FormattedTimeParts`', () => {
        expect(typeof ReactIntl.FormattedTimeParts).toBe('function')
      })

      it('exports `FormattedNumberParts`', () => {
        expect(typeof ReactIntl.FormattedNumberParts).toBe('function')
      })

      it('exports `FormattedRelativeTime`', () => {
        expect(typeof ReactIntl.FormattedRelativeTime).toBe('function')
      })

      it('exports `FormattedPlural`', () => {
        expect(typeof ReactIntl.FormattedPlural).toBe('function')
      })

      it('exports `FormattedMessage`', () => {
        expect(typeof ReactIntl.FormattedMessage).toBe('object')
      })

      it('exports `FormattedDisplayNames`', () => {
        expect(typeof ReactIntl.FormattedDisplayName).toBe('function')
      })
    })
  })
  describe('static analysis of named exports ', () => {
    // Parse dist file for statically analyzable named exports
    const filePath = path.resolve(__dirname, '..', '..', 'index.ts')
    const source = fs.readFileSync(filePath, 'utf8')
    const {outputText} = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
      },
    })
    const parsed = lexer.parse(outputText)
    const keys = Object.keys(ReactIntl)

    it.each(keys)('has named export "%s"', key => {
      expect(parsed.exports).toContain(key)
    })
  })
})
