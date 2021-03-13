/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react'
import {
  invariant,
  RelativeTimeFormatSingularUnit,
} from '@formatjs/ecma402-abstract'
import {FormatRelativeTimeOptions} from '@formatjs/intl'
import useIntl from './useIntl'

const MINUTE = 60
const HOUR = 60 * 60
const DAY = 60 * 60 * 24

function selectUnit(seconds: number): RelativeTimeFormatSingularUnit {
  const absValue = Math.abs(seconds)

  if (absValue < MINUTE) {
    return 'second'
  }

  if (absValue < HOUR) {
    return 'minute'
  }

  if (absValue < DAY) {
    return 'hour'
  }

  return 'day'
}

function getDurationInSeconds(unit?: RelativeTimeFormatSingularUnit): number {
  switch (unit) {
    case 'second':
      return 1
    case 'minute':
      return MINUTE
    case 'hour':
      return HOUR
    default:
      return DAY
  }
}

function valueToSeconds(
  value?: number,
  unit?: RelativeTimeFormatSingularUnit
): number {
  if (!value) {
    return 0
  }
  switch (unit) {
    case 'second':
      return value
    case 'minute':
      return value * MINUTE
    default:
      return value * HOUR
  }
}

export interface Props extends FormatRelativeTimeOptions {
  value?: number
  unit?: RelativeTimeFormatSingularUnit
  updateIntervalInSeconds?: number
  children?(value: string): React.ReactElement | null
}

const INCREMENTABLE_UNITS: RelativeTimeFormatSingularUnit[] = [
  'second',
  'minute',
  'hour',
]
function canIncrement(
  unit: RelativeTimeFormatSingularUnit = 'second'
): boolean {
  return INCREMENTABLE_UNITS.includes(unit)
}

const SimpleFormattedRelativeTime: React.FC<
  Omit<Props, 'updateIntervalInSeconds'>
> = props => {
  const {formatRelativeTime, textComponent: Text} = useIntl()
  const {children, value, unit, ...otherProps} = props

  const formattedRelativeTime = formatRelativeTime(value || 0, unit, otherProps)

  if (typeof children === 'function') {
    return children(formattedRelativeTime)
  }
  if (Text) {
    return <Text>{formattedRelativeTime}</Text>
  }
  return <>{formattedRelativeTime}</>
}

function scheduleNextUpdate(
  updateTimer: number | undefined,
  updateIntervalInSeconds: number | undefined,
  unit: RelativeTimeFormatSingularUnit | undefined,
  currentValueInSeconds: number,
  setUpdateTimer: (updateTimer: number) => void,
  setCurrentValueInSeconds: (value: number) => void
) {
  function clearUpdateTimer() {
    clearTimeout(updateTimer)
  }
  clearTimeout(updateTimer)

  // If there's no interval and we cannot increment this unit, do nothing
  if (!updateIntervalInSeconds || !canIncrement(unit)) {
    return clearUpdateTimer
  }
  // Figure out the next interesting time
  const nextValueInSeconds = currentValueInSeconds - updateIntervalInSeconds
  const nextUnit = selectUnit(nextValueInSeconds)
  // We've reached the max auto incrementable unit, don't schedule another update
  if (nextUnit === 'day') {
    return clearUpdateTimer
  }

  const unitDuration = getDurationInSeconds(nextUnit)
  const remainder = nextValueInSeconds % unitDuration
  const prevInterestingValueInSeconds = nextValueInSeconds - remainder
  const nextInterestingValueInSeconds =
    prevInterestingValueInSeconds >= currentValueInSeconds
      ? prevInterestingValueInSeconds - unitDuration
      : prevInterestingValueInSeconds
  const delayInSeconds = Math.abs(
    nextInterestingValueInSeconds - currentValueInSeconds
  )

  setUpdateTimer(
    (setTimeout(
      () => setCurrentValueInSeconds(nextInterestingValueInSeconds),
      delayInSeconds * 1e3
    ) as unknown) as number
  )
  return clearUpdateTimer
}

const FormattedRelativeTime: React.FC<Props> = ({
  value,
  unit,
  updateIntervalInSeconds,
  ...otherProps
}) => {
  invariant(
    !updateIntervalInSeconds ||
      !!(updateIntervalInSeconds && canIncrement(unit)),
    'Cannot schedule update with unit longer than hour'
  )
  const [prevUnit, setPrevUnit] = React.useState<
    RelativeTimeFormatSingularUnit | undefined
  >()
  const [prevValue, setPrevValue] = React.useState<number>(0)
  const [
    currentValueInSeconds,
    setCurrentValueInSeconds,
  ] = React.useState<number>(0)
  const [updateTimer, setUpdateTimer] = React.useState<number | undefined>()

  if (unit !== prevUnit || value !== prevValue) {
    setPrevValue(value || 0)
    setPrevUnit(unit)
    setCurrentValueInSeconds(
      canIncrement(unit) ? valueToSeconds(value, unit) : 0
    )
  }

  React.useEffect(
    () =>
      scheduleNextUpdate(
        updateTimer,
        updateIntervalInSeconds,
        unit,
        currentValueInSeconds,
        setUpdateTimer,
        setCurrentValueInSeconds
      ),
    [currentValueInSeconds, updateIntervalInSeconds, unit]
  )

  let currentValue = value || 0
  let currentUnit = unit

  if (
    canIncrement(unit) &&
    typeof currentValueInSeconds === 'number' &&
    updateIntervalInSeconds
  ) {
    currentUnit = selectUnit(currentValueInSeconds)
    const unitDuration = getDurationInSeconds(currentUnit)
    currentValue = Math.round(currentValueInSeconds / unitDuration)
  }
  return (
    <SimpleFormattedRelativeTime
      value={currentValue}
      unit={currentUnit}
      {...otherProps}
    />
  )
}

FormattedRelativeTime.displayName = 'FormattedRelativeTime'
FormattedRelativeTime.defaultProps = {
  value: 0,
  unit: 'second',
}

export default FormattedRelativeTime
