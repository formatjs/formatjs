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
            (Source::EndRange, "{day}"),
            (Source::Shared, "–"),
            (Source::StartRange, "{day}"),
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
    let selected = matching::basic(Components::default(), &[first.clone(), second]).unwrap();
    assert_eq!(selected.pattern, first.pattern);
    assert_eq!(selected.components, first.pattern_fields);
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

#[test]
fn unknown_pattern_fields_retain_position_and_epoch_in_their_ilnd_value() {
    use formatjs_intl_datetimeformat::{
        registry::{Registry, ResolutionOptions},
        render::RenderData,
        selection::{Options, Snapshot},
        timezone::TimeZoneRegistry,
    };
    use serde_json::json;
    let mut registry = Registry::default();
    registry
        .add_locale_data(include_str!(env!("FORMATJS_DATETIME_EN")))
        .unwrap();
    let resolution = registry
        .resolve(&["en".into()], &ResolutionOptions::default())
        .unwrap();
    let components = Components {
        year: Some(NumericWidth::TwoDigit),
        ..Components::default()
    };
    let config = Snapshot::capture(&registry, resolution, components)
        .unwrap()
        .select(&Options::default())
        .unwrap();
    let profile = config.profile();
    let render = RenderData::capture(&registry, &config, profile).unwrap();
    let zones = TimeZoneRegistry::default().snapshot();
    let zone = zones.resolve("UTC").unwrap();
    let local = render
        .local_time(&zones, &zone, 1_704_164_645_987_000_000, false)
        .unwrap();
    let pattern = "A{customField}B{year}C{anotherField}";
    let parts = render
        .pattern(
            &config,
            profile,
            pattern,
            pattern,
            &local,
            &zone,
            profile.components,
        )
        .unwrap();
    assert_eq!(
        serde_json::to_value(parts).unwrap(),
        json!([
            {"type":"literal","value":"A"},
            {"type":"unknown","value":"customField:1704164645987000000"},
            {"type":"literal","value":"B"},
            {"type":"year","value":"24"},
            {"type":"literal","value":"C"},
            {"type":"unknown","value":"anotherField:1704164645987000000"}
        ])
    );
}
