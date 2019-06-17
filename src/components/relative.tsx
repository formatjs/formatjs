/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
import withIntl from './withIntl';
import {IntlShape, FormatRelativeOptions} from '../types';
import {SUPPORTED_FIELD} from 'intl-relativeformat/lib/types';

const SECOND = 1000;
const MINUTE = 1000 * 60;
const HOUR = 1000 * 60 * 60;
const DAY = 1000 * 60 * 60 * 24;

// The maximum timer delay value is a 32-bit signed integer.
// See: https://mdn.io/setTimeout
const MAX_TIMER_DELAY = 2147483647;

function selectUnits(delta: number): SUPPORTED_FIELD {
  let absDelta = Math.abs(delta);

  if (absDelta < MINUTE) {
    return 'second' as SUPPORTED_FIELD;
  }

  if (absDelta < HOUR) {
    return 'minute' as SUPPORTED_FIELD;
  }

  if (absDelta < DAY) {
    return 'hour' as SUPPORTED_FIELD;
  }

  // The maximum scheduled delay will be measured in days since the maximum
  // timer delay is less than the number of milliseconds in 25 days.
  return 'day' as SUPPORTED_FIELD;
}

function getUnitDelay(units: SUPPORTED_FIELD): number {
  switch (units) {
    case 'second':
      return SECOND;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    case 'day':
      return DAY;
    default:
      return MAX_TIMER_DELAY;
  }
}

function isSameDate(a: Date | number | string, b: Date | number | string) {
  if (a === b) {
    return true;
  }

  let aTime = new Date(a).getTime();
  let bTime = new Date(b).getTime();

  return isFinite(aTime) && isFinite(bTime) && aTime === bTime;
}

export interface Props extends FormatRelativeOptions {
  intl: IntlShape;
  value: number;
  updateInterval?: number;
  initialNow?: Date | number;
  children?(value: string): React.ReactChild;
}

interface State {
  now: number;
  prevValue: number;
}

class FormattedRelative extends React.PureComponent<Props, State> {
  private _timer?: number;
  static defaultProps: Partial<Props> = {
    updateInterval: 1000 * 10,
  };

  constructor(props: Props) {
    super(props);

    let now = isFinite(props.initialNow as number)
      ? Number(props.initialNow)
      : props.intl.now();

    // `now` is stored as state so that `render()` remains a function of
    // props + state, instead of accessing `Date.now()` inside `render()`.
    this.state = {now, prevValue: props.value};
  }

  scheduleNextUpdate(props: Props, state: State) {
    // Cancel and pending update because we're scheduling a new update.
    window.clearTimeout(this._timer);

    const {value, units, updateInterval} = props;
    const time = new Date(value).getTime();

    // If the `updateInterval` is falsy, including `0` or we don't have a
    // valid date, then auto updates have been turned off, so we bail and
    // skip scheduling an update.
    if (!updateInterval || !isFinite(time)) {
      return;
    }

    const delta = time - state.now;
    const unitDelay = getUnitDelay(units || selectUnits(delta));
    const unitRemainder = Math.abs(delta % unitDelay);

    // We want the largest possible timer delay which will still display
    // accurate information while reducing unnecessary re-renders. The delay
    // should be until the next "interesting" moment, like a tick from
    // "1 minute ago" to "2 minutes ago" when the delta is 120,000ms.
    const delay =
      delta < 0
        ? Math.max(updateInterval, unitDelay - unitRemainder)
        : Math.max(updateInterval, unitRemainder);

    this._timer = window.setTimeout(() => {
      this.setState({now: this.props.intl.now()});
    }, delay);
  }

  componentDidMount() {
    this.scheduleNextUpdate(this.props, this.state);
  }

  static getDerivedStateFromProps({value, intl}: Props, {prevValue}: State) {
    // When the `props.value` date changes, `state.now` needs to be updated,
    // and the next update can be rescheduled.
    if (!isSameDate(value, prevValue)) {
      return {now: intl.now(), prevValue: value};
    }
    return null;
  }

  componentDidUpdate() {
    this.scheduleNextUpdate(this.props, this.state);
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  render() {
    const {formatRelative, textComponent: Text} = this.props.intl;
    const {value, children} = this.props;

    let formattedRelative = formatRelative(value, {
      ...this.props,
      ...this.state,
    });

    if (typeof children === 'function') {
      return children(formattedRelative);
    }

    return <Text>{formattedRelative}</Text>;
  }
}

export const BaseFormattedRelative = FormattedRelative;

export default withIntl(FormattedRelative);
