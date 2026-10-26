//! Locale-independent ECMA-402 digit options and decimal rounding. Inputs are
//! already coerced by the JS boundary; inactive digit options stay unvalidated.

use fixed_decimal::{Decimal, RoundingIncrement, UnsignedDecimal, UnsignedRoundingMode};
use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub minimum_integer_digits: Option<f64>,
    pub minimum_fraction_digits: Option<f64>,
    pub maximum_fraction_digits: Option<f64>,
    pub minimum_significant_digits: Option<f64>,
    pub maximum_significant_digits: Option<f64>,
    pub rounding_increment: Option<f64>,
    pub rounding_mode: Option<String>,
    pub rounding_priority: Option<String>,
    pub trailing_zero_display: Option<String>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Error {
    Range(&'static str),
    Type(&'static str),
    InvalidNumber,
}
impl fmt::Display for Error {
    fn fmt(&self, out: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Range(option) | Self::Type(option) => {
                write!(out, "Invalid digit option: {option}")
            }
            Self::InvalidNumber => out.write_str("Expected a finite decimal"),
        }
    }
}
impl std::error::Error for Error {}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
enum Mode {
    Ceil,
    Floor,
    Expand,
    Trunc,
    HalfCeil,
    HalfFloor,
    HalfExpand,
    HalfTrunc,
    HalfEven,
}
impl Mode {
    fn parse(value: &str) -> Result<Self, Error> {
        Ok(match value {
            "ceil" => Self::Ceil,
            "floor" => Self::Floor,
            "expand" => Self::Expand,
            "trunc" => Self::Trunc,
            "halfCeil" => Self::HalfCeil,
            "halfFloor" => Self::HalfFloor,
            "halfExpand" => Self::HalfExpand,
            "halfTrunc" => Self::HalfTrunc,
            "halfEven" => Self::HalfEven,
            _ => return Err(Error::Range("roundingMode")),
        })
    }
    fn unsigned(self, negative: bool) -> UnsignedRoundingMode {
        use UnsignedRoundingMode::*;
        match self {
            Self::Ceil => {
                if negative {
                    Trunc
                } else {
                    Expand
                }
            }
            Self::Floor => {
                if negative {
                    Expand
                } else {
                    Trunc
                }
            }
            Self::Expand => Expand,
            Self::Trunc => Trunc,
            Self::HalfCeil => {
                if negative {
                    HalfTrunc
                } else {
                    HalfExpand
                }
            }
            Self::HalfFloor => {
                if negative {
                    HalfExpand
                } else {
                    HalfTrunc
                }
            }
            Self::HalfExpand => HalfExpand,
            Self::HalfTrunc => HalfTrunc,
            Self::HalfEven => HalfEven,
        }
    }
}
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
enum Priority {
    Auto,
    MorePrecision,
    LessPrecision,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
enum TrailingZeros {
    Auto,
    StripIfInteger,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum Kind {
    Fraction,
    Significant,
    More,
    Less,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Digits {
    minimum_integer_digits: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    minimum_fraction_digits: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    maximum_fraction_digits: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    minimum_significant_digits: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    maximum_significant_digits: Option<u8>,
    rounding_increment: u16,
    rounding_mode: Mode,
    rounding_priority: Priority,
    trailing_zero_display: TrailingZeros,
    #[serde(skip)]
    kind: Kind,
}

fn number(
    value: Option<f64>,
    min: u16,
    max: u16,
    fallback: u16,
    name: &'static str,
) -> Result<u16, Error> {
    let Some(value) = value else {
        return Ok(fallback);
    };
    // DefaultNumberOption tests the original value before flooring it.
    if !value.is_finite() || value < f64::from(min) || value > f64::from(max) {
        return Err(Error::Range(name));
    }
    Ok(value.floor() as u16)
}
impl Digits {
    pub fn new(options: &Options, compact: bool) -> Result<Self, Error> {
        // SetNumberFormatDigitOptions 1–15: common options precede digit limits.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L97-L112
        let minimum_integer_digits = number(
            options.minimum_integer_digits,
            1,
            21,
            1,
            "minimumIntegerDigits",
        )? as u8;
        let rounding_increment =
            number(options.rounding_increment, 1, 5000, 1, "roundingIncrement")?;
        if ![
            1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
        ]
        .contains(&rounding_increment)
        {
            return Err(Error::Range("roundingIncrement"));
        }
        let rounding_mode = Mode::parse(options.rounding_mode.as_deref().unwrap_or("halfExpand"))?;
        let mut rounding_priority = match options.rounding_priority.as_deref().unwrap_or("auto") {
            "auto" => Priority::Auto,
            "morePrecision" => Priority::MorePrecision,
            "lessPrecision" => Priority::LessPrecision,
            _ => return Err(Error::Range("roundingPriority")),
        };
        let trailing_zero_display = match options.trailing_zero_display.as_deref().unwrap_or("auto")
        {
            "auto" => TrailingZeros::Auto,
            "stripIfInteger" => TrailingZeros::StripIfInteger,
            _ => return Err(Error::Range("trailingZeroDisplay")),
        };
        let has_significant = options.minimum_significant_digits.is_some()
            || options.maximum_significant_digits.is_some();
        let has_fraction =
            options.minimum_fraction_digits.is_some() || options.maximum_fraction_digits.is_some();
        // Steps 16–22: only coerce/validate active precision options.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L113-L139
        let need_significant = rounding_priority != Priority::Auto || has_significant;
        let need_fraction =
            rounding_priority != Priority::Auto || !(has_significant || (!has_fraction && compact));
        let (mut minimum_significant_digits, mut maximum_significant_digits) = (None, None);
        if need_significant {
            let min = number(
                options.minimum_significant_digits,
                1,
                21,
                1,
                "minimumSignificantDigits",
            )?;
            let max = number(
                options.maximum_significant_digits,
                min,
                21,
                21,
                "maximumSignificantDigits",
            )?;
            minimum_significant_digits = Some(min as u8);
            maximum_significant_digits = Some(max as u8);
        }
        let (mut minimum_fraction_digits, mut maximum_fraction_digits) = (None, None);
        if need_fraction {
            let max_default: u16 = if rounding_increment == 1 { 3 } else { 0 };
            let mut min = options
                .minimum_fraction_digits
                .map(|value| number(Some(value), 0, 100, 0, "minimumFractionDigits"))
                .transpose()?;
            let mut max = options
                .maximum_fraction_digits
                .map(|value| number(Some(value), 0, 100, 0, "maximumFractionDigits"))
                .transpose()?;
            if min.is_none() {
                min = Some(0);
            }
            if max.is_none() {
                max = Some(max_default.max(min.unwrap()));
            }
            if min.unwrap() > max.unwrap() {
                return Err(Error::Range("maximumFractionDigits"));
            }
            minimum_fraction_digits = Some(min.unwrap() as u8);
            maximum_fraction_digits = Some(max.unwrap() as u8);
        }
        // Steps 23–28: compact defaults, priority, then increment compatibility.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L140-L162
        let kind = if !need_significant && !need_fraction {
            minimum_fraction_digits = Some(0);
            maximum_fraction_digits = Some(0);
            minimum_significant_digits = Some(1);
            maximum_significant_digits = Some(2);
            rounding_priority = Priority::MorePrecision;
            Kind::More
        } else if rounding_priority == Priority::MorePrecision {
            Kind::More
        } else if rounding_priority == Priority::LessPrecision {
            Kind::Less
        } else if has_significant {
            Kind::Significant
        } else {
            Kind::Fraction
        };
        if rounding_increment != 1 {
            if kind != Kind::Fraction {
                return Err(Error::Type("roundingIncrement"));
            }
            if minimum_fraction_digits != maximum_fraction_digits {
                return Err(Error::Range("roundingIncrement"));
            }
        }
        Ok(Self {
            minimum_integer_digits,
            minimum_fraction_digits,
            maximum_fraction_digits,
            minimum_significant_digits,
            maximum_significant_digits,
            rounding_increment,
            rounding_mode,
            rounding_priority,
            trailing_zero_display,
            kind,
        })
    }
    pub fn format(&self, input: &str) -> Result<Formatted, Error> {
        let mut number = Decimal::from_str(input).map_err(|_| Error::InvalidNumber)?;
        // FormatNumericToString 1–6: retain sign for directed rounding, but its
        // FormattedString is unsigned. Plural range equality uses that string.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L700-L723
        let mode = self.rounding_mode.unsigned(input.starts_with('-'));
        let mut source = number.absolute.clone();
        source.trim_start();
        let (mut rounded, magnitude) = match self.kind {
            Kind::Fraction => self.fraction(&source, mode),
            Kind::Significant => self.significant(&source, mode),
            Kind::More | Kind::Less => {
                let significant = self.significant(&source, mode);
                let fraction = self.fraction(&source, mode);
                // Steps 7.c–d: compare rounding magnitudes, including carries.
                // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L726-L738
                if (significant.1 <= fraction.1) == (self.kind == Kind::More) {
                    significant
                } else {
                    fraction
                }
            }
        };
        // Steps 9–13: strip fractional zeros for integer results, then pad only
        // the formatted integer. Keep returned rounded number mathematically equal.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L740-L751
        if self.trailing_zero_display == TrailingZeros::StripIfInteger {
            rounded.trim_end_if_integer();
        }
        rounded.pad_start(i16::from(self.minimum_integer_digits));
        let formatted_string = rounded.to_string();
        number.absolute = rounded;
        Ok(Formatted {
            number,
            formatted_string,
            rounding_magnitude: magnitude,
        })
    }
    fn fraction(
        &self,
        source: &UnsignedDecimal,
        mode: UnsignedRoundingMode,
    ) -> (UnsignedDecimal, i16) {
        let max = self.maximum_fraction_digits.unwrap();
        let mut increment = self.rounding_increment;
        let mut shift = 0;
        while increment % 10 == 0 {
            increment /= 10;
            shift += 1;
        }
        let increment = match increment {
            1 => RoundingIncrement::MultiplesOf1,
            2 => RoundingIncrement::MultiplesOf2,
            5 => RoundingIncrement::MultiplesOf5,
            25 => RoundingIncrement::MultiplesOf25,
            _ => unreachable!("validated increment"),
        };
        let mut result = source.clone();
        // ToRawFixed: exact rounding at the selected increment; retain minimum
        // fraction digits and report -maxFraction, independent of increment size.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1353-L1393
        result.round_with_mode_and_increment(-i16::from(max) + shift, mode, increment);
        result.trim_end();
        result.pad_end(-i16::from(self.minimum_fraction_digits.unwrap()));
        (result, -i16::from(max))
    }
    fn significant(
        &self,
        source: &UnsignedDecimal,
        mode: UnsignedRoundingMode,
    ) -> (UnsignedDecimal, i16) {
        let max = i16::from(self.maximum_significant_digits.unwrap());
        let min = i16::from(self.minimum_significant_digits.unwrap());
        let mut result = source.clone();
        let position = source.nonzero_magnitude_start().saturating_sub(max - 1);
        result.round_with_mode(position, mode);
        let exponent = result.nonzero_magnitude_start();
        // ToRawPrecision: a carry can change e; minimum precision pads zeros,
        // and the returned rounding magnitude is e-maxPrecision+1.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1294-L1332
        result.trim_end();
        result.pad_end((exponent - min + 1).min(0));
        (result, exponent - max + 1)
    }
}

pub struct Formatted {
    pub number: Decimal,
    pub formatted_string: String,
    pub rounding_magnitude: i16,
}
