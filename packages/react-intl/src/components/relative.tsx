/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react';
import {
  invariant,
  RelativeTimeFormatSingularUnit,
} from '@formatjs/ecma402-abstract';
import {FormatRelativeTimeOptions} from '@formatjs/intl';
import useIntl from './useIntl';

const MINUTE = 60;
const HOUR = 60 * 60;
const DAY = 60 * 60 * 24;

function selectUnit(seconds: number): RelativeTimeFormatSingularUnit {
  const absValue = Math.abs(seconds);

  if (absValue < MINUTE) {
    return 'second';
  }

  if (absValue < HOUR) {
    return 'minute';
  }

  if (absValue < DAY) {
    return 'hour';
  }

  return 'day';
}

function getDurationInSeconds(unit?: RelativeTimeFormatSingularUnit): number {
  switch (unit) {
    case 'second':
      return 1;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    default:
      return DAY;
  }
}

function valueToSeconds(
  value?: number,
  unit?: RelativeTimeFormatSingularUnit
): number {
  if (!value) {
    return 0;
  }
  switch (unit) {
    case 'second':
      return value;
    case 'minute':
      return value * MINUTE;
    default:
      return value * HOUR;
  }
}

export interface Props extends FormatRelativeTimeOptions {
  value?: number;
  unit?: RelativeTimeFormatSingularUnit;
  updateIntervalInSeconds?: number;
  children?(value: string): React.ReactElement | null;
}

interface State {
  prevUnit?: RelativeTimeFormatSingularUnit;
  prevValue?: number;
  currentValueInSeconds: number;
}

const INCREMENTABLE_UNITS: RelativeTimeFormatSingularUnit[] = [
  'second',
  'minute',
  'hour',
];
function canIncrement(
  unit: RelativeTimeFormatSingularUnit = 'second'
): boolean {
  return INCREMENTABLE_UNITS.includes(unit);
}

const SimpleFormattedRelativeTime: React.FC<
  Omit<Props, 'updateIntervalInSeconds'>
> = props => {
  const {formatRelativeTime, textComponent: Text} = useIntl();
  const {children, value, unit, ...otherProps} = props;

  const formattedRelativeTime = formatRelativeTime(
    value || 0,
    unit,
    otherProps
  );

  if (typeof children === 'function') {
    return children(formattedRelativeTime);
  }
  if (Text) {
    return <Text>{formattedRelativeTime}</Text>;
  }
  return <>{formattedRelativeTime}</>;
};

export class FormattedRelativeTime extends React.PureComponent<Props, State> {
  // Public for testing
  _updateTimer: any = null;
  static displayName = 'FormattedRelativeTime';
  static defaultProps: Pick<Props, 'unit' | 'value'> = {
    value: 0,
    unit: 'second',
  };
  state: State = {
    prevUnit: this.props.unit,
    prevValue: this.props.value,
    currentValueInSeconds: canIncrement(this.props.unit)
      ? valueToSeconds(this.props.value, this.props.unit)
      : 0,
  };

  constructor(props: Props) {
    super(props);
    invariant(
      !props.updateIntervalInSeconds ||
        !!(props.updateIntervalInSeconds && canIncrement(props.unit)),
      'Cannot schedule update with unit longer than hour'
    );
  }

  scheduleNextUpdate(
    {updateIntervalInSeconds, unit}: Props,
    {currentValueInSeconds}: State
  ): void {
    clearTimeout(this._updateTimer);
    this._updateTimer = null;
    // If there's no interval and we cannot increment this unit, do nothing
    if (!updateIntervalInSeconds || !canIncrement(unit)) {
      return;
    }
    // Figure out the next interesting time
    const nextValueInSeconds = currentValueInSeconds - updateIntervalInSeconds;
    const nextUnit = selectUnit(nextValueInSeconds);
    // We've reached the max auto incrementable unit, don't schedule another update
    if (nextUnit === 'day') {
      return;
    }

    const unitDuration = getDurationInSeconds(nextUnit);
    const remainder = nextValueInSeconds % unitDuration;
    const prevInterestingValueInSeconds = nextValueInSeconds - remainder;
    const nextInterestingValueInSeconds =
      prevInterestingValueInSeconds >= currentValueInSeconds
        ? prevInterestingValueInSeconds - unitDuration
        : prevInterestingValueInSeconds;
    const delayInSeconds = Math.abs(
      nextInterestingValueInSeconds - currentValueInSeconds
    );

    this._updateTimer = setTimeout(
      () =>
        this.setState({
          currentValueInSeconds: nextInterestingValueInSeconds,
        }),
      delayInSeconds * 1e3
    );
  }

  componentDidMount(): void {
    this.scheduleNextUpdate(this.props, this.state);
  }

  componentDidUpdate(): void {
    this.scheduleNextUpdate(this.props, this.state);
  }

  componentWillUnmount(): void {
    clearTimeout(this._updateTimer);
    this._updateTimer = null;
  }

  static getDerivedStateFromProps(
    props: Props,
    state: State
  ): Partial<State> | null {
    if (props.unit !== state.prevUnit || props.value !== state.prevValue) {
      return {
        prevValue: props.value,
        prevUnit: props.unit,
        currentValueInSeconds: canIncrement(props.unit)
          ? valueToSeconds(props.value, props.unit)
          : 0,
      };
    }
    return null;
  }

  render() {
    const {value, unit, updateIntervalInSeconds, ...otherProps} = this.props;
    const {currentValueInSeconds} = this.state;
    let currentValue = value || 0;
    let currentUnit = unit;

    if (
      canIncrement(unit) &&
      typeof currentValueInSeconds === 'number' &&
      updateIntervalInSeconds
    ) {
      currentUnit = selectUnit(currentValueInSeconds);
      const unitDuration = getDurationInSeconds(currentUnit);
      currentValue = Math.round(currentValueInSeconds / unitDuration);
    }
    return (
      <SimpleFormattedRelativeTime
        value={currentValue}
        unit={currentUnit}
        {...otherProps}
      />
    );
  }
}

export default FormattedRelativeTime;
