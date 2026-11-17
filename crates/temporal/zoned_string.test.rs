use formatjs_temporal::{
    CalendarName, Disambiguation, Instant, OffsetOption, Precision, RoundingMode, TimeZone,
    TimeZoneName, TimeZoneRegistry, ZonedDateTime, ZonedFormatOptions, ZonedParseOptions,
    calendar::Calendar, named_time_zone_identifier,
};

fn options(offset: OffsetOption, disambiguation: Disambiguation) -> ZonedParseOptions {
    ZonedParseOptions {
        offset,
        disambiguation,
    }
}
fn parse(
    text: &str,
    options: ZonedParseOptions,
) -> Result<ZonedDateTime<formatjs_temporal::ResolvedTimeZone<'static>>, formatjs_temporal::Error> {
    ZonedDateTime::parse(text, TimeZoneRegistry::compiled(), options)
}

#[test]
fn zoned_updates_preserve_fold_offsets_and_match_supplied_offsets_exactly() {
    use formatjs_temporal::{
        DateTimeFields, NANOSECONDS_PER_DAY, TimeFields, ZonedFields, ZonedWithOptions,
    };
    let later = parse(
        "2020-11-01T01:30:00-05:00[America/New_York]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    let earlier = parse(
        "2020-11-01T01:30:00-04:00[America/New_York]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    let minute = ZonedFields {
        date_time: DateTimeFields {
            time: TimeFields {
                minute: Some(31),
                ..TimeFields::default()
            },
            ..DateTimeFields::default()
        },
        ..ZonedFields::default()
    };
    for (source, expected) in [
        (&earlier, "2020-11-01T05:31:00Z"),
        (&later, "2020-11-01T06:31:00Z"),
    ] {
        assert_eq!(
            source
                .with_fields(minute, ZonedWithOptions::default())
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    assert_eq!(
        later
            .with_fields(
                ZonedFields {
                    offset: Some(-4 * 3_600_000_000_000),
                    ..ZonedFields::default()
                },
                ZonedWithOptions::default()
            )
            .unwrap()
            .instant(),
        earlier.instant()
    );
    let wrong = ZonedFields {
        offset: Some(-3 * 3_600_000_000_000),
        ..ZonedFields::default()
    };
    for (offset, expected) in [
        (OffsetOption::Prefer, "2020-11-01T05:30:00Z"),
        (OffsetOption::Use, "2020-11-01T04:30:00Z"),
        (OffsetOption::Ignore, "2020-11-01T05:30:00Z"),
    ] {
        assert_eq!(
            later
                .with_fields(
                    wrong,
                    ZonedWithOptions {
                        offset,
                        ..ZonedWithOptions::default()
                    }
                )
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    assert!(
        later
            .with_fields(
                wrong,
                ZonedWithOptions {
                    offset: OffsetOption::Reject,
                    ..ZonedWithOptions::default()
                }
            )
            .is_err()
    );
    assert!(
        later
            .with_fields(ZonedFields::default(), ZonedWithOptions::default())
            .is_err()
    );
    for offset in [
        NANOSECONDS_PER_DAY,
        -NANOSECONDS_PER_DAY,
        i128::MAX,
        i128::MIN,
    ] {
        assert!(
            later
                .with_fields(
                    ZonedFields {
                        offset: Some(offset),
                        ..ZonedFields::default()
                    },
                    ZonedWithOptions {
                        offset: OffsetOption::Ignore,
                        ..ZonedWithOptions::default()
                    }
                )
                .is_err()
        );
    }
    let historical = parse(
        "1900-01-01T12:00:00+00:09:21[Europe/Paris]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    assert!(
        historical
            .with_fields(
                ZonedFields {
                    offset: Some(9 * 60_000_000_000),
                    ..ZonedFields::default()
                },
                ZonedWithOptions {
                    offset: OffsetOption::Reject,
                    ..ZonedWithOptions::default()
                }
            )
            .is_err()
    );
    let maximum = parse("+275760-09-13T00:00Z[UTC]", ZonedParseOptions::default()).unwrap();
    assert!(
        maximum
            .with_fields(
                ZonedFields {
                    date_time: DateTimeFields {
                        time: TimeFields {
                            nanosecond: Some(1),
                            ..TimeFields::default()
                        },
                        ..DateTimeFields::default()
                    },
                    ..ZonedFields::default()
                },
                ZonedWithOptions::default()
            )
            .is_err()
    );
}

#[test]
fn independent_icu_zoned_string_parsing_and_formatting() {
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_ZONED_STRINGS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<_> = line.split('\t').collect();
        if row[0] == "R" {
            let registry = TimeZoneRegistry::compiled();
            let zone = registry.resolve(row[1]).unwrap();
            let calendar = if row[8] == "iso8601" {
                Calendar::Iso8601
            } else {
                Calendar::Hebrew
            };
            let value = ZonedDateTime::new_in_calendar(
                Instant::from_epoch_nanoseconds(row[2].parse().unwrap()).unwrap(),
                zone,
                calendar,
            );
            let precision: i32 = row[3].parse().unwrap();
            let options = ZonedFormatOptions {
                precision: if precision == -1 {
                    Precision::Minute
                } else {
                    Precision::Digits(precision as u8)
                },
                rounding_mode: row[4].parse().unwrap(),
                offset: row[5] == "true",
                time_zone_name: match row[6] {
                    "never" => TimeZoneName::Never,
                    "critical" => TimeZoneName::Critical,
                    _ => TimeZoneName::Auto,
                },
                calendar_name: match row[7] {
                    "always" => CalendarName::Always,
                    "never" => CalendarName::Never,
                    "critical" => CalendarName::Critical,
                    _ => CalendarName::Auto,
                },
            };
            assert_eq!(value.format(options).unwrap().to_string(), row[9], "{line}");
            count += 1;
            continue;
        }
        let row = &row[1..];
        if named_time_zone_identifier(row[0]).is_none() {
            assert!(TimeZoneRegistry::compiled().resolve(row[0]).is_err());
            continue;
        }
        let value = parse(row[3], ZonedParseOptions::default())
            .unwrap_or_else(|error| panic!("{line}: {error:?}"));
        assert_eq!(
            value.instant().epoch_nanoseconds(),
            row[1].parse::<i128>().unwrap(),
            "{line}"
        );
        assert_eq!(
            value.time_zone().offset_nanoseconds(value.instant()),
            row[2].parse::<i128>().unwrap() * 1_000_000_000,
            "{line}"
        );
        assert_eq!(value.to_string(), row[4], "{line}");
        assert_eq!(
            parse(row[4], ZonedParseOptions::default())
                .unwrap()
                .instant(),
            value.instant(),
            "{line}"
        );
        assert_eq!(value.time_zone().identifier(), row[0]);
        count += 1;
    }
    assert_eq!(count, 29550);
    eprintln!("{count} independent ICU/java.time zoned string cases");
}
#[test]
fn zoned_offsets_disambiguation_and_annotation_rules() {
    let fold = "2020-11-01T01:30:00[America/New_York]";
    for (mode, expected) in [
        (Disambiguation::Compatible, "2020-11-01T05:30:00Z"),
        (Disambiguation::Earlier, "2020-11-01T05:30:00Z"),
        (Disambiguation::Later, "2020-11-01T06:30:00Z"),
    ] {
        assert_eq!(
            parse(fold, options(OffsetOption::Reject, mode))
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    assert!(parse(fold, options(OffsetOption::Reject, Disambiguation::Reject)).is_err());
    let gap = "2020-03-08T02:30:00-05:00[America/New_York]";
    assert!(parse(gap, ZonedParseOptions::default()).is_err());
    for (mode, expected) in [
        (Disambiguation::Earlier, "2020-03-08T06:30:00Z"),
        (Disambiguation::Later, "2020-03-08T07:30:00Z"),
        (Disambiguation::Compatible, "2020-03-08T07:30:00Z"),
    ] {
        assert_eq!(
            parse(gap, options(OffsetOption::Prefer, mode))
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    assert!(parse(gap, options(OffsetOption::Ignore, Disambiguation::Reject)).is_err());
    assert_eq!(
        parse(gap, options(OffsetOption::Use, Disambiguation::Reject))
            .unwrap()
            .instant(),
        "2020-03-08T07:30:00Z".parse::<Instant>().unwrap()
    );

    for (offset, expected) in [
        ("-04:00", "2020-11-01T05:30:00Z"),
        ("-05:00", "2020-11-01T06:30:00Z"),
    ] {
        let text = format!("2020-11-01T01:30:00{offset}[America/New_York]");
        assert_eq!(
            parse(&text, options(OffsetOption::Reject, Disambiguation::Reject))
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    let wrong = "2020-11-01T01:30:00-03:00[America/New_York]";
    assert!(parse(wrong, ZonedParseOptions::default()).is_err());
    for (behavior, expected) in [
        (OffsetOption::Use, "2020-11-01T04:30:00Z"),
        (OffsetOption::Prefer, "2020-11-01T05:30:00Z"),
        (OffsetOption::Ignore, "2020-11-01T05:30:00Z"),
    ] {
        assert_eq!(
            parse(wrong, options(behavior, Disambiguation::Compatible))
                .unwrap()
                .instant(),
            expected.parse::<Instant>().unwrap()
        );
    }
    for behavior in [
        OffsetOption::Use,
        OffsetOption::Reject,
        OffsetOption::Prefer,
        OffsetOption::Ignore,
    ] {
        let value = parse(
            "2020-11-01T01:30:00Z[!America/New_York][!u-ca=hebrew]",
            options(behavior, Disambiguation::Reject),
        )
        .unwrap();
        assert_eq!(
            value.instant(),
            "2020-11-01T01:30:00Z".parse::<Instant>().unwrap()
        );
        assert_eq!(value.calendar_id(), "hebrew");
    }
    for (text, expected) in [
        (
            "1986-01-01[Asia/Kathmandu]",
            "1986-01-01T00:15:00+05:45[Asia/Kathmandu]",
        ),
        (
            "2011-12-30[Pacific/Apia]",
            "2011-12-31T00:00:00+14:00[Pacific/Apia]",
        ),
    ] {
        assert_eq!(
            parse(text, options(OffsetOption::Reject, Disambiguation::Reject))
                .unwrap()
                .to_string(),
            expected
        );
    }
    for bad in [
        "2020-01-01T00:00Z",
        "2020-01-01Z[UTC]",
        "2020-01-01+00:00[UTC]",
        "2020-01-01[u-ca=iso8601]",
        "2020-01-01[UTC][UTC]",
        "2020-01-01[u-ca=iso8601][UTC]",
        "2020-01-01[UTC][!x=foo]",
        "2020-01-01[UTC][u-ca=hebrew][!u-ca=iso8601]",
        "2020-01-01[Not/AZone]",
        "2020-02-30T00[UTC]",
        "2020-01-01T24[UTC]",
        "-000000-01-01T00[UTC]",
        "2020-01-01T00[+00:00:01]",
    ] {
        assert!(parse(bad, ZonedParseOptions::default()).is_err(), "{bad}");
    }
    let alias = parse(
        "20200101t010203,123456789+0100[+01][u-ca=ISLAMICC][u-ca=unknown]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    assert_eq!(
        alias.to_string(),
        "2020-01-01T01:02:03.123456789+01:00[+01:00][u-ca=islamic-civil]"
    );
}
#[test]
fn historical_offsets_match_syntactic_precision() {
    let from_str: ZonedDateTime<formatjs_temporal::ResolvedTimeZone<'static>> =
        "1900-01-01T00:00+00:09[Europe/Paris]".parse().unwrap();
    assert_eq!(
        from_str.to_string(),
        "1900-01-01T00:00:00+00:09[Europe/Paris]"
    );
    assert_eq!(
        parse("2016-12-31T23:59:60Z[UTC]", ZonedParseOptions::default())
            .unwrap()
            .to_string(),
        "2016-12-31T23:59:59+00:00[UTC]"
    );

    let reference = parse(
        "1900-01-01T00:00+00:09[Europe/Paris]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    assert_eq!(
        reference.to_string(),
        "1900-01-01T00:00:00+00:09[Europe/Paris]"
    );
    for offset in ["+0009", "+00:09:21", "+000921.000000000"] {
        assert_eq!(
            parse(
                &format!("1900-01-01T00:00{offset}[Europe/Paris]"),
                ZonedParseOptions::default()
            )
            .unwrap()
            .instant(),
            reference.instant()
        );
    }
    for offset in ["+00:09:00", "+000900", "+00:09:00.000"] {
        assert!(
            parse(
                &format!("1900-01-01T00:00{offset}[Europe/Paris]"),
                ZonedParseOptions::default()
            )
            .is_err()
        );
    }
}
#[test]
fn zoned_format_rounding_options_recompute_offset_after_rounding() {
    for (text, expected) in [
        (
            "2020-03-08T06:59:59.999999999Z[America/New_York]",
            "2020-03-08T03:00:00-04:00[America/New_York]",
        ),
        (
            "2020-11-01T05:59:59.999999999Z[America/New_York]",
            "2020-11-01T01:00:00-05:00[America/New_York]",
        ),
    ] {
        let value = parse(text, ZonedParseOptions::default()).unwrap();
        assert_eq!(
            value
                .format(ZonedFormatOptions {
                    precision: Precision::Digits(0),
                    rounding_mode: RoundingMode::Ceil,
                    ..ZonedFormatOptions::default()
                })
                .unwrap()
                .to_string(),
            expected
        );
    }
    let value = parse(
        "2020-01-01T12:34:56.123456789+01:00[Europe/Paris][u-ca=hebrew]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    assert_eq!(
        value
            .format(ZonedFormatOptions {
                precision: Precision::Minute,
                offset: false,
                time_zone_name: TimeZoneName::Critical,
                calendar_name: CalendarName::Critical,
                ..ZonedFormatOptions::default()
            })
            .unwrap()
            .to_string(),
        "2020-01-01T12:34[!Europe/Paris][!u-ca=hebrew]"
    );
    assert_eq!(
        value
            .format(ZonedFormatOptions {
                precision: Precision::Digits(3),
                time_zone_name: TimeZoneName::Never,
                calendar_name: CalendarName::Never,
                ..ZonedFormatOptions::default()
            })
            .unwrap()
            .to_string(),
        "2020-01-01T12:34:56.123+01:00"
    );
    assert!(
        value
            .format(ZonedFormatOptions {
                precision: Precision::Digits(10),
                ..ZonedFormatOptions::default()
            })
            .is_err()
    );
    let iso = value.with_calendar(Calendar::Iso8601);
    assert!(
        iso.format(ZonedFormatOptions {
            calendar_name: CalendarName::Always,
            ..ZonedFormatOptions::default()
        })
        .unwrap()
        .to_string()
        .ends_with("[u-ca=iso8601]")
    );
}

#[test]
fn pinned_test262_zoned_parse_bounds() {
    let common = [
        "-271821-04-20T00:00Z[UTC]",
        "+275760-09-13T00:00Z[UTC]",
        "+275760-09-13T01:00+01:00[+01:00]",
        "+275760-09-13T23:59+23:59[+23:59]",
    ];
    let lower = [
        "-271821-04-19T23:00-01:00[-01:00]",
        "-271821-04-19T00:01-23:59[-23:59]",
    ];
    for behavior in [
        OffsetOption::Use,
        OffsetOption::Ignore,
        OffsetOption::Prefer,
        OffsetOption::Reject,
    ] {
        for text in common {
            assert!(
                parse(text, options(behavior, Disambiguation::Compatible)).is_ok(),
                "{text} {behavior:?}"
            );
        }
        for text in lower {
            assert_eq!(
                parse(text, options(behavior, Disambiguation::Compatible)).is_ok(),
                matches!(behavior, OffsetOption::Use | OffsetOption::Ignore),
                "{text} {behavior:?}"
            );
        }
        for text in [
            "-271821-04-19T23:59:59.999999999Z[UTC]",
            "-271821-04-19T23:00-00:59[-00:59]",
            "-271821-04-19T00:00:00-23:59[-23:59]",
            "+275760-09-13T00:00:00.000000001Z[UTC]",
            "+275760-09-13T01:00+00:59[+00:59]",
            "+275760-09-14T00:00+23:59[+23:59]",
            "-271821-04-20[+01]",
            "+275760-09-13[-01]",
        ] {
            assert!(
                parse(text, options(behavior, Disambiguation::Compatible)).is_err(),
                "{text} {behavior:?}"
            );
        }
    }
    let reference = parse(
        "1900-01-01T00:00+00:09:21[Europe/Paris]",
        ZonedParseOptions::default(),
    )
    .unwrap();
    let fields = reference.local().unwrap().fields();
    let construct = |offset| {
        ZonedDateTime::from_local_with_offset(
            fields,
            *reference.time_zone(),
            Calendar::Iso8601,
            offset,
            ZonedParseOptions::default(),
        )
    };
    assert!(
        construct(formatjs_temporal::OffsetInput::Exact(
            9 * 60 * 1_000_000_000
        ))
        .is_err()
    );
    assert_eq!(
        construct(formatjs_temporal::OffsetInput::Exact(561 * 1_000_000_000))
            .unwrap()
            .instant(),
        reference.instant()
    );
    assert_eq!(
        construct(formatjs_temporal::OffsetInput::Minute(
            9 * 60 * 1_000_000_000
        ))
        .unwrap()
        .instant(),
        reference.instant()
    );
}
