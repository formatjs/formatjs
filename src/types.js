import {PropTypes} from 'react';

const {bool, number, string, object, func, oneOf} = PropTypes;

export const intlPropTypes = {
    locale  : string,
    formats : object,
    messages: object,

    defaultLocale : string,
    defaultFormats: object,
};

export const intlContextTypes = Object.assign({}, intlPropTypes, {
    getDateTimeFormat: func.isRequired,
    getNumberFormat  : func.isRequired,
    getMessageFormat : func.isRequired,
    getRelativeFormat: func.isRequired,
    getPluralFormat  : func.isRequired,
});

export const dateTimeFormatPropTypes = {
    localeMatcher: oneOf(['best fit', 'lookup']),
    formatMatcher: oneOf(['basic', 'best fit']),

    timeZone: string,
    hour12  : bool,

    weekday     : oneOf(['narrow', 'short', 'long']),
    era         : oneOf(['narrow', 'short', 'long']),
    year        : oneOf(['numeric', '2-digit']),
    month       : oneOf(['numeric', '2-digit', 'narrow', 'short', 'long']),
    day         : oneOf(['numeric', '2-digit']),
    hour        : oneOf(['numeric', '2-digit']),
    minute      : oneOf(['numeric', '2-digit']),
    second      : oneOf(['numeric', '2-digit']),
    timeZoneName: oneOf(['short', 'long']),
};

export const numberFormatPropTypes = {
    localeMatcher: oneOf(['best fit', 'lookup']),

    style          : oneOf(['decimal', 'currency', 'percent']),
    currency       : string,
    currencyDisplay: oneOf(['symbol', 'code', 'name']),
    useGrouping    : bool,

    minimumIntegerDigits    : number,
    minimumFractionDigits   : number,
    maximumFractionDigits   : number,
    minimumSignificantDigits: number,
    maximumSignificantDigits: number,
};

export const relativeFormatPropTypes = {
    style: oneOf(['best fit', 'numeric']),
    units: oneOf(['second', 'minute', 'hour', 'day', 'month', 'year']),
};

export const pluralFormatPropTypes = {
    style: oneOf(['cardinal', 'ordinal']),
};
