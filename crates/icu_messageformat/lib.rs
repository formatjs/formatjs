mod error;
mod formatter;
mod value;

pub use error::{Error, ErrorCode, Result};
pub use formatter::{DateTimeKind, DefaultFormatters, Formatters};
pub use formatjs_icu_messageformat_parser::{
    ParserOptions,
    types::{MessageFormatElement, PluralType},
};
pub use formatjs_icu_skeleton_parser::{DateTimeFormatOptions, ExtendedNumberFormatOptions};
pub use icu::locale::Locale;
pub use icu::plurals::PluralCategory;
pub use value::{
    DateTimeValue, FormattedMessage, NumericValue, Part, TagFunction, Value,
};

use formatjs_icu_messageformat_parser::types::{
    DateTimeSkeletonOrStyle, NumberSkeletonOrStyle, PluralElement, PluralOrSelectOption,
    ValidPluralRule,
};
use formatjs_icu_messageformat_parser::{Parser, get_best_pattern};
use formatjs_icu_skeleton_parser::{
    DateTimeFormatDay, DateTimeFormatHour, DateTimeFormatMinute, DateTimeFormatMonth,
    DateTimeFormatSecond, DateTimeFormatTimeZoneName, DateTimeFormatWeekday,
    DateTimeFormatYear, NumberFormatOptionsStyle, parse_date_time_skeleton,
};
use std::collections::HashMap;
use std::sync::Arc;

pub type Values<T = String> = HashMap<String, Value<T>>;

#[derive(Debug, Clone)]
pub struct Formats {
    pub number: HashMap<String, ExtendedNumberFormatOptions>,
    pub date: HashMap<String, DateTimeFormatOptions>,
    pub time: HashMap<String, DateTimeFormatOptions>,
}

impl Default for Formats {
    fn default() -> Self {
        let number = HashMap::from([
            (
                "integer".to_owned(),
                ExtendedNumberFormatOptions {
                    base: formatjs_icu_skeleton_parser::NumberFormatOptions {
                        maximum_fraction_digits: Some(0),
                        ..Default::default()
                    },
                    ..Default::default()
                },
            ),
            (
                "currency".to_owned(),
                ExtendedNumberFormatOptions::new().with_style(NumberFormatOptionsStyle::Currency),
            ),
            (
                "percent".to_owned(),
                ExtendedNumberFormatOptions::new().with_style(NumberFormatOptionsStyle::Percent),
            ),
        ]);
        let date = HashMap::from([
            (
                "short".to_owned(),
                DateTimeFormatOptions::new()
                    .with_month(DateTimeFormatMonth::Numeric)
                    .with_day(DateTimeFormatDay::Numeric)
                    .with_year(DateTimeFormatYear::TwoDigit),
            ),
            (
                "medium".to_owned(),
                DateTimeFormatOptions::new()
                    .with_month(DateTimeFormatMonth::Short)
                    .with_day(DateTimeFormatDay::Numeric)
                    .with_year(DateTimeFormatYear::Numeric),
            ),
            (
                "long".to_owned(),
                DateTimeFormatOptions::new()
                    .with_month(DateTimeFormatMonth::Long)
                    .with_day(DateTimeFormatDay::Numeric)
                    .with_year(DateTimeFormatYear::Numeric),
            ),
            (
                "full".to_owned(),
                DateTimeFormatOptions::new()
                    .with_weekday(DateTimeFormatWeekday::Long)
                    .with_month(DateTimeFormatMonth::Long)
                    .with_day(DateTimeFormatDay::Numeric)
                    .with_year(DateTimeFormatYear::Numeric),
            ),
        ]);
        let time = HashMap::from([
            (
                "short".to_owned(),
                DateTimeFormatOptions::new()
                    .with_hour(DateTimeFormatHour::Numeric)
                    .with_minute(DateTimeFormatMinute::Numeric),
            ),
            (
                "medium".to_owned(),
                DateTimeFormatOptions::new()
                    .with_hour(DateTimeFormatHour::Numeric)
                    .with_minute(DateTimeFormatMinute::Numeric)
                    .with_second(DateTimeFormatSecond::Numeric),
            ),
            (
                "long".to_owned(),
                DateTimeFormatOptions::new()
                    .with_hour(DateTimeFormatHour::Numeric)
                    .with_minute(DateTimeFormatMinute::Numeric)
                    .with_second(DateTimeFormatSecond::Numeric)
                    .with_time_zone_name(DateTimeFormatTimeZoneName::Short),
            ),
            (
                "full".to_owned(),
                DateTimeFormatOptions::new()
                    .with_hour(DateTimeFormatHour::Numeric)
                    .with_minute(DateTimeFormatMinute::Numeric)
                    .with_second(DateTimeFormatSecond::Numeric)
                    .with_time_zone_name(DateTimeFormatTimeZoneName::Short),
            ),
        ]);
        Self { number, date, time }
    }
}

