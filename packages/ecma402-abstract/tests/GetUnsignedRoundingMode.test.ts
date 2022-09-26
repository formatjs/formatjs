import {GetUnsignedRoundingMode} from '../NumberFormat/GetUnsignedRoundingMode'
import {RoundingModeType, UnsignedRoundingMode} from '../types/number'

describe('GetUnsignedRoundingMod', () => {
  const negativeMapping: Record<RoundingModeType, UnsignedRoundingMode> = {
    ceil: 'zero',
    floor: 'infinity',
    expand: 'infinity',
    trunc: 'zero',
    halfCeil: 'half-zero',
    halfFloor: 'half-infinity',
    halfExpand: 'half-infinity',
    halfTrunc: 'half-zero',
    halfEven: 'half-even',
  }

  const positiveMapping: Record<RoundingModeType, UnsignedRoundingMode> = {
    ceil: 'infinity',
    floor: 'zero',
    expand: 'infinity',
    trunc: 'zero',
    halfCeil: 'half-infinity',
    halfFloor: 'half-zero',
    halfExpand: 'half-infinity',
    halfTrunc: 'half-zero',
    halfEven: 'half-even',
  }

  it('positive', () => {
    Object.entries(positiveMapping).forEach(
      ([roundingMode, unsignedRoundingMode]) => {
        const foundUnsingedRoundingMode = GetUnsignedRoundingMode(
          roundingMode as RoundingModeType,
          false
        )
        expect(foundUnsingedRoundingMode).toEqual(unsignedRoundingMode)
      }
    )
  })

  it('negative', () => {
    Object.entries(negativeMapping).forEach(
      ([roundingMode, unsignedRoundingMode]) => {
        const foundUnsingedRoundingMode = GetUnsignedRoundingMode(
          roundingMode as RoundingModeType,
          true
        )
        expect(foundUnsingedRoundingMode).toEqual(unsignedRoundingMode)
      }
    )
  })
})
