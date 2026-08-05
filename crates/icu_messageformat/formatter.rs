use crate::error::{Error, ErrorCode, Result};
use crate::value::{DateTimeValue, NumericValue};
use fixed_decimal::{SignedRoundingMode, UnsignedRoundingMode};
use formatjs_icu_messageformat_parser::types::PluralType;
use formatjs_icu_skeleton_parser::{DateTimeFormatOptions, ExtendedNumberFormatOptions};
use icu::datetime::fieldsets::{T, YMD, YMDE};
use icu::datetime::input::{Date, Time};
use icu::datetime::DateTimeFormatter;
use icu::decimal::input::Decimal;
use icu::decimal::options::{DecimalFormatterOptions, GroupingStrategy};
use icu::decimal::DecimalFormatter;
use icu::locale::Locale;
use icu::plurals::{PluralCategory, PluralOperands, PluralRules};
use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DateTimeKind {
    Date,
    Time,
}

pub trait Formatters: Send + Sync {
    fn format_number(
        &self,
        locale: &Locale,
        value: NumericValue,
        options: &ExtendedNumberFormatOptions,
    ) -> Result<String>;

    fn format_datetime(
        &self,
        locale: &Locale,
        value: DateTimeValue,
        kind: DateTimeKind,
        options: &DateTimeFormatOptions,
    ) -> Result<String>;

    fn plural_category(
        &self,
        locale: &Locale,
        value: NumericValue,
        plural_type: PluralType,
    ) -> Result<PluralCategory>;
}

#[derive(Debug, Default)]
pub struct DefaultFormatters;

impl DefaultFormatters {
    fn formatter_error(error: impl std::fmt::Display) -> Error {
        Error::new(ErrorCode::Formatter, error.to_string())
    }
}

impl Formatters for DefaultFormatters {
    fn format_number(
        &self,
        locale: &Locale,
        value: NumericValue,
        options: &ExtendedNumberFormatOptions,
    ) -> Result<String> {
        use formatjs_icu_skeleton_parser::{
            NumberFormatOptionsStyle, RoundingModeType, TrailingZeroDisplay, UseGroupingString,
            UseGroupingType,
        };

        let percent = matches!(options.style(), Some(NumberFormatOptionsStyle::Percent));
        let value = if percent { value.scaled(100.0) } else { value };
        let mut decimal = Decimal::from_str(&value.decimal_string()?)
            .map_err(Self::formatter_error)?;

        let default_minimum_fraction_digits = match options.style() {
            Some(NumberFormatOptionsStyle::Currency) => 2,
            _ => 0,
        };
        let minimum_fraction_digits = options
            .minimum_fraction_digits()
            .unwrap_or(default_minimum_fraction_digits);
        let default_maximum_fraction_digits = match options.style() {
            Some(NumberFormatOptionsStyle::Percent) => 0,
            Some(NumberFormatOptionsStyle::Currency) => 2,
            _ => 3,
        };
        let maximum_fraction_digits = options
            .maximum_fraction_digits()
            .unwrap_or(default_maximum_fraction_digits.max(minimum_fraction_digits));
        {
            let rounding_mode = match options.rounding_mode() {
                Some(RoundingModeType::Ceil) => SignedRoundingMode::Ceil,
                Some(RoundingModeType::Floor) => SignedRoundingMode::Floor,
                Some(RoundingModeType::Expand) => {
                    SignedRoundingMode::Unsigned(UnsignedRoundingMode::Expand)
                }
                Some(RoundingModeType::Trunc) => {
                    SignedRoundingMode::Unsigned(UnsignedRoundingMode::Trunc)
                }
                Some(RoundingModeType::HalfCeil) => SignedRoundingMode::HalfCeil,
                Some(RoundingModeType::HalfFloor) => SignedRoundingMode::HalfFloor,
                Some(RoundingModeType::HalfTrunc) => {
                    SignedRoundingMode::Unsigned(UnsignedRoundingMode::HalfTrunc)
                }
                Some(RoundingModeType::HalfEven) => {
                    SignedRoundingMode::Unsigned(UnsignedRoundingMode::HalfEven)
                }
                Some(RoundingModeType::HalfExpand) | None => {
                    SignedRoundingMode::Unsigned(UnsignedRoundingMode::HalfExpand)
                }
            };
            decimal.round_with_mode(-(maximum_fraction_digits as i16), rounding_mode);
            decimal.absolute.trim_end();
        }
        if minimum_fraction_digits > 0 {
            decimal.absolute.pad_end(-(minimum_fraction_digits as i16));
        }
        if let Some(minimum_integer_digits) = options.minimum_integer_digits() {
            decimal
                .absolute
                .pad_start(minimum_integer_digits.saturating_sub(1) as i16);
        }
        if matches!(
            options.trailing_zero_display(),
            Some(TrailingZeroDisplay::StripIfInteger)
        ) {
            decimal.absolute.trim_end_if_integer();
        }

        let mut formatter_options = DecimalFormatterOptions::default();
        formatter_options.grouping_strategy = options.use_grouping().map(|grouping| match grouping {
            UseGroupingType::Bool(false) => GroupingStrategy::Never,
            UseGroupingType::Bool(true) | UseGroupingType::String(UseGroupingString::Always) => {
                GroupingStrategy::Always
            }
            UseGroupingType::String(UseGroupingString::Min2) => GroupingStrategy::Min2,
            UseGroupingType::String(UseGroupingString::Auto) => GroupingStrategy::Auto,
        });

        let formatter = DecimalFormatter::try_new(locale.clone().into(), formatter_options)
            .map_err(Self::formatter_error)?;
        let mut formatted = formatter.format_to_string(&decimal);

        match options.style() {
            Some(NumberFormatOptionsStyle::Percent) => formatted.push('%'),
            Some(NumberFormatOptionsStyle::Currency) => {
                let currency = options.currency().ok_or_else(|| {
                    Error::new(
                        ErrorCode::InvalidValue,
                        "Currency number format requires a currency code",
                    )
                })?;
                formatted = format!("{currency}\u{a0}{formatted}");
            }
            Some(NumberFormatOptionsStyle::Unit) => {
                let unit = options.unit().ok_or_else(|| {
                    Error::new(
                        ErrorCode::InvalidValue,
                        "Unit number format requires a unit identifier",
                    )
                })?;
                formatted = format!("{formatted} {unit}");
            }
            _ => {}
        }

        Ok(formatted)
    }