pub struct Options {
    pub parser: ParserOptions,
    pub formats: Formats,
    pub formatters: Arc<dyn Formatters>,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            parser: ParserOptions {
                requires_other_clause: true,
                should_parse_skeletons: true,
                ..Default::default()
            },
            formats: Formats::default(),
            formatters: Arc::new(DefaultFormatters),
        }
    }
}

pub struct IcuMessageFormat {
    ast: Vec<MessageFormatElement>,
    message: Option<String>,
    formats: Formats,
    formatters: Arc<dyn Formatters>,
}

impl IcuMessageFormat {
    pub fn new(message: impl AsRef<str>) -> Result<Self> {
        Self::try_new(message)
    }

    pub fn try_new(message: impl AsRef<str>) -> Result<Self> {
        Self::try_new_with_options(message, Options::default())
    }

    pub fn try_new_with_options(
        message: impl AsRef<str>,
        mut options: Options,
    ) -> Result<Self> {
        options.parser.locale = None;
        let message = message.as_ref();
        let ast = Parser::new(message, options.parser)
            .parse()
            .map_err(|error| {
                Error::new(ErrorCode::Parse, error.to_string())
                    .with_original_message(Some(message))
            })?;
        Ok(Self {
            ast,
            message: Some(message.to_owned()),
            formats: options.formats,
            formatters: options.formatters,
        })
    }

    pub fn from_ast(ast: Vec<MessageFormatElement>) -> Self {
        Self::from_ast_with_options(ast, Options::default())
    }

    pub fn from_ast_with_options(
        ast: Vec<MessageFormatElement>,
        options: Options,
    ) -> Self {
        Self {
            ast,
            message: None,
            formats: options.formats,
            formatters: options.formatters,
        }
    }

    pub fn format<T: Clone>(
        &self,
        locale: impl AsRef<str>,
        values: &Values<T>,
    ) -> Result<FormattedMessage<T>> {
        let parts = self.format_to_parts(locale, values)?;
        if parts.len() == 1 {
            return Ok(match parts.into_iter().next().expect("one part") {
                Part::Literal(value) => FormattedMessage::Literal(value),
                Part::Object(value) => FormattedMessage::Object(value),
            });
        }
        Ok(FormattedMessage::Parts(parts))
    }

    pub fn format_to_parts<T: Clone>(
        &self,
        locale: impl AsRef<str>,
        values: &Values<T>,
    ) -> Result<Vec<Part<T>>> {
        let locale = resolve_locale([locale.as_ref()])?;
        self.format_elements(&locale, &self.ast, values, None)
    }

    pub fn format_to_string(
        &self,
        locale: impl AsRef<str>,
        values: &Values<String>,
    ) -> Result<String> {
        let parts = self.format_to_parts(locale, values)?;
        let mut output = String::new();
        for part in parts {
            match part {
                Part::Literal(value) => output.push_str(&value),
                Part::Object(_) => {
                    return Err(Error::new(
                        ErrorCode::InvalidValueType,
                        "Cannot convert rich object part to string",
                    ))
                }
            }
        }
        Ok(output)
    }

