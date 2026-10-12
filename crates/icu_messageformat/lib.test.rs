#![cfg(feature = "compiled_data")]
use formatjs_icu_messageformat::*;
use formatjs_icu_messageformat_parser::{Parser, get_best_pattern};
use std::collections::HashMap;
use std::sync::Arc;

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

    let formatter =
        IcuMessageFormat::try_new("{count, plural, one {one} few {few} many {many} other {other}}")
            .unwrap();
    let values: Values<String> = HashMap::from([("count".to_owned(), Value::from(2_i64))]);
    assert_eq!(formatter.format_to_string("pl", &values).unwrap(), "few");

    assert_eq!(formatter.format_to_string("en", &values).unwrap(), "other");
    assert_eq!(
        formatter.format_to_string("", &values).unwrap_err().code,
        ErrorCode::InvalidValue
    );
}

#[test]
fn resolves_locale_dependent_skeleton_at_format_time() {
    let formatter = IcuMessageFormat::try_new("{value, time, ::jmm}").unwrap();
    let values = HashMap::from([("value".to_owned(), Value::from(0_i64))]);
    let twelve = formatter.format_to_string("en-US", &values).unwrap();
    let twenty_four = formatter
        .format_to_string("en-US-u-hc-h23", &values)
        .unwrap();
    assert!(twelve.contains("12:00"));
    assert!(twelve.contains("AM"));
    assert!(twenty_four.contains("00:00"));
    assert!(!twenty_four.contains("AM"));
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
        integer.format_to_string("en-US", &integer_values).unwrap(),
        "3"
    );

    let percent = IcuMessageFormat::try_new("{value, number, ::percent scale/0.01}").unwrap();
    let percent_values = HashMap::from([("value".to_owned(), Value::from(12.3))]);
    assert_eq!(
        percent.format_to_string("en-US", &percent_values).unwrap(),
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
