/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import React, {Component, PropTypes} from 'react';
import {intlShape, relativeFormatPropTypes} from '../types';
import {invariantIntlContext, shouldIntlComponentUpdate} from '../utils';

const SECOND = 1000;
const MINUTE = 1000 * 60;
const HOUR   = 1000 * 60 * 60;
const DAY    = 1000 * 60 * 60 * 24;

// The maximum timer delay value is a 32-bit signed integer.
// See: https://mdn.io/setTimeout
const MAX_TIMER_DELAY = 2147483647;

function selectUnits(delta) {
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

    // The maximum scheduled delay will be measured in days since the maximum
    // timer delay is less than the number of milliseconds in 25 days.
    return 'day';
}

function getUnitDelay(units) {
    switch (units) {
    case 'second': return SECOND;
    case 'minute': return MINUTE;
    case 'hour'  : return HOUR;
    case 'day'   : return DAY;
    default      : return MAX_TIMER_DELAY;
    }
}

export default class FormattedRelative extends Component {
    constructor(props, context) {
        super(props, context);
        invariantIntlContext(context);

        let now = isFinite(props.initialNow) ?
                Number(props.initialNow) : context.intl.now();

        // `now` is stored as state so that `render()` remains a function of
        // props + state, instead of accessing `Date.now()` inside `render()`.
        this.state = {now};
    }

    scheduleNextUpdate(props, state) {
        const {updateInterval} = props;

        // If the `updateInterval` is falsy, including `0`, then auto updates
        // have been turned off, so we bail and skip scheduling an update.
        if (!updateInterval) {
            return;
        }

        let time  = new Date(props.value).getTime();
        let delta = time - state.now;
        let units = props.units || selectUnits(delta);

        let unitDelay     = getUnitDelay(units);
        let unitRemainder = Math.abs(delta % unitDelay);

        // We want the largest possible timer delay which will still display
        // accurate information while reducing unnecessary re-renders. The delay
        // should be until the next "interesting" moment, like a tick from
        // "1 minute ago" to "2 minutes ago" when the delta is 120,000ms.
        let delay = delta < 0 ?
            Math.max(updateInterval, unitDelay - unitRemainder) :
            Math.max(updateInterval, unitRemainder);

        clearTimeout(this._timer);

        this._timer = setTimeout(() => {
            this.setState({now: this.context.intl.now()});
        }, delay);
    }

    shouldComponentUpdate(...next) {
        return shouldIntlComponentUpdate(this, ...next);
    }

    componentWillUpdate(nextProps, nextState) {
        this.scheduleNextUpdate(nextProps, nextState);
    }

    componentDidMount() {
        this.scheduleNextUpdate(this.props, this.state);
    }

    componentWillUnmount() {
        clearTimeout(this._timer);
    }

    render() {
        const {formatRelative}  = this.context.intl;
        const {value, children} = this.props;

        let formattedRelative = formatRelative(value, {
            ...this.props,
            ...this.state,
        });

        if (typeof children === 'function') {
            return children(formattedRelative);
        }

        return <span>{formattedRelative}</span>;
    }
}

FormattedRelative.displayName = 'FormattedRelative';

FormattedRelative.contextTypes = {
    intl: intlShape,
};

FormattedRelative.propTypes = {
    ...relativeFormatPropTypes,
    value         : PropTypes.any.isRequired,
    format        : PropTypes.string,
    updateInterval: PropTypes.number,
    initialNow    : PropTypes.any,
    children      : PropTypes.func,
};

FormattedRelative.defaultProps = {
    updateInterval: 1000 * 10,
};