    pub fn get_ast(&self) -> &[MessageFormatElement] {
        &self.ast
    }

    fn format_elements<T: Clone>(
        &self,
        locale: &Locale,
        elements: &[MessageFormatElement],
        values: &Values<T>,
        current_plural_value: Option<NumericValue>,
    ) -> Result<Vec<Part<T>>> {
        if let [MessageFormatElement::Literal(literal)] = elements {
            return Ok(vec![Part::Literal(literal.value.clone())]);
        }

        let mut result = Vec::new();
        for element in elements {
            match element {
                MessageFormatElement::Literal(literal) => {
                    result.push(Part::Literal(literal.value.clone()));
                }
                MessageFormatElement::Pound(_) => {
                    if let Some(value) = current_plural_value {
                        result.push(Part::Literal(self.formatters.format_number(
                            locale,
                            value,
                            &ExtendedNumberFormatOptions::default(),
                        )?));
                    }
                }
                MessageFormatElement::Argument(argument) => {
                    let value = self.required_value(values, &argument.value)?;
                    result.push(match value {
                        Value::String(value) => Part::Literal(value.clone()),
                        Value::Number(value) => Part::Literal(value.to_string()),
                        Value::Integer(value) => Part::Literal(value.to_string()),
                        Value::Unsigned(value) => Part::Literal(value.to_string()),
                        Value::Boolean(false) => Part::Literal(String::new()),
                        Value::Boolean(true) => Part::Literal("true".to_owned()),
                        Value::Null => Part::Literal(String::new()),
                        Value::Object(value) => Part::Object(value.clone()),
                        Value::DateTime(_) => {
                            return Err(Error::invalid_value_type(
                                &argument.value,
                                "string, number, boolean, null, or object",
                                self.message.as_deref(),
                            ))
                        }
                        Value::Tag(_) => {
                            return Err(Error::invalid_value_type(
                                &argument.value,
                                "non-function value",
                                self.message.as_deref(),
                            ))
                        }
                    });
                }
                MessageFormatElement::Number(number) => {
                    let value = self
                        .required_value(values, &number.value)?
                        .numeric()
                        .ok_or_else(|| {
                            Error::invalid_value_type(
                                &number.value,
                                "number",
                                self.message.as_deref(),
                            )
                        })?;
                    let style = match number.style.as_ref() {
                        Some(NumberSkeletonOrStyle::String(name)) => self
                            .formats
                            .number
                            .get(name)
                            .cloned()
                            .unwrap_or_default(),
                        Some(NumberSkeletonOrStyle::Skeleton(skeleton)) => {
                            skeleton.parsed_options.clone()
                        }
                        None => ExtendedNumberFormatOptions::default(),
                    };
                    let value = value.scaled(style.scale().unwrap_or(1.0));
                    result.push(Part::Literal(self.formatters.format_number(
                        locale,
                        value,
                        &style,
                    )?));
                }
                MessageFormatElement::Date(date) => {
                    let value = self
                        .required_value(values, &date.value)?
                        .datetime()
                        .ok_or_else(|| {
                            Error::invalid_value_type(
                                &date.value,
                                "date/time or Unix epoch milliseconds",
                                self.message.as_deref(),
                            )
                        })?;
                    let style = self.datetime_style(
                        locale,
                        date.style.as_ref(),
                        DateTimeKind::Date,
                    )?;
                    result.push(Part::Literal(self.formatters.format_datetime(
                        locale,
                        value,
                        DateTimeKind::Date,
                        &style,
                    )?));
                }
                MessageFormatElement::Time(time) => {
                    let value = self
                        .required_value(values, &time.value)?
                        .datetime()
                        .ok_or_else(|| {
                            Error::invalid_value_type(
                                &time.value,
                                "date/time or Unix epoch milliseconds",
                                self.message.as_deref(),
                            )
                        })?;
                    let style = self.datetime_style(
                        locale,
                        time.style.as_ref(),
                        DateTimeKind::Time,
                    )?;
                    result.push(Part::Literal(self.formatters.format_datetime(
                        locale,
                        value,
                        DateTimeKind::Time,
                        &style,
                    )?));
                }
                MessageFormatElement::Select(select) => {
                    let value = self.required_value(values, &select.value)?;
                    let key = value.selector().ok_or_else(|| {
                        Error::invalid_value_type(
                            &select.value,
                            "string-compatible selector",
                            self.message.as_deref(),
                        )
                    })?;
                    let option = select
                        .options
                        .get(&key)
                        .or_else(|| select.options.get("other"))
                        .ok_or_else(|| {
                            Error::invalid_value(
                                &select.value,
                                &key,
                                select.options.keys(),
                                self.message.as_deref(),
                            )
                        })?;
                    result.extend(self.format_elements(locale, &option.value, values, None)?);
                }
                MessageFormatElement::Plural(plural) => {
                    let value = self
                        .required_value(values, &plural.value)?
                        .numeric()
                        .ok_or_else(|| {
                            Error::invalid_value_type(
                                &plural.value,
                                "number",
                                self.message.as_deref(),
                            )
                        })?;
                    let option = self.plural_option(locale, plural, value)?.ok_or_else(|| {
                        Error::invalid_value(
                            &plural.value,
                            &value.as_f64().to_string(),
                            plural.options.keys().map(ValidPluralRule::as_str),
                            self.message.as_deref(),
                        )
                    })?;
                    let adjusted = NumericValue::Float(value.as_f64() - f64::from(plural.offset));
                    result.extend(self.format_elements(
                        locale,
                        &option.value,
                        values,
                        Some(adjusted),
                    )?);
                }
                MessageFormatElement::Tag(tag) => {
                    let value = self.required_value(values, &tag.value)?;
                    let Value::Tag(function) = value else {
                        return Err(Error::invalid_value_type(
                            &tag.value,
                            "function",
                            self.message.as_deref(),
                        ));
                    };
                    let children = self.format_elements(
                        locale,
                        &tag.children,
                        values,
                        current_plural_value,
                    )?;
                    result.extend(function(children)?);
                }
            }
        }
        Ok(merge_literals(result))
    }

