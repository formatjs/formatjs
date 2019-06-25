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

// The maximum timer delay value is a 32-bit signed integer.
// See: https://mdn.io/setTimeout
const MAX_TIMER_DELAY = 2147483647;

function selectUnit(delta: number): Unit | undefined {
  let absDelta = Math.abs(delta);

  if (absDelta < MINUTE) {
    return 'second';
  }

  if (absDelta < HOUR) {
    return 'minute';
  }

  if (absDelta < DAY) {
    return 'hour';
  }

  return undefined
}

function getUnitDelay(units: FormattableUnit): number {
  switch (units) {
    case 'second':
      return 1;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    default:
      return MAX_TIMER_DELAY;
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
  unit: FormattableUnit;
  updateIntervalInSeconds?: number;
  children?(value: string): React.ReactChild;
}

interface State {
  deltaInSeconds: number
}

class FormattedRelativeTime extends React.PureComponent<Props, State> {
  private _timer?: number;

  constructor(props: Props) {
    super(props);
    invariant(
      props.updateIntervalInSeconds &&
        !['day', 'week', 'month', 'quarter', 'year'].includes(props.unit),
      'Cannot schedule update with unit longer than hour'
    );
  }

  scheduleNextUpdate(props: Props, state: State) {
    // Cancel and pending update because we're scheduling a new update.
    window.clearTimeout(this._timer);

    const {unit, updateIntervalInSeconds} = props;
    const {deltaInSeconds} = state
    // If the `updateInterval` is falsy, including `0` or we don't have a
    // valid date, then auto updates have been turned off, so we bail and
    // skip scheduling an update.
    if (!updateIntervalInSeconds || !deltaInSeconds) {
      return;
    }

    const newDelta = deltaInSeconds + updateIntervalInSeconds

    const unitDelay = getUnitDelay(unit);
    const unitRemainder = Math.abs(newDelta % unitDelay);

    // We want the largest possible timer delay which will still display
    // accurate information while reducing unnecessary re-renders. The delay
    // should be until the next "interesting" moment, like a tick from
    // "1 minute ago" to "2 minutes ago" when the delta is 120s.
    const delay =
      newDelta < 0
        ? Math.max(updateIntervalInSeconds, unitDelay - unitRemainder)
        : Math.max(updateIntervalInSeconds, unitRemainder);

    this._timer = window.setTimeout(() => {
      this.setState({deltaInSeconds: newDelta});
    }, delay * 1e3);
  }

  componentDidMount() {
    this.scheduleNextUpdate(this.props, this.state);
  }

  componentDidUpdate() {
    this.scheduleNextUpdate(this.props, this.state);
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  componentWillReceiveProps({updateIntervalInSeconds, unit, value}: Props) {
    invariant(
      updateIntervalInSeconds &&
        !['day', 'week', 'month', 'quarter', 'year'].includes(unit),
      'Cannot schedule update with unit longer than hour'
    );
    // Reset if value or unit changes
    if (value !== this.props.value || unit !== this.props.unit) {
      this.setState({
        deltaInSeconds: 0
      })
    }
  }

  render() {
    const {formatRelativeTime, textComponent: Text} = this.props.intl;
    const {value, unit, children} = this.props;
    const {deltaInSeconds} = this.state

    const valueInSeconds = valueToSeconds(value)
    const currentValue = valueInSeconds - deltaInSeconds
    const currentUnit = selectUnit(currentValue) || unit

    let formattedRelativeTime = value
      ? formatRelativeTime(currentValue, currentUnit, {
          ...this.props,
          ...this.state,
        })
      : formatRelativeTime(0, undefined, {...this.props});

    if (typeof children === 'function') {
      return children(formattedRelativeTime);
    }

    return <Text>{formattedRelativeTime}</Text>;
  }
}

export const BaseFormattedRelativeTime = FormattedRelativeTime;

export default withIntl(FormattedRelativeTime);
