import {
  type RoundingModeType,
  type UnsignedRoundingModeType,
} from '#packages/ecma402-abstract/types/number.js'

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

export function GetUnsignedRoundingMode(
  roundingMode: RoundingModeType,
  isNegative: boolean
): UnsignedRoundingModeType {
  if (isNegative) {
    return negativeMapping[roundingMode]
  }
  return positiveMapping[roundingMode]
}