    fn required_value<'a, T>(
        &self,
        values: &'a Values<T>,
        variable: &str,
    ) -> Result<&'a Value<T>> {
        values
            .get(variable)
            .ok_or_else(|| Error::missing_value(variable, self.message.as_deref()))
    }

    fn datetime_style(
        &self,
        locale: &Locale,
        style: Option<&DateTimeSkeletonOrStyle>,
        kind: DateTimeKind,
    ) -> Result<DateTimeFormatOptions> {
        Ok(match style {
            Some(DateTimeSkeletonOrStyle::String(name)) => match kind {
                DateTimeKind::Date => self.formats.date.get(name),
                DateTimeKind::Time => self.formats.time.get(name),
            }
            .cloned()
            .unwrap_or_default(),
            Some(DateTimeSkeletonOrStyle::Skeleton(skeleton))
                if skeleton.pattern.chars().any(|symbol| matches!(symbol, 'j' | 'J')) =>
            {
                let pattern = get_best_pattern(&skeleton.pattern, locale);
                parse_date_time_skeleton(&pattern)
                    .map_err(|error| Error::new(ErrorCode::Formatter, error))?
            }
            Some(DateTimeSkeletonOrStyle::Skeleton(skeleton)) => skeleton.parsed_options.clone(),
            None if kind == DateTimeKind::Time => self
                .formats
                .time
                .get("medium")
                .cloned()
                .unwrap_or_default(),
            None => DateTimeFormatOptions::default(),
        })
    }

    fn plural_option<'a>(
        &self,
        locale: &Locale,
        plural: &'a PluralElement,
        value: NumericValue,
    ) -> Result<Option<&'a PluralOrSelectOption>> {
        let numeric = value.as_f64();
        if let Some(option) = plural.options.iter().find_map(|(key, option)| match key {
            ValidPluralRule::Exact(exact) => exact
                .strip_prefix('=')
                .and_then(|exact| exact.parse::<f64>().ok())
                .filter(|exact| *exact == numeric)
                .map(|_| option),
            _ => None,
        }) {
            return Ok(Some(option));
        }

        let adjusted = NumericValue::Float(numeric - f64::from(plural.offset));
        let category = self.formatters.plural_category(
            locale,
            adjusted,
            plural.plural_type,
        )?;
        Ok(plural
            .options
            .get(&plural_rule(category))
            .or_else(|| plural.options.get(&ValidPluralRule::Other)))
    }
}

