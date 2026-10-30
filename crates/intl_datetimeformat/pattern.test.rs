use formatjs_intl_datetimeformat::{
    Error,
    fields::{Components, NumericWidth, TextWidth, Width},
    matching,
    pattern::{self, RawPatterns, Source},
};

#[test]
fn quoting_hour_variants_and_range_sources_preserve_literals() {
    let format = pattern::parse(
        "yMMMd",
        "d 'de' MMM y 'at' h:mm a",
        &RawPatterns(vec![("d".into(), "MMM d–d, y".into())]),
        Some("{1} ～ {0}"),
    )
    .unwrap();
    assert_eq!(format.pattern, "{day} de {month} {year} at {hour}:{minute}");
    assert_eq!(
        format.pattern12,
        "{day} de {month} {year} at {hour}:{minute} {ampm}"
    );
    let parts = &format.range_patterns["day"].pattern_parts;
    assert_eq!(
        parts
            .iter()
            .map(|p| (p.source, p.pattern.as_str()))
            .collect::<Vec<_>>(),
        vec![
            (Source::Shared, "{month} "),
            (Source::StartRange, "{day}"),
            (Source::Shared, "–"),
            (Source::EndRange, "{day}"),
            (Source::Shared, ", {year}"),
        ]
    );
    assert_eq!(
        format.range_patterns["default"].pattern_parts[0].source,
        Source::EndRange
    );
}
#[test]
fn matching_retains_named_months_numeric_patterns_and_minute_padding() {
    let format = pattern::parse("yM", "y MMM", &RawPatterns::default(), None).unwrap();
    let mut options = Components::default();
    options.month = Some(Width::TwoDigit);
    let selected = matching::best_fit(options, &[format]).unwrap();
    assert_eq!(selected.components.month, Some(Width::Short));
    let format = pattern::parse("Hm", "H:mm", &RawPatterns::default(), None).unwrap();
    options = Components::default();
    options.hour = Some(NumericWidth::Numeric);
    options.minute = Some(NumericWidth::Numeric);
    assert_eq!(
        matching::best_fit(options, &[format])
            .unwrap()
            .components
            .minute,
        Some(NumericWidth::TwoDigit)
    );
    let format = pattern::parse("e", "EEE", &RawPatterns::default(), None).unwrap();
    options = Components::default();
    options.weekday = Some(TextWidth::Long);
    assert_eq!(
        matching::best_fit(options, &[format])
            .unwrap()
            .components
            .weekday,
        Some(TextWidth::Long)
    );
}
#[test]
fn ties_use_registration_order_and_cyclic_year_ranges_require_calendar_fields() {
    let first = pattern::parse("yMd", "y-MM-dd", &RawPatterns::default(), None).unwrap();
    let second = pattern::parse("yMd", "dd/MM/y", &RawPatterns::default(), None).unwrap();
    assert_eq!(
        matching::basic(Components::default(), &[first.clone(), second]).unwrap(),
        first
    );
    let format = pattern::parse(
        "rUMMMd",
        "r U MMM d",
        &RawPatterns(vec![("y".into(), "y–y MMM d".into())]),
        Some("{0}–{1}"),
    )
    .unwrap();
    assert!(!format.range_patterns.contains_key("year"));
    assert!(format.range_patterns.contains_key("default"));
    assert_eq!(
        pattern::parse("Q", "Q", &RawPatterns::default(), None),
        Err(Error::InvalidPattern)
    );
}