    fn format_datetime(
        &self,
        locale: &Locale,
        value: DateTimeValue,
        kind: DateTimeKind,
        options: &DateTimeFormatOptions,
    ) -> Result<String> {
        use formatjs_icu_skeleton_parser::{DateTimeFormatMonth, DateTimeFormatWeekday};

        match kind {
            DateTimeKind::Date => {
                let date = Date::try_new_iso(value.year, value.month, value.day)
                    .map_err(Self::formatter_error)?;
                let length = match options.month() {
                    Some(DateTimeFormatMonth::Long) => 2,
                    Some(DateTimeFormatMonth::Short) => 1,
                    _ => 0,
                };
                let has_weekday = matches!(
                    options.weekday(),
                    Some(
                        DateTimeFormatWeekday::Long
                            | DateTimeFormatWeekday::Short
                            | DateTimeFormatWeekday::Narrow
                    )
                );

                let formatted = if has_weekday {
                    match length {
                        0 => DateTimeFormatter::try_new(locale.clone().into(), YMDE::short())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                        1 => DateTimeFormatter::try_new(locale.clone().into(), YMDE::medium())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                        _ => DateTimeFormatter::try_new(locale.clone().into(), YMDE::long())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                    }
                } else {
                    match length {
                        0 => DateTimeFormatter::try_new(locale.clone().into(), YMD::short())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                        1 => DateTimeFormatter::try_new(locale.clone().into(), YMD::medium())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                        _ => DateTimeFormatter::try_new(locale.clone().into(), YMD::long())
                            .map_err(Self::formatter_error)?
                            .format(&date)
                            .to_string(),
                    }
                };
                Ok(formatted)
            }
            DateTimeKind::Time => {
                let time = Time::try_new(
                    value.hour,
                    value.minute,
                    value.second,
                    value.nanosecond,
                )
                .map_err(Self::formatter_error)?;
                if options.second().is_some() {
                    Ok(DateTimeFormatter::try_new(locale.clone().into(), T::hms())
                        .map_err(Self::formatter_error)?
                        .format(&time)
                        .to_string())
                } else {
                    Ok(DateTimeFormatter::try_new(locale.clone().into(), T::hm())
                        .map_err(Self::formatter_error)?
                        .format(&time)
                        .to_string())
                }
            }
        }
    }

    fn plural_category(
        &self,
        locale: &Locale,
        value: NumericValue,
        plural_type: PluralType,
    ) -> Result<PluralCategory> {
        let rules = match plural_type {
            PluralType::Cardinal => PluralRules::try_new_cardinal(locale.clone().into()),
            PluralType::Ordinal => PluralRules::try_new_ordinal(locale.clone().into()),
        }
        .map_err(Self::formatter_error)?;
        let decimal = Decimal::from_str(&value.decimal_string()?)
            .map_err(Self::formatter_error)?;
        let operands = PluralOperands::from(&decimal);
        Ok(rules.category_for(operands))
    }
}
