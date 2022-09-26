import {FormatApproximately} from '../NumberFormat/FormatApproximately'
import {NumberFormatInternal, NumberFormatPart} from '../types/number'

const internalSlotMap = new WeakMap<Intl.NumberFormat, NumberFormatInternal>()

function getInternalSlots(x: Intl.NumberFormat): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as NumberFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return {
    ...internalSlots,
    numberingSystem: 'latn',
    dataLocaleData: {
      numbers: {
        symbols: {
          // @ts-ignore
          latn: {
            approximatelySign: '~',
          },
        },
      },
    },
  }
}

describe('FormatApproximately', () => {
  const numberFormat: Intl.NumberFormat = new Intl.NumberFormat('it')

  it('append approximatelySign', () => {
    const result: NumberFormatPart[] = []
    FormatApproximately(numberFormat, result, {getInternalSlots})

    expect(result).toMatchObject([{type: 'approximatelySign', value: '~'}])
  })
})
