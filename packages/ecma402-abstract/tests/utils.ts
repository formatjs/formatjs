import {NumberFormatInternal} from '../types/number'

const internalSlotMap = new WeakMap<Intl.NumberFormat, NumberFormatInternal>()

export function getInternalSlots(x: Intl.NumberFormat): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as NumberFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return {
    ...internalSlots,
    ...x.resolvedOptions(),
    numberingSystem: 'latn',
    // @ts-ignore
    dataLocaleData: {
      numbers: {
        nu: ['latn'],
        symbols: {
          latn: {
            decimal: ',',
            group: '.',
            list: ';',
            percentSign: '%',
            plusSign: '+',
            minusSign: '-',
            approximatelySign: '~',
            exponential: 'E',
            superscriptingExponent: '×',
            perMille: '‰',
            infinity: '∞',
            nan: 'NaN',
            timeSeparator: ':',
            rangeSign: '-',
          },
        },
        percent: {
          latn: '#,##0%',
        },
        decimal: {
          latn: {
            standard: '#,##0.###',
            long: {
              '1000': {
                other: '0 mila',
                one: 'mille',
              },
              '10000': {
                other: '00 mila',
              },
              '100000': {
                other: '000 mila',
              },
              '1000000': {
                other: '0 milioni',
                one: '0 milione',
              },
              '10000000': {
                other: '00 milioni',
              },
              '100000000': {
                other: '000 milioni',
              },
              '1000000000': {
                other: '0 miliardi',
                one: '0 miliardo',
              },
              '10000000000': {
                other: '00 miliardi',
              },
              '100000000000': {
                other: '000 miliardi',
              },
              '1000000000000': {
                other: '0 mila miliardi',
                one: '0 mille miliardi',
              },
              '10000000000000': {
                other: '00 mila miliardi',
              },
              '100000000000000': {
                other: '000 mila miliardi',
              },
            },
            short: {
              '1000': {
                other: '0',
              },
              '10000': {
                other: '0',
              },
              '100000': {
                other: '0',
              },
              '1000000': {
                other: '0 Mln',
              },
              '10000000': {
                other: '00 Mln',
              },
              '100000000': {
                other: '000 Mln',
              },
              '1000000000': {
                other: '0 Mrd',
              },
              '10000000000': {
                other: '00 Mrd',
              },
              '100000000000': {
                other: '000 Mrd',
              },
              '1000000000000': {
                other: '0 Bln',
              },
              '10000000000000': {
                other: '00 Bln',
              },
              '100000000000000': {
                other: '000 Bln',
              },
            },
          },
        },
        currency: {
          latn: {
            currencySpacing: {
              beforeInsertBetween: ' ',
              afterInsertBetween: ' ',
            },
            standard: '#,##0.00 ¤',
            accounting: '#,##0.00 ¤',
            unitPattern: '{0} {1}',
            short: {
              '1000': {
                other: '0',
              },
              '10000': {
                other: '0',
              },
              '100000': {
                other: '0',
              },
              '1000000': {
                other: '0 Mio ¤',
              },
              '10000000': {
                other: '00 Mio ¤',
              },
              '100000000': {
                other: '000 Mio ¤',
              },
              '1000000000': {
                other: '0 Mrd ¤',
              },
              '10000000000': {
                other: '00 Mrd ¤',
              },
              '100000000000': {
                other: '000 Mrd ¤',
              },
              '1000000000000': {
                other: '0 Bln ¤',
              },
              '10000000000000': {
                other: '00 Bln ¤',
              },
              '100000000000000': {
                other: '000 Bln ¤',
              },
            },
          },
        },
      },
      nu: ['latn'],
    },
  }
}
