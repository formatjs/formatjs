/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './injectIntl';
import {IntlShape, FormatRelativeTimeOptions} from '../types';
import {FormattableUnit, Unit} from '@formatjs/intl-relativetimeformat';
import * as invariant from 'invariant';

const MINUTE = 60;
const HOUR = 60 * 60;
const DAY = 60 * 60 * 24;

function selectUnit(seconds: number): Unit {
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

  return 'day'
}

function getDurationInSeconds(unit?: Unit): number {
  switch (unit) {
    case 'second':
      return 1;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    default:
      throw new Error('Unsupported for unit longer than hour')
  }
}

function valueToSeconds(value?: number, unit: FormattableUnit = 'second'): number {
  if (!value) {
    return 0;
  }
  if (!unit) {
    return value;
  }
  switch (unit) {
    case 'second':
    case 'seconds':
      return value
    case 'minute':
    case 'minutes':
      return value * MINUTE;
    case 'hour':
    case 'hours':
      return value * HOUR;
  }
  throw new RangeError('cannot convert to unit longer than day')
}

export interface Props extends FormatRelativeTimeOptions {
  intl: IntlShape;
  value?: number;
  unit?: Unit;
  updateIntervalInSeconds?: number;
  children?(value: string): React.ReactChild;
}

interface State {
  deltaInSeconds: number
}

const INCREMENTABLE_UNITS: Unit[] = [
  'second',
  'minute',
  'hour'
]

function verifyProps(updateIntervalInSeconds?: number, unit?: Unit) {
  invariant(!updateIntervalInSeconds ||
    (updateIntervalInSeconds &&
      INCREMENTABLE_UNITS.includes(unit || 'second')),
    'Cannot schedule update with unit longer than hour'
  );
}

class FormattedRelativeTime extends React.PureComponent<Props, State> {
  private _updateInterval?: number;
  static defaultProps: Pick<Props, 'unit' | 'value'> = {
    value: 0,
    unit: 'second'
  }
  state: State = {
    deltaInSeconds: 0
  }

  constructor(props: Props) {
    super(props);
    verifyProps(props.updateIntervalInSeconds, props.unit)
  }

  update = () => {
    const {updateIntervalInSeconds} = this.props
    const {deltaInSeconds} = this.state
    if (!updateIntervalInSeconds) {
      return
    }
    this.setState({
      deltaInSeconds: deltaInSeconds + updateIntervalInSeconds
    })
  }

  scheduleUpdate({updateIntervalInSeconds}: Props) {
    window.clearInterval(this._updateInterval)
    if (updateIntervalInSeconds) {
      this._updateInterval = window.setInterval(this.update, updateIntervalInSeconds * 1e3)
    }
  }

  componentDidMount() {
    this.scheduleUpdate(this.props);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.value !== this.props.value || prevProps.unit !== this.props.unit || prevProps.updateIntervalInSeconds !== this.props.updateIntervalInSeconds) {
      this.scheduleUpdate(this.props);
    }
  }

  componentWillUnmount() {
    clearInterval(this._updateInterval)
  }

  static getDerivedStateFromProps(props: Props): State | null {
    verifyProps(props.updateIntervalInSeconds, props.unit)
    if (props.updateIntervalInSeconds) {
      return {
        deltaInSeconds: 0
      }
    }
    return null
  }

  render() {
    const {formatRelativeTime, textComponent: Text} = this.props.intl;
    const {children, value, unit} = this.props;
    const {deltaInSeconds} = this.state
    
    let currentValue = value || 0
    let currentUnit = unit
    if (deltaInSeconds) {
      const currentValueInSeconds = valueToSeconds(value) - deltaInSeconds
      currentUnit = selectUnit(currentValueInSeconds)
      currentValue = Math.round(currentValueInSeconds/getDurationInSeconds(currentUnit))
    }
    
    let formattedRelativeTime = value
      ? formatRelativeTime(currentValue, currentUnit, {
          ...this.props,
          ...this.state,
        })
      : formatRelativeTime(0, currentUnit, {...this.props});

    if (typeof children === 'function') {
      return children(formattedRelativeTime);
    }

    return <Text>{formattedRelativeTime}</Text>;
  }
}

export const BaseFormattedRelativeTime = FormattedRelativeTime;

export default withIntl(FormattedRelativeTime);