fn resolve_locale<I, S>(locales: I) -> Result<Locale>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let mut invalid = Vec::new();
    for locale in locales {
        let locale = locale.as_ref();
        match locale.parse() {
            Ok(locale) => return Ok(locale),
            Err(_) => invalid.push(locale.to_owned()),
        }
    }
    Err(Error::new(
        ErrorCode::InvalidValue,
        format!("No valid locale in [{}]", invalid.join(", ")),
    ))
}

fn plural_rule(category: PluralCategory) -> ValidPluralRule {
    match category {
        PluralCategory::Zero => ValidPluralRule::Zero,
        PluralCategory::One => ValidPluralRule::One,
        PluralCategory::Two => ValidPluralRule::Two,
        PluralCategory::Few => ValidPluralRule::Few,
        PluralCategory::Many => ValidPluralRule::Many,
        PluralCategory::Other => ValidPluralRule::Other,
    }
}

fn merge_literals<T>(parts: Vec<Part<T>>) -> Vec<Part<T>> {
    let mut merged: Vec<Part<T>> = Vec::with_capacity(parts.len());
    for part in parts {
        match (merged.last_mut(), part) {
            (Some(Part::Literal(previous)), Part::Literal(value)) => previous.push_str(&value),
            (_, part) => merged.push(part),
        }
    }
    merged
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_arguments_selects_and_plurals() {
        let formatter = IcuMessageFormat::try_new(
            "{name} has {count, plural, =0 {no tasks} one {# task} other {# tasks}}.",
        )
        .unwrap();
        let values: Values<String> = HashMap::from([
            ("name".to_owned(), Value::from("Ada")),
            ("count".to_owned(), Value::from(2_i64)),
        ]);

        assert_eq!(
            formatter.format_to_string("en-US", &values).unwrap(),
            "Ada has 2 tasks."
        );
    }

    #[test]
    fn selects_locale_specific_plural_category() {
        fn assert_send_sync<T: Send + Sync>() {}
        assert_send_sync::<IcuMessageFormat>();

        let formatter = IcuMessageFormat::try_new(
            "{count, plural, one {one} few {few} many {many} other {other}}",
        )
        .unwrap();
        let values: Values<String> =
            HashMap::from([("count".to_owned(), Value::from(2_i64))]);
        assert_eq!(formatter.format_to_string("pl", &values).unwrap(), "few");

        assert_eq!(formatter.format_to_string("en", &values).unwrap(), "other");
        assert_eq!(
            formatter
                .format_to_string("", &values)
                .unwrap_err()
                .code,
            ErrorCode::InvalidValue
        );
    }

    #[test]
    fn resolves_locale_dependent_skeleton_at_format_time() {
        use formatjs_icu_skeleton_parser::DateTimeFormatHourCycle;

        let formatter = IcuMessageFormat::try_new("{value, time, ::jmm}").unwrap();
        let MessageFormatElement::Time(time) = &formatter.ast[0] else {
            panic!("expected time element");
        };
        let en_us: Locale = "en-US".parse().unwrap();
        let h23: Locale = "en-US-u-hc-h23".parse().unwrap();

        assert_eq!(
            formatter
                .datetime_style(&en_us, time.style.as_ref(), DateTimeKind::Time)
                .unwrap()
                .hour_cycle(),
            Some(&DateTimeFormatHourCycle::H12)
        );
        assert_eq!(
            formatter
                .datetime_style(&h23, time.style.as_ref(), DateTimeKind::Time)
                .unwrap()
                .hour_cycle(),
            Some(&DateTimeFormatHourCycle::H23)
        );
    }

    #[test]
    fn formats_ordinals_and_plural_offsets() {
        let ordinal = IcuMessageFormat::try_new(
            "{place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}",
        )
        .unwrap();
        for (place, expected) in [
            (1_i64, "1st"),
            (2_i64, "2nd"),
            (3_i64, "3rd"),
            (11_i64, "11th"),
        ] {
            let values = HashMap::from([("place".to_owned(), Value::from(place))]);
            assert_eq!(
                ordinal.format_to_string("en-US", &values).unwrap(),
                expected
            );
        }

        let offset = IcuMessageFormat::try_new(
            "{count, plural, offset:1 =1 {one guest} other {# other guests}}",
        )
        .unwrap();
        let values = HashMap::from([("count".to_owned(), Value::from(3_i64))]);
        assert_eq!(
            offset.format_to_string("en-US", &values).unwrap(),
            "2 other guests"
        );
    }

    #[test]
    fn formats_numbers_and_dates_with_icu4x() {
        let number = IcuMessageFormat::try_new("{value, number}").unwrap();
        let number_values = HashMap::from([("value".to_owned(), Value::from(1234.5))]);
        assert_eq!(
            number.format_to_string("en-US", &number_values).unwrap(),
            "1,234.5"
        );

        let date = IcuMessageFormat::try_new("{value, date, medium}").unwrap();
        let date_values = HashMap::from([("value".to_owned(), Value::from(0_i64))]);
        assert_eq!(
            date.format_to_string("en-US", &date_values).unwrap(),
            "Jan 1, 1970"
        );

        let integer = IcuMessageFormat::try_new("{value, number, integer}").unwrap();
        let integer_values = HashMap::from([("value".to_owned(), Value::from(2.5))]);
        assert_eq!(
            integer
                .format_to_string("en-US", &integer_values)
                .unwrap(),
            "3"
        );

        let percent =
            IcuMessageFormat::try_new("{value, number, ::percent scale/0.01}").unwrap();
        let percent_values = HashMap::from([("value".to_owned(), Value::from(12.3))]);
        assert_eq!(
            percent
                .format_to_string("en-US", &percent_values)
                .unwrap(),
            "12%"
        );
    }

    #[test]
    fn reports_missing_values_with_formatjs_error_code() {
        let formatter = IcuMessageFormat::try_new("Hello, {name}!").unwrap();
        let error = formatter
            .format_to_string("en", &Values::default())
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::MissingValue);
        assert!(error.message.contains("name"));
    }

    #[test]
    fn requires_other_clause_by_default_but_can_disable_it() {
        let message = "{value, select, a {A} b {B}}";
        assert!(IcuMessageFormat::try_new(message).is_err());

        let mut options = Options::default();
        options.parser.requires_other_clause = false;
        assert!(IcuMessageFormat::try_new_with_options(message, options).is_ok());
    }

    #[test]
    fn formats_rich_tags_to_parts() {
        let formatter = IcuMessageFormat::try_new("Hello, <b>{name}</b>!").unwrap();
        let values: Values<String> = HashMap::from([
            ("name".to_owned(), Value::from("Ada")),
            (
                "b".to_owned(),
                Value::tag(|parts: Vec<Part<String>>| {
                    Ok(vec![
                        Part::Literal("<strong>".to_owned()),
                        parts.into_iter().next().unwrap(),
                        Part::Literal("</strong>".to_owned()),
                    ])
                }),
            ),
        ]);
        assert_eq!(
            formatter.format_to_string("en", &values).unwrap(),
            "Hello, <strong>Ada</strong>!"
        );
    }

    #[test]
    fn converts_epoch_milliseconds_to_utc() {
        assert_eq!(
            DateTimeValue::from_unix_millis(0),
            DateTimeValue {
                year: 1970,
                month: 1,
                day: 1,
                hour: 0,
                minute: 0,
                second: 0,
                nanosecond: 0,
            }
        );
    }
}
