import {RoundingModeType, UnsignedRoundingMode} from '../types/number'

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

export function GetUnsignedRoundingMode(
  roundingMode: RoundingModeType,
  isNegative: boolean
): UnsignedRoundingMode {
  if (isNegative) {
    return negativeMapping[roundingMode]
  }
  return positiveMapping[roundingMode]
}
