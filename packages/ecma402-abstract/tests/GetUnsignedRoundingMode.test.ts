import {GetUnsignedRoundingMode} from '../NumberFormat/GetUnsignedRoundingMode'
import {RoundingModeType, UnsignedRoundingModeType} from '../types/number'

describe('GetUnsignedRoundingMod', () => {
  const negativeMapping: Record<RoundingModeType, UnsignedRoundingModeType> = {
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

  const positiveMapping: Record<RoundingModeType, UnsignedRoundingModeType> = {
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
    Object.keys(positiveMapping).forEach(key => {
      const roundingMode = key as RoundingModeType
      const foundUnsingedRoundingMode = GetUnsignedRoundingMode(
        roundingMode,
        false
      )
      expect(foundUnsingedRoundingMode).toEqual(positiveMapping[roundingMode])
    })
  })

  it('negative', () => {
    Object.keys(negativeMapping).forEach(key => {
      const roundingMode = key as RoundingModeType
      const foundUnsingedRoundingMode = GetUnsignedRoundingMode(
        roundingMode,
        true
      )
      expect(foundUnsingedRoundingMode).toEqual(negativeMapping[roundingMode])
    })
  })
})
