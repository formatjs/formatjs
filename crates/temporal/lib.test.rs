use formatjs_temporal::{Instant, IsoDateTime, MAX_EPOCH_NANOSECONDS, NANOSECONDS_PER_DAY};

#[test]
fn day_rounding_checks_the_next_week_after_an_exact_week_count() {
    use formatjs_temporal::{DateTimeUnit as U, Error, PlainDate, RoundingMode as R};
    for (first, last) in [(99_999_993, 100_000_000), (-99_999_994, -100_000_001)] {
        let first = PlainDate::from_epoch_day(first).unwrap();
        let last = PlainDate::from_epoch_day(last).unwrap();
        assert_eq!(
            first.until(last, U::Week, U::Day, 2, R::Trunc),
            Err(Error::OutOfRange)
        );
        assert_eq!(
            first.since(last, U::Week, U::Day, 2, R::Trunc),
            Err(Error::OutOfRange)
        );
    }
}

#[test]
fn relative_fold_probes_use_compatible_time_without_changing_addition() {
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let events = [
        OffsetTransition {
            epoch_seconds: -1800,
            offset_seconds: 0,
        },
        OffsetTransition {
            epoch_seconds: 22 * 3600,
            offset_seconds: 1800,
        },
    ];
    let zone = TransitionZone::new(3600, &events, None).unwrap();
    let zoned = |value| ZonedDateTime::new(Instant::from_epoch_nanoseconds(value).unwrap(), zone);
    let origin = zoned(0);
    let target = zoned(93 * hour / 4);
    let difference = |target, smallest, mode| {
        origin
            .until(&target, DateTimeUnit::Day, smallest, 1, mode)
            .unwrap()
    };
    assert_eq!(
        difference(target, DateTimeUnit::Nanosecond, RoundingMode::Trunc).to_string(),
        "PT23H15M"
    );
    let rounded = difference(zoned(93 * hour / 4), DateTimeUnit::Hour, RoundingMode::Ceil);
    assert_eq!(rounded.to_string(), "PT24H");
    assert_eq!(
        origin
            .checked_add(rounded, Overflow::Constrain)
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        24 * hour
    );
    for smallest in [DateTimeUnit::Minute, DateTimeUnit::Nanosecond] {
        assert_eq!(
            difference(zoned(-49 * hour / 2), smallest, RoundingMode::Trunc).to_string(),
            "-PT23H30M"
        );
    }
    assert_eq!(
        difference(
            zoned(-hour / 4),
            DateTimeUnit::Nanosecond,
            RoundingMode::Trunc
        )
        .to_string(),
        "-PT15M"
    );
    assert_eq!(
        origin
            .checked_add("PT0S".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .instant(),
        origin.instant()
    );
}

#[test]
fn relative_difference_rejects_mixed_range_nonzero_fold_probe() {
    use formatjs_temporal::{
        DateTimeUnit, Error, OffsetTransition, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let events = [OffsetTransition {
        epoch_seconds: (-MAX_EPOCH_NANOSECONDS / 1_000_000_000) as i64,
        offset_seconds: 0,
    }];
    let zone = TransitionZone::new(7200, &events, None).unwrap();
    let zoned = |delta| {
        ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS + delta).unwrap(),
            zone,
        )
    };
    assert_eq!(
        zoned(25 * hour).until(
            &zoned(hour / 2),
            DateTimeUnit::Day,
            DateTimeUnit::Nanosecond,
            1,
            RoundingMode::Trunc
        ),
        Err(Error::OutOfRange)
    );
}

#[test]
fn date_zoned_conversion_distinguishes_day_start_from_explicit_midnight() {
    use formatjs_temporal::{
        OffsetTransition, PlainDate, PlainTime, TimeZone, TransitionDirection, TransitionZone,
        calendar::Calendar,
    };
    struct OwnedZone<'a>(TransitionZone<'a>);
    impl TimeZone for OwnedZone<'_> {
        fn offset_nanoseconds(&self, instant: Instant) -> i128 {
            self.0.offset_nanoseconds(instant)
        }
        fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
            self.0.visit_offsets(visitor)
        }
        fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
            self.0.transition(instant, direction)
        }
    }
    let events = [OffsetTransition {
        epoch_seconds: 0,
        offset_seconds: 23 * 3600 + 1800,
    }];
    let zone = TransitionZone::new(-1800, &events, None).unwrap();
    let date = PlainDate::new(1970, 1, 1)
        .unwrap()
        .with_calendar(Calendar::Hebrew)
        .unwrap();
    let start = date.to_zoned_date_time(OwnedZone(zone), None).unwrap();
    assert_eq!(start.instant().epoch_nanoseconds(), 0);
    assert_eq!(start.calendar_id(), "hebrew");
    assert_eq!(start.local().unwrap().date().fields(), (1970, 1, 1));
    assert_eq!(start.local().unwrap().time().fields(), (23, 30, 0, 0));
    let midnight = date
        .to_zoned_date_time(OwnedZone(zone), Some(PlainTime::new(0, 0, 0, 0).unwrap()))
        .unwrap();
    assert_eq!(midnight.instant().epoch_nanoseconds(), 1_800_000_000_000);
    assert_eq!(midnight.calendar_id(), "hebrew");
    assert_eq!(midnight.local().unwrap().date().fields(), (1970, 1, 2));
}

#[test]
fn day_start_uses_nearest_local_after_overlapping_transitions() {
    use formatjs_temporal::{
        OffsetTransition, PlainDate, PlainTime, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let max_day = (MAX_EPOCH_NANOSECONDS / NANOSECONDS_PER_DAY) as i64;
    for day in [0, max_day - 2, max_day - 1, max_day] {
        let midnight = i128::from(day) * NANOSECONDS_PER_DAY;
        let seconds = (midnight / 1_000_000_000) as i64;
        let events = [
            OffsetTransition {
                epoch_seconds: seconds - 18_000,
                offset_seconds: -18_000,
            },
            OffsetTransition {
                epoch_seconds: seconds - 10_800,
                offset_seconds: 14_400,
            },
        ];
        let zone = TransitionZone::new(18_000, &events, None).unwrap();
        let date = PlainDate::from_epoch_day(day).unwrap();
        let explicit_midnight = date
            .to_zoned_date_time(zone, Some(PlainTime::new(0, 0, 0, 0).unwrap()))
            .unwrap();
        assert_eq!(
            explicit_midnight.instant().epoch_nanoseconds(),
            midnight - 6 * hour
        );
        let date_start = date.to_zoned_date_time(zone, None).unwrap();
        assert_eq!(
            date_start.instant().epoch_nanoseconds(),
            midnight - 3 * hour
        );
        let instant = Instant::from_epoch_nanoseconds(midnight - 2 * hour).unwrap();
        let zoned = ZonedDateTime::new(instant, zone);
        assert_eq!(
            zoned.start_of_day().unwrap().instant(),
            date_start.instant()
        );
    }
}

#[test]
fn minimum_day_start_uses_the_first_reachable_local_time() {
    use formatjs_temporal::{
        NamedTimeZone, OffsetTransition, PlainDate, TimeZoneRecord, TimeZoneRegistry,
        TransitionZone, ZonedDateTime, ZonedParseOptions,
    };
    let midnight = -MAX_EPOCH_NANOSECONDS;
    let seconds = (midnight / 1_000_000_000) as i64;
    let hour = 3_600_000_000_000;
    let jump = [OffsetTransition {
        epoch_seconds: seconds,
        offset_seconds: 3600,
    }];
    let overlap = [
        OffsetTransition {
            epoch_seconds: seconds + 3600,
            offset_seconds: -39_600,
        },
        OffsetTransition {
            epoch_seconds: seconds + 10_800,
            offset_seconds: -7200,
        },
    ];
    let date = PlainDate::new(-271821, 4, 20).unwrap();
    let name = "America/Denver";
    for (initial, events, expected) in [
        (0, &jump[..], midnight),
        (-3600, &overlap[..], midnight + 3 * hour),
    ] {
        let zone = TransitionZone::new(initial, events, None).unwrap();
        let start = date.to_zoned_date_time(zone, None).unwrap().instant();
        assert_eq!(start.epoch_nanoseconds(), expected);
        let later = Instant::from_epoch_nanoseconds(expected + hour).unwrap();
        let named = NamedTimeZone::new(name, zone).unwrap();
        assert_eq!(
            ZonedDateTime::new(later, named)
                .start_of_day()
                .unwrap()
                .instant(),
            start
        );
        let records = [TimeZoneRecord::new(name, zone).unwrap()];
        let registry = TimeZoneRegistry::new(&records).unwrap();
        let date_only = ZonedDateTime::parse(
            "-271821-04-20[America/Denver]",
            registry,
            ZonedParseOptions::default(),
        )
        .unwrap();
        assert_eq!(date_only.instant(), start);
    }
}

#[test]
fn minimum_day_start_rejects_an_earlier_raw_footer_candidate() {
    use formatjs_temporal::{
        Disambiguation, Error, FutureRule, PlainDate, TransitionRule, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let future = FutureRule::new(
        0,
        Some((
            18_000,
            // April 19 at 20:00 UTC in the minimum year, four hours before the limit.
            TransitionRule::Day {
                day: 108,
                seconds: 72_000,
            },
            TransitionRule::Day {
                day: 111,
                seconds: 18_000,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(0, &[], Some(future)).unwrap();
    let first_wall = IsoDateTime::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS + hour).unwrap();
    assert_eq!(
        ZonedDateTime::from_local(first_wall, zone, Disambiguation::Reject).unwrap_err(),
        Error::OutOfRange,
    );
    let limit = Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS).unwrap();
    let valid_later = ZonedDateTime::new(limit, zone);
    assert_eq!(valid_later.local().unwrap().time().fields(), (5, 0, 0, 0));
    let date = PlainDate::new(-271821, 4, 20).unwrap();
    assert_eq!(
        date.to_zoned_date_time(zone, None).unwrap_err(),
        Error::OutOfRange
    );
    assert_eq!(valid_later.start_of_day().unwrap_err(), Error::OutOfRange);
}

#[test]
fn maximum_day_start_checks_the_first_raw_candidate() {
    use formatjs_temporal::{
        Disambiguation, Error, FutureRule, OffsetTransition, PlainDate, PlainTime, TransitionZone,
        ZonedDateTime,
    };
    let midnight = MAX_EPOCH_NANOSECONDS;
    let seconds = (midnight / 1_000_000_000) as i64;
    let hour = 3_600_000_000_000;
    let date = PlainDate::new(275760, 9, 13).unwrap();
    let jump = [OffsetTransition {
        epoch_seconds: seconds,
        offset_seconds: 3600,
    }];
    let zone = TransitionZone::new(-3600, &jump, None).unwrap();
    assert_eq!(
        date.to_zoned_date_time(zone, Some(PlainTime::new(0, 0, 0, 0).unwrap()))
            .unwrap_err(),
        Error::OutOfRange,
    );
    let start = date.to_zoned_date_time(zone, None).unwrap().instant();
    assert_eq!(start.epoch_nanoseconds(), midnight);
    let zoned = ZonedDateTime::new(Instant::from_epoch_nanoseconds(midnight).unwrap(), zone);
    assert_eq!(zoned.start_of_day().unwrap().instant(), start);

    let overlap = [
        OffsetTransition {
            epoch_seconds: seconds - 18_000,
            offset_seconds: -18_000,
        },
        OffsetTransition {
            epoch_seconds: seconds - 10_800,
            offset_seconds: 14_400,
        },
        OffsetTransition {
            epoch_seconds: seconds,
            offset_seconds: 14_400,
        },
    ];
    let footer = FutureRule::new(0, None).unwrap();
    let zone = TransitionZone::new(18_000, &overlap, Some(footer)).unwrap();
    // The footer starts at MAX+1s and projects before the in-range 01:00 clock.
    let first_wall = IsoDateTime::from_epoch_nanoseconds(midnight + 1_000_000_000).unwrap();
    assert_eq!(
        ZonedDateTime::from_local(first_wall, zone, Disambiguation::Reject).unwrap_err(),
        Error::OutOfRange,
    );
    let later = Instant::from_epoch_nanoseconds(midnight - 3 * hour).unwrap();
    let zoned = ZonedDateTime::new(later, zone);
    assert_eq!(zoned.local().unwrap().time().fields(), (1, 0, 0, 0));
    assert_eq!(
        date.to_zoned_date_time(zone, None).unwrap_err(),
        Error::OutOfRange
    );
    assert_eq!(zoned.start_of_day().unwrap_err(), Error::OutOfRange);
}

#[test]
fn date_zoned_conversion_handles_skipped_dates_and_instant_bounds() {
    use formatjs_temporal::{FixedOffset, PlainDate, PlainTime};
    let zones = iana_registry();
    let skipped = PlainDate::new(2011, 12, 30)
        .unwrap()
        .to_zoned_date_time(zones.resolve("Pacific/Apia").unwrap(), None)
        .unwrap();
    assert_eq!(skipped.instant(), "2011-12-30T10:00Z".parse().unwrap());
    assert_eq!(skipped.local().unwrap().date().fields(), (2011, 12, 31));
    for (year, month, day, hour, offset, expected) in [
        (-271821, 4, 19, 1, -23, -MAX_EPOCH_NANOSECONDS),
        (275760, 9, 13, 23, 23, MAX_EPOCH_NANOSECONDS),
    ] {
        let date = PlainDate::new(year, month, day).unwrap();
        let zone = FixedOffset::new(offset * 3_600_000_000_000).unwrap();
        assert_eq!(
            date.to_zoned_date_time(zone, Some(PlainTime::new(hour, 0, 0, 0).unwrap()))
                .unwrap()
                .instant()
                .epoch_nanoseconds(),
            expected
        );
    }
    for day in [-100_000_001, 100_000_000] {
        let date = PlainDate::from_epoch_day(day).unwrap();
        let utc = FixedOffset::new(0).unwrap();
        let midnight = Some(PlainTime::new(0, 0, 0, 0).unwrap());
        if day < 0 {
            assert!(date.to_zoned_date_time(utc, None).is_err());
            assert!(date.to_zoned_date_time(utc, midnight).is_err());
        } else {
            for time in [None, midnight] {
                assert_eq!(
                    date.to_zoned_date_time(utc, time)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    MAX_EPOCH_NANOSECONDS
                );
            }
        }
    }
}

#[test]
fn zoned_replacements_preserve_calendar_and_resolve_clock_gaps_and_folds() {
    use formatjs_temporal::{FixedOffset, PlainTime, ZonedDateTime, calendar::Calendar};
    let zones = iana_registry();
    let original = ZonedDateTime::new(
        "2020-02-28T23:30:45.123456789Z".parse().unwrap(),
        zones.resolve("America/New_York").unwrap(),
    )
    .with_calendar(Calendar::Hebrew);
    let shifted = original.with_time_zone(FixedOffset::new(14 * 3_600_000_000_000).unwrap());
    assert_eq!(shifted.instant(), original.instant());
    assert_eq!(shifted.calendar_id(), "hebrew");
    assert_eq!(shifted.local().unwrap().date().fields(), (2020, 2, 29));
    assert_eq!(
        shifted.local().unwrap().time().nanoseconds(),
        48_645_123_456_789
    );
    assert_eq!(original.local().unwrap().date().fields(), (2020, 2, 28));
    for (input, hour, expected) in [
        ("2020-11-01T06:45Z", 1, "2020-11-01T05:30:00.000000123Z"),
        ("2020-03-08T12:00Z", 2, "2020-03-08T07:30:00.000000123Z"),
    ] {
        let value = ZonedDateTime::new(
            input.parse().unwrap(),
            zones.resolve("America/New_York").unwrap(),
        )
        .with_calendar(Calendar::Hebrew);
        let changed = value
            .with_time(Some(PlainTime::new(hour, 30, 0, 123).unwrap()))
            .unwrap();
        assert_eq!(changed.instant(), expected.parse().unwrap());
        assert_eq!(changed.calendar_id(), "hebrew");
        assert_eq!(value.instant(), input.parse().unwrap());
    }
}

#[test]
fn omitted_zoned_time_uses_first_instant_instead_of_shifted_midnight() {
    use formatjs_temporal::{OffsetTransition, PlainTime, TransitionZone, ZonedDateTime};
    let events = [OffsetTransition {
        epoch_seconds: 0,
        offset_seconds: 3600,
    }];
    let zone = TransitionZone::new(-3600, &events, None).unwrap();
    let value = ZonedDateTime::new("1970-01-01T12:00Z".parse().unwrap(), zone);
    assert_eq!(
        value.with_time(None).unwrap().instant().epoch_nanoseconds(),
        0
    );
    assert_eq!(
        value
            .with_time(Some(PlainTime::new(0, 0, 0, 0).unwrap()))
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        3_600_000_000_000
    );
    for instant in [-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS] {
        let original = ZonedDateTime::new(Instant::from_epoch_nanoseconds(instant).unwrap(), zone);
        let shifted = original.with_time_zone(formatjs_temporal::FixedOffset::new(0).unwrap());
        assert_eq!(shifted.instant().epoch_nanoseconds(), instant);
    }
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        formatjs_temporal::FixedOffset::new(0).unwrap(),
    );
    assert!(
        maximum
            .with_time(Some(PlainTime::new(23, 59, 59, 999_999_999).unwrap()))
            .is_err()
    );
}

#[test]
fn short_date_updates_drop_reference_fields_and_preserve_extended_bounds() {
    use formatjs_temporal::{DateFields, Overflow, PlainMonthDay, PlainYearMonth};
    let year_month = PlainYearMonth::new(2024, 2, 29).unwrap();
    let changed = year_month
        .with_fields(
            DateFields {
                month: Some(3),
                day: Some(0),
                ..DateFields::default()
            },
            Overflow::Reject,
        )
        .unwrap();
    assert_eq!(changed.fields(), (2024, 3, 1));
    assert!(
        year_month
            .with_fields(
                DateFields {
                    day: Some(1),
                    ..DateFields::default()
                },
                Overflow::Constrain
            )
            .is_err()
    );
    for (year, month, reference) in [(-271821, 4, 1), (275760, 9, 30)] {
        assert_eq!(
            PlainYearMonth::new(year, month, reference)
                .unwrap()
                .with_fields(
                    DateFields {
                        year: Some(year),
                        ..DateFields::default()
                    },
                    Overflow::Reject
                )
                .unwrap()
                .fields(),
            (year, month, 1)
        );
    }
    let month_day = PlainMonthDay::new(2, 28, 1973).unwrap();
    assert_eq!(
        month_day
            .with_fields(
                DateFields {
                    day: Some(29),
                    ..DateFields::default()
                },
                Overflow::Reject
            )
            .unwrap()
            .fields(),
        (2, 29, 1972)
    );
    let nonleap = DateFields {
        year: Some(2023),
        day: Some(29),
        ..DateFields::default()
    };
    assert!(month_day.with_fields(nonleap, Overflow::Reject).is_err());
    assert_eq!(
        month_day
            .with_fields(nonleap, Overflow::Constrain)
            .unwrap()
            .fields(),
        (2, 28, 1972)
    );
    assert!(
        month_day
            .with_fields(DateFields::default(), Overflow::Constrain)
            .is_err()
    );
}

#[test]
fn partial_dates_and_datetimes_constrain_without_carrying_clock_units() {
    use formatjs_temporal::{
        DateFields, DateTimeFields, Overflow, PlainDate, PlainDateTime, TimeFields,
        calendar::Calendar,
    };
    let january = PlainDate::new(2024, 1, 31).unwrap();
    let february = DateFields {
        month: Some(2),
        ..DateFields::default()
    };
    assert_eq!(
        january
            .with_fields(february, Overflow::Constrain)
            .unwrap()
            .fields(),
        (2024, 2, 29)
    );
    assert!(january.with_fields(february, Overflow::Reject).is_err());
    for fields in [
        DateFields::default(),
        DateFields {
            day: Some(0),
            ..DateFields::default()
        },
        DateFields {
            era: Some("ce"),
            ..DateFields::default()
        },
    ] {
        assert!(january.with_fields(fields, Overflow::Constrain).is_err());
    }
    assert!(
        PlainDate::from_epoch_day(-100_000_001)
            .unwrap()
            .with_fields(
                DateFields {
                    day: Some(1),
                    ..DateFields::default()
                },
                Overflow::Constrain
            )
            .is_err()
    );
    let original = "2024-01-31T12:34:56.123456789"
        .parse::<PlainDateTime>()
        .unwrap();
    let update = DateTimeFields {
        date: february,
        time: TimeFields {
            hour: Some(99),
            millisecond: Some(7),
            ..TimeFields::default()
        },
    };
    assert_eq!(
        original
            .with_fields(update, Overflow::Constrain)
            .unwrap()
            .to_string(),
        "2024-02-29T23:34:56.007456789"
    );
    assert!(original.with_fields(update, Overflow::Reject).is_err());
    assert!(
        original
            .with_fields(DateTimeFields::default(), Overflow::Constrain)
            .is_err()
    );
    assert_eq!(
        original
            .with_fields(
                DateTimeFields {
                    time: TimeFields {
                        minute: Some(1),
                        ..TimeFields::default()
                    },
                    ..DateTimeFields::default()
                },
                Overflow::Reject
            )
            .unwrap()
            .to_string(),
        "2024-01-31T12:01:56.123456789"
    );
    assert_eq!(
        original
            .with_fields(
                DateTimeFields {
                    date: DateFields {
                        day: Some(1),
                        ..DateFields::default()
                    },
                    ..DateTimeFields::default()
                },
                Overflow::Reject
            )
            .unwrap()
            .to_string(),
        "2024-01-01T12:34:56.123456789"
    );
    let midnight = PlainDateTime::from_calendar_fields(
        Calendar::Iso8601,
        DateTimeFields {
            date: DateFields {
                year: Some(2024),
                month: Some(2),
                day: Some(29),
                ..DateFields::default()
            },
            ..DateTimeFields::default()
        },
        Overflow::Reject,
    )
    .unwrap();
    assert_eq!(midnight.to_string(), "2024-02-29T00:00:00");
    assert!(
        midnight
            .with_fields(
                DateTimeFields {
                    date: DateFields {
                        year: Some(275760),
                        month: Some(9),
                        day: Some(14),
                        ..DateFields::default()
                    },
                    ..DateTimeFields::default()
                },
                Overflow::Reject
            )
            .is_err()
    );
}

#[test]
fn partial_clock_fields_preserve_fractional_units_and_regulate_before_combining() {
    use formatjs_temporal::{Error, Overflow, PlainTime, TimeFields};
    let original = PlainTime::new(12, 34, 56, 789_123_456).unwrap();
    let changed = original
        .with_fields(
            TimeFields {
                millisecond: Some(5),
                nanosecond: Some(7),
                ..TimeFields::default()
            },
            Overflow::Reject,
        )
        .unwrap();
    assert_eq!(changed.to_string(), "12:34:56.005123007");
    assert_eq!(original.to_string(), "12:34:56.789123456");
    let fields = TimeFields {
        hour: Some(i128::MAX),
        minute: Some(i128::MIN),
        second: Some(60),
        millisecond: Some(1000),
        microsecond: Some(-1),
        nanosecond: Some(i128::MAX),
    };
    assert_eq!(
        original
            .with_fields(fields, Overflow::Constrain)
            .unwrap()
            .to_string(),
        "23:00:59.999000999"
    );
    assert_eq!(
        original.with_fields(fields, Overflow::Reject),
        Err(Error::InvalidDateTime)
    );
    assert_eq!(
        original.with_fields(TimeFields::default(), Overflow::Constrain),
        Err(Error::InvalidDateTime)
    );
    assert_eq!(
        PlainTime::from_fields(
            TimeFields {
                minute: Some(90),
                ..TimeFields::default()
            },
            Overflow::Constrain
        )
        .unwrap()
        .to_string(),
        "00:59:00"
    );
}

#[test]
fn clock_field_updates_match_independent_icu_epoch_times() {
    use formatjs_temporal::{Overflow, PlainTime, TimeFields};
    let original = PlainTime::new(23, 59, 58, 999_888_777).unwrap();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ISO"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<i128> = line
            .split('\t')
            .map(|value| value.parse().unwrap())
            .collect();
        let value = original
            .with_fields(
                TimeFields {
                    hour: Some(fields[4]),
                    minute: Some(fields[5]),
                    second: Some(fields[6]),
                    millisecond: Some(fields[7]),
                    ..TimeFields::default()
                },
                Overflow::Reject,
            )
            .unwrap();
        assert_eq!(
            value.nanoseconds(),
            fields[0].rem_euclid(86_400_000) * 1_000_000 + 888_777,
            "{line}"
        );
        count += 1;
    }
    assert_eq!(count, 25269);
}

#[test]
fn partial_duration_fields_keep_unbalanced_units_and_validate_new_sign_and_bounds() {
    use formatjs_temporal::{Duration, DurationFields, Error};
    let original = Duration::from_fields(DurationFields {
        hours: Some(25),
        milliseconds: Some(1001),
        ..DurationFields::default()
    })
    .unwrap();
    assert_eq!(
        original
            .with_fields(DurationFields {
                minutes: Some(90),
                ..DurationFields::default()
            })
            .unwrap()
            .to_string(),
        "PT25H90M1.001S"
    );
    assert_eq!(original.to_string(), "PT25H1.001S");
    assert_eq!(
        original.with_fields(DurationFields {
            hours: Some(-1),
            ..DurationFields::default()
        }),
        Err(Error::InvalidDuration)
    );
    assert_eq!(
        original
            .with_fields(DurationFields {
                hours: Some(-1),
                milliseconds: Some(0),
                ..DurationFields::default()
            })
            .unwrap()
            .to_string(),
        "-PT1H"
    );
    assert_eq!(
        original.with_fields(DurationFields {
            years: Some(1 << 32),
            ..DurationFields::default()
        }),
        Err(Error::InvalidDuration)
    );
    assert_eq!(
        original.with_fields(DurationFields::default()),
        Err(Error::InvalidDuration)
    );
    assert_eq!(
        Duration::from_fields(DurationFields {
            seconds: Some(1 << 53),
            ..DurationFields::default()
        }),
        Err(Error::InvalidDuration)
    );
    assert_eq!(
        Duration::from_fields(DurationFields {
            nanoseconds: Some(0),
            ..DurationFields::default()
        })
        .unwrap()
        .sign(),
        0
    );
}

#[test]
fn calendar_annotations_retain_iso_reference_fields() {
    use formatjs_temporal::{
        CalendarName, PlainDate, PlainDateTime, PlainMonthDay, PlainYearMonth, Precision,
        RoundingMode,
    };
    let date = "2020-02-29".parse::<PlainDate>().unwrap();
    let time = "2020-02-29T23:59:59.999".parse::<PlainDateTime>().unwrap();
    let year_month = PlainYearMonth::new(2020, 2, 29).unwrap();
    let month_day = PlainMonthDay::new(2, 29, 2000).unwrap();
    for (mode, suffix, full) in [
        (CalendarName::Auto, "", false),
        (CalendarName::Never, "", false),
        (CalendarName::Always, "[u-ca=iso8601]", true),
        (CalendarName::Critical, "[!u-ca=iso8601]", true),
    ] {
        assert_eq!(date.format(mode).to_string(), format!("2020-02-29{suffix}"));
        assert_eq!(
            time.format(Precision::Digits(0), RoundingMode::Ceil)
                .unwrap()
                .with_calendar_name(mode)
                .to_string(),
            format!("2020-03-01T00:00:00{suffix}")
        );
        assert_eq!(
            year_month.format(mode).to_string(),
            format!("{}{suffix}", if full { "2020-02-29" } else { "2020-02" })
        );
        assert_eq!(
            month_day.format(mode).to_string(),
            format!("{}{suffix}", if full { "2000-02-29" } else { "02-29" })
        );
    }
}

#[test]
fn unrounded_year_month_difference_needs_no_out_of_range_anchor() {
    use formatjs_temporal::{PlainYearMonth, RoundingMode, YearMonthUnit};
    let start = PlainYearMonth::new(1970, 1, 1).unwrap();
    let end = PlainYearMonth::new(275760, 9, 30).unwrap();
    for largest in [YearMonthUnit::Year, YearMonthUnit::Month] {
        let until = start
            .until(end, largest, YearMonthUnit::Month, 1, RoundingMode::Trunc)
            .unwrap();
        assert_eq!(until.fields()[0] * 12 + until.fields()[1], 3285488);
        assert_eq!(
            start
                .since(end, largest, YearMonthUnit::Month, 1, RoundingMode::Trunc)
                .unwrap(),
            until.negated()
        );
        assert!(
            start
                .until(
                    PlainYearMonth::new(-271821, 4, 19).unwrap(),
                    largest,
                    YearMonthUnit::Month,
                    1,
                    RoundingMode::Trunc
                )
                .is_err()
        );
    }
}

#[test]
fn independent_icu_short_dates() {
    use formatjs_temporal::{Duration, Overflow, PlainMonthDay, PlainYearMonth, YearMonthUnit};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_SHORT_DATES"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let number = |index: usize| fields[index].parse::<i128>().unwrap();
        match fields[0] {
            "ym" => {
                let start = PlainYearMonth::new(number(1) as i32, number(2) as u8, number(3) as u8)
                    .unwrap();
                let duration =
                    Duration::new([number(4), number(5), 0, 0, 0, 0, 0, 0, 0, 0]).unwrap();
                let result = start.checked_add(duration, Overflow::Constrain);
                if fields[10] == "false" {
                    assert!(result.is_err(), "{line}");
                } else {
                    let result = result.unwrap();
                    assert_eq!(
                        result.fields(),
                        (number(6) as i32, number(7) as u8, 1),
                        "{line}"
                    );
                    assert_eq!(result.days_in_month().unwrap(), number(8) as u8, "{line}");
                    assert_eq!(result.days_in_year().unwrap(), number(9) as u16, "{line}");
                }
            }
            "md" => {
                let start =
                    PlainMonthDay::new(number(1) as u8, number(2) as u8, number(3) as i32).unwrap();
                let result = start.to_plain_date(number(4) as i32, Overflow::Constrain);
                if fields[6] == "false" {
                    assert!(result.is_err(), "{line}");
                } else {
                    assert_eq!(
                        result.unwrap().fields(),
                        (number(4) as i32, number(1) as u8, number(5) as u8),
                        "{line}"
                    );
                }
            }
            _ => {
                let start = PlainYearMonth::new(number(1) as i32, number(2) as u8, 1).unwrap();
                let end = PlainYearMonth::new(number(3) as i32, number(4) as u8, 1).unwrap();
                let unit = if fields[5] == "year" {
                    YearMonthUnit::Year
                } else {
                    YearMonthUnit::Month
                };
                let mode = fields[7].parse().unwrap();
                let until = start
                    .until(end, unit, unit, number(6) as u32, mode)
                    .unwrap()
                    .fields();
                let since = start
                    .since(end, unit, unit, number(6) as u32, mode)
                    .unwrap()
                    .fields();
                assert_eq!(until[0] * 12 + until[1], number(8), "{line}");
                assert_eq!(since[0] * 12 + since[1], number(9), "{line}");
            }
        }
        count += 1;
    }
    assert!(count > 2000);
    println!("{count} independent ICU short-date cases");
}

#[test]
fn short_date_reference_fields_and_parser_limits() {
    use formatjs_temporal::{Overflow, PlainMonthDay, PlainYearMonth};
    for text in ["+275760-09-14[u-ca=gregory]", "-271821-04-18[u-ca=gregory]"] {
        assert!(text.parse::<PlainMonthDay>().is_err(), "{text}");
    }
    for text in ["+275760-09-13[u-ca=gregory]", "-271821-04-19[u-ca=gregory]"] {
        assert!(text.parse::<PlainMonthDay>().is_ok(), "{text}");
    }
    assert!(PlainYearMonth::new(-271821, 4, 1).is_ok());
    assert!(PlainYearMonth::new(-271821, 3, 31).is_err());
    assert!(PlainYearMonth::new(275760, 9, 30).is_ok());
    assert!(PlainYearMonth::new(275760, 10, 1).is_err());
    assert_eq!(
        "2020-02-29T12:34+05:30"
            .parse::<PlainYearMonth>()
            .unwrap()
            .fields(),
        (2020, 2, 1)
    );
    assert_eq!(
        "+999999-10-01".parse::<PlainMonthDay>().unwrap().fields(),
        (10, 1, 1972)
    );
    assert_eq!(
        "-999999-10-01".parse::<PlainMonthDay>().unwrap().fields(),
        (10, 1, 1972)
    );
    assert_eq!(
        "--0229"
            .parse::<PlainMonthDay>()
            .unwrap()
            .to_plain_date(1900, Overflow::Constrain)
            .unwrap()
            .to_string(),
        "1900-02-28"
    );
    assert!("2019-02-29".parse::<PlainMonthDay>().is_err());
    assert_ne!(
        PlainYearMonth::new(2020, 2, 2).unwrap(),
        PlainYearMonth::new(2020, 2, 1).unwrap()
    );
    assert_ne!(
        PlainMonthDay::new(2, 29, 2000).unwrap(),
        PlainMonthDay::new(2, 29, 1972).unwrap()
    );
}

#[test]
fn independent_icu_date_arithmetic() {
    use formatjs_temporal::{Duration, Overflow, PlainDateTime};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_DATE_ARITHMETIC"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let values: Vec<i128> = line.split('\t').map(|x| x.parse().unwrap()).collect();
        let input = PlainDateTime::from_epoch_nanoseconds(values[0]).unwrap();
        let duration = Duration::new([
            values[1], values[2], values[3], values[4], 0, 0, 0, 0, 0, values[5],
        ])
        .unwrap();
        let actual = input.checked_add(duration, Overflow::Constrain);
        let limit = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
        if values[6] <= -limit || values[6] >= limit {
            assert!(actual.is_err(), "{line}");
        } else {
            assert_eq!(actual.unwrap().epoch_nanoseconds(), values[6], "{line}");
        }
        count += 1;
    }
    assert_eq!(count, 840);
}

#[test]
fn iso_date_types_parse_round_and_validate() {
    use formatjs_temporal::{Overflow, PlainDate, PlainDateTime, RoundingMode, TimeUnit};
    assert_eq!(
        "2020-02-29"
            .parse::<PlainDate>()
            .unwrap()
            .checked_add("P1Y1M".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .to_string(),
        "2021-03-29"
    );
    let value: PlainDateTime = "2020-02-29T23:59:59.999999999+05:30".parse().unwrap();
    assert_eq!(
        value
            .round(TimeUnit::Second, 1, RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "2020-03-01T00:00:00"
    );
    assert_eq!(
        "2020-01-01T01:01"
            .parse::<PlainDateTime>()
            .unwrap()
            .round(TimeUnit::Hour, 1, RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "2020-01-01T01:00:00"
    );
    for text in ["2020-02-30", "-000000-01-01T12", "2020-01-01T12Z"] {
        assert!(text.parse::<PlainDateTime>().is_err(), "{text}");
    }
    assert!("-271821-04-19".parse::<PlainDate>().is_ok());
    assert!("-271821-04-19".parse::<PlainDateTime>().is_err());
}

#[test]
fn independent_icu_clock_rounding() {
    use formatjs_temporal::PlainTime;
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIME"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let value = PlainTime::from_nanoseconds(fields[0].parse().unwrap()).unwrap();
        let rounded = value
            .round(
                fields[1].parse().unwrap(),
                fields[2].parse().unwrap(),
                fields[3].parse().unwrap(),
            )
            .unwrap();
        assert_eq!(
            rounded.nanoseconds(),
            fields[4].parse::<i128>().unwrap(),
            "{line}"
        );
        count += 1;
    }
    assert!(count > 3000);
    println!("{count} independent ICU field-relative clock rounding cases");
}

#[test]
fn plain_time_parsing_wrapping_and_signed_differences() {
    use formatjs_temporal::{PlainTime, Precision, RoundingMode, TimeUnit};
    let strings: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_TIME_STRINGS"))).unwrap();
    for case in strings["valid"].as_array().unwrap() {
        let text = case[0].as_str().unwrap();
        assert_eq!(
            text.parse::<PlainTime>().unwrap().to_string(),
            case[1].as_str().unwrap(),
            "{text}"
        );
    }
    for case in strings["invalid"].as_array().unwrap() {
        let text = case.as_str().unwrap();
        assert!(text.parse::<PlainTime>().is_err(), "{text}");
    }
    let midnight = PlainTime::new(0, 0, 0, 0).unwrap();
    let last: PlainTime = "23:59:59.999999999".parse().unwrap();
    assert_eq!(
        last.format(Precision::Digits(0), RoundingMode::Ceil)
            .unwrap()
            .to_string(),
        "00:00:00"
    );
    assert_eq!(
        midnight
            .format(Precision::Digits(9), RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "00:00:00.000000000"
    );
    assert_eq!(
        last.format(Precision::Minute, RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "23:59"
    );
    assert_eq!(
        midnight
            .checked_subtract("P1Y2M3W4DT0.000000001S".parse().unwrap())
            .unwrap()
            .to_string(),
        "23:59:59.999999999"
    );
    let end = "12:18".parse().unwrap();
    let start: PlainTime = "01:06".parse().unwrap();
    assert_eq!(
        start
            .until(
                end,
                TimeUnit::Hour,
                TimeUnit::Minute,
                12,
                RoundingMode::HalfEven
            )
            .unwrap()
            .to_string(),
        "PT11H12M"
    );
    assert_eq!(
        start
            .since(
                end,
                TimeUnit::Hour,
                TimeUnit::Minute,
                12,
                RoundingMode::HalfEven
            )
            .unwrap()
            .to_string(),
        "-PT11H12M"
    );
    assert!(
        start
            .round(TimeUnit::Minute, 60, RoundingMode::Trunc)
            .is_err()
    );
}

#[test]
fn exact_range_and_negative_millisecond_floor() {
    for value in [-MAX_EPOCH_NANOSECONDS, -1, 0, 1, MAX_EPOCH_NANOSECONDS] {
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(instant.epoch_nanoseconds(), value);
        assert_eq!(
            instant.epoch_milliseconds(),
            value.div_euclid(1_000_000) as i64
        );
        assert_eq!(instant.to_iso().to_epoch_nanoseconds().unwrap(), value);
    }
    for value in [
        i128::MIN,
        -MAX_EPOCH_NANOSECONDS - 1,
        MAX_EPOCH_NANOSECONDS + 1,
        i128::MAX,
    ] {
        assert!(Instant::from_epoch_nanoseconds(value).is_err());
    }
    assert!(Instant::from_epoch_milliseconds(i64::MAX).is_err());
    assert_eq!(
        Instant::from_epoch_milliseconds(-1)
            .unwrap()
            .epoch_nanoseconds(),
        -1_000_000
    );
    for value in [
        -MAX_EPOCH_NANOSECONDS - NANOSECONDS_PER_DAY,
        MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY,
        i128::MIN,
        i128::MAX,
    ] {
        assert!(IsoDateTime::from_epoch_nanoseconds(value).is_err());
    }
}

#[test]
fn parser_cases_shared_with_typescript() {
    let fixtures: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_STRINGS"))).unwrap();
    for case in fixtures["valid"].as_array().unwrap() {
        let input = case["input"].as_str().unwrap();
        let expected: i128 = case["epochNanoseconds"].as_str().unwrap().parse().unwrap();
        assert_eq!(
            input.parse::<Instant>().unwrap().epoch_nanoseconds(),
            expected,
            "{input}"
        );
    }
    for case in fixtures["invalid"].as_array().unwrap() {
        let input = case.as_str().unwrap();
        assert!(input.parse::<Instant>().is_err(), "{input}");
    }
}

#[test]
fn independent_icu_gregorian_fields_across_full_range() {
    let mut count = 0;
    let mut date_count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ISO"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let values: Vec<i64> = line
            .split('\t')
            .map(|value| value.parse().unwrap())
            .collect();
        let expected = IsoDateTime {
            year: values[1] as i32,
            month: values[2] as u8,
            day: values[3] as u8,
            hour: values[4] as u8,
            minute: values[5] as u8,
            second: values[6] as u8,
            nanosecond: values[7] as u32 * 1_000_000,
        };
        let epoch = i128::from(values[0]) * 1_000_000;
        assert_eq!(
            IsoDateTime::from_epoch_nanoseconds(epoch).unwrap(),
            expected,
            "{line}"
        );
        assert_eq!(expected.to_epoch_nanoseconds().unwrap(), epoch, "{line}");
        let instant = Instant::from_epoch_milliseconds(values[0]);
        if (-MAX_EPOCH_NANOSECONDS..=MAX_EPOCH_NANOSECONDS).contains(&epoch) {
            assert_eq!(instant.unwrap().to_iso(), expected, "{line}");
            date_count += 1;
        } else {
            assert!(instant.is_err(), "{line}");
        }
        count += 1;
    }
    assert!(count > 25000);
    assert_eq!(date_count, 25265);
    println!("{count} independent ICU Gregorian samples, both directions");
}

#[test]
fn independent_icu_rounding_all_modes_and_epoch_signs() {
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ROUNDING"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<_> = line.split('\t').collect();
        let instant = Instant::from_epoch_nanoseconds(fields[0].parse().unwrap()).unwrap();
        let unit = fields[1].parse().unwrap();
        let increment = fields[2].parse().unwrap();
        let mode = fields[3].parse().unwrap();
        let expected: i128 = fields[4].parse().unwrap();
        assert_eq!(
            instant
                .round(unit, increment, mode)
                .unwrap()
                .epoch_nanoseconds(),
            expected,
            "{line}"
        );
        count += 1;
    }
    assert!(count > 1500);
    println!("{count} independent ICU decimal rounding cases");
}

#[test]
fn formatting_precision_offsets_and_range_edges() {
    use formatjs_temporal::{Precision, RoundingMode, TimeUnit};
    for value in [-MAX_EPOCH_NANOSECONDS, -1, 0, 1, MAX_EPOCH_NANOSECONDS] {
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(instant.to_string().parse::<Instant>().unwrap(), instant);
    }
    let instant = Instant::from_epoch_nanoseconds(-1).unwrap();
    assert_eq!(instant.to_string(), "1969-12-31T23:59:59.999999999Z");
    assert_eq!(
        instant
            .format(Precision::Digits(3), RoundingMode::Trunc, None)
            .unwrap()
            .to_string(),
        "1969-12-31T23:59:59.999Z"
    );
    assert_eq!(
        instant
            .format(
                Precision::Minute,
                RoundingMode::Ceil,
                Some(3_600_000_000_000)
            )
            .unwrap()
            .to_string(),
        "1970-01-01T01:00+01:00"
    );
    assert_eq!(
        Instant::from_epoch_nanoseconds(0)
            .unwrap()
            .format(Precision::Auto, RoundingMode::Trunc, Some(-1_000_000_000))
            .unwrap()
            .to_string(),
        "1969-12-31T23:59:59+00:00"
    );
    assert!(
        instant
            .format(Precision::Digits(10), RoundingMode::Trunc, None)
            .is_err()
    );
    for offset in [i64::MIN, -86_400_000_000_000, 86_400_000_000_000, i64::MAX] {
        assert!(
            instant
                .format(Precision::Auto, RoundingMode::Trunc, Some(offset))
                .is_err()
        );
    }
    for increment in [0, 7, 25, u32::MAX] {
        assert!(
            instant
                .round(TimeUnit::Hour, increment, RoundingMode::Trunc)
                .is_err()
        );
    }
}

#[test]
fn duration_fields_parser_float64_slots_and_instant_arithmetic() {
    use formatjs_temporal::{Duration, RoundingMode, TimeUnit};
    for text in [
        "P1Y2M3W4DT5H66M71.50040904S",
        "-PT1.000000001H",
        "PT0.000000001M",
        "PT60S",
        "-P1DT0.123456789S",
    ] {
        let value: Duration = text.parse().unwrap();
        assert_eq!(value.to_string().parse::<Duration>().unwrap(), value);
        assert_eq!(value.negated().negated(), value);
        assert!(value.abs().sign() >= 0);
    }
    for text in [
        "P",
        "PT",
        "P1DT",
        "P1H",
        "PT1.5H0M",
        "PT1.1234567890S",
        "P1Y\n",
        "P4294967296Y",
        "PT9007199254740992S",
    ] {
        assert!(text.parse::<Duration>().is_err(), "{text}");
    }
    let zero = Instant::from_epoch_nanoseconds(0).unwrap();
    let one = zero.checked_add("PT0.000000001S".parse().unwrap()).unwrap();
    assert_eq!(one.epoch_nanoseconds(), 1);
    assert_eq!(
        one.checked_subtract("PT0.000000001S".parse().unwrap())
            .unwrap(),
        zero
    );
    assert_eq!(
        zero.until(
            one,
            TimeUnit::Second,
            TimeUnit::Nanosecond,
            1,
            RoundingMode::Trunc
        )
        .unwrap()
        .to_string(),
        "PT0.000000001S"
    );
    assert!(zero.checked_add("P1D".parse().unwrap()).is_err());
    assert!(
        zero.until(
            one,
            TimeUnit::Second,
            TimeUnit::Minute,
            1,
            RoundingMode::Trunc
        )
        .is_err()
    );
    let lossy =
        Duration::from_time_nanoseconds(9_007_199_254_740_993, TimeUnit::Nanosecond).unwrap();
    assert_eq!(lossy.fields()[9], 9_007_199_254_740_992);
}

#[test]
fn independent_icu_signed_duration_rounding_and_totals() {
    use formatjs_temporal::{Duration, MAX_DURATION_NANOSECONDS, TimeUnit};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_DURATION"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<_> = line.split('\t').collect();
        let value: i128 = fields[1].parse().unwrap();
        let mut record = [0; 10];
        record[6] = value / 1_000_000_000;
        record[9] = value % 1_000_000_000;
        let duration = Duration::new(record).unwrap();
        if fields[0] == "total" {
            let actual = if fields[2] == "day" {
                duration.total_days().unwrap()
            } else {
                duration.total(fields[2].parse().unwrap()).unwrap()
            };
            let expected: f64 = fields[4].parse().unwrap();
            assert_eq!(actual.to_bits(), expected.to_bits(), "{line}");
        } else {
            let quantum = if fields[2] == "day" {
                NANOSECONDS_PER_DAY
            } else {
                fields[2].parse::<TimeUnit>().unwrap().nanoseconds()
            };
            let expected: i128 = fields[4].parse().unwrap();
            // Instant's typed difference accepts only valid time increments; use the shared signed core here.
            let actual = formatjs_temporal::round_duration_nanoseconds(
                value,
                quantum,
                fields[3].parse().unwrap(),
            );
            if expected.unsigned_abs() >= MAX_DURATION_NANOSECONDS as u128 {
                assert!(actual.is_err(), "{line}");
            } else {
                assert_eq!(actual.unwrap(), expected, "{line}");
            }
        }
        count += 1;
    }
    assert!(count > 3000);
    println!("{count} independent ICU signed duration rounding/total cases");
}

#[test]
fn duration_precision_preserves_unbalanced_units_and_rounds_signed_time() {
    use formatjs_temporal::{Duration, Precision, RoundingMode};
    let value: Duration = "P1Y2M3W4DT5H66M71.50040904S".parse().unwrap();
    assert_eq!(
        value
            .format(Precision::Digits(9), RoundingMode::Trunc)
            .unwrap()
            .to_string(),
        "P1Y2M3W4DT5H66M71.500409040S"
    );
    assert_eq!(
        value
            .format(Precision::Digits(0), RoundingMode::HalfExpand)
            .unwrap()
            .to_string(),
        "P1Y2M3W4DT6H7M12S"
    );
    let value: Duration = "-PT0.000000001S".parse().unwrap();
    assert_eq!(
        value
            .format(Precision::Digits(6), RoundingMode::Floor)
            .unwrap()
            .to_string(),
        "-PT0.000001S"
    );
    assert_eq!(
        value
            .format(Precision::Digits(6), RoundingMode::Ceil)
            .unwrap()
            .to_string(),
        "PT0.000000S"
    );
    assert!(
        value
            .format(Precision::Minute, RoundingMode::Trunc)
            .is_err()
    );
}

#[test]
fn independent_icu_zoned_fields_and_disambiguation() {
    use formatjs_temporal::{
        DateFields, DateTimeFields, Disambiguation, FixedOffset, OffsetOption, PlainTime,
        TimeFields, TimeZone, ZonedDateTime, ZonedFields, ZonedWithOptions, calendar::Calendar,
    };
    let zones = iana_registry();
    let mut count = 0;
    let mut transitions = 0;
    let mut previous: Option<(&str, i128, i128)> = None;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIMEZONE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let name = fields[0];
        let value = fields[1].parse::<i128>().unwrap() * 1_000_000;
        let offset = fields[2].parse::<i128>().unwrap() * 1_000_000_000;
        let Some(zone) = icu_zone(zones, name) else {
            continue;
        };
        let instant = Instant::from_epoch_nanoseconds(value).unwrap();
        assert_eq!(zone.offset_nanoseconds(instant), offset, "{line}");
        let zoned = ZonedDateTime::new(instant, zone);
        let replaced = ZonedDateTime::new(instant, FixedOffset::new(0).unwrap())
            .with_calendar(Calendar::Hebrew)
            .with_time_zone(zone);
        assert_eq!(replaced.instant(), instant, "zone replacement {line}");
        assert_eq!(replaced.calendar_id(), "hebrew");
        assert_eq!(
            replaced.local().unwrap().epoch_nanoseconds(),
            value + offset,
            "zone replacement {line}"
        );
        let updated = zoned
            .with_fields(
                ZonedFields {
                    date_time: DateTimeFields {
                        time: TimeFields {
                            nanosecond: Some(777),
                            ..TimeFields::default()
                        },
                        ..DateTimeFields::default()
                    },
                    ..ZonedFields::default()
                },
                ZonedWithOptions::default(),
            )
            .unwrap();
        assert_eq!(
            updated.instant().epoch_nanoseconds(),
            value + 777,
            "partial clock {line}"
        );
        assert_eq!(
            zoned.local().unwrap().epoch_nanoseconds(),
            value + offset,
            "{line}"
        );
        if let Some((old_name, old_value, old_offset)) = previous {
            if old_name == name && value == old_value + 1_000_000 && offset != old_offset {
                let local = value + (offset + old_offset) / 2 + 123;
                let fields = IsoDateTime::from_epoch_nanoseconds(local).unwrap();
                let earlier = local - offset.max(old_offset);
                let later = local - offset.min(old_offset);
                let source = [later, earlier]
                    .into_iter()
                    .map(|instant| {
                        ZonedDateTime::new(Instant::from_epoch_nanoseconds(instant).unwrap(), zone)
                            .with_calendar(Calendar::Hebrew)
                    })
                    .find(|candidate| {
                        candidate.local().unwrap().date().fields()
                            == (fields.year, fields.month, fields.day)
                    })
                    .unwrap_or_else(|| {
                        panic!("No replacement source on target civil date: {line}")
                    });
                let changed = source
                    .with_time(Some(
                        PlainTime::new(
                            fields.hour,
                            fields.minute,
                            fields.second,
                            fields.nanosecond,
                        )
                        .unwrap(),
                    ))
                    .unwrap();
                assert_eq!(
                    changed.instant().epoch_nanoseconds(),
                    if offset > old_offset { later } else { earlier },
                    "clock replacement {line}"
                );
                assert_eq!(changed.calendar_id(), "hebrew");
                let converted =
                    formatjs_temporal::PlainDate::new(fields.year, fields.month, fields.day)
                        .unwrap()
                        .with_calendar(Calendar::Hebrew)
                        .unwrap()
                        .to_zoned_date_time(
                            zone,
                            Some(
                                PlainTime::new(
                                    fields.hour,
                                    fields.minute,
                                    fields.second,
                                    fields.nanosecond,
                                )
                                .unwrap(),
                            ),
                        )
                        .unwrap();
                assert_eq!(
                    converted.instant().epoch_nanoseconds(),
                    if offset > old_offset { later } else { earlier },
                    "date conversion {line}"
                );
                assert_eq!(converted.calendar_id(), "hebrew");
                let update = ZonedFields {
                    date_time: DateTimeFields {
                        date: DateFields {
                            year: Some(fields.year),
                            month: Some(i32::from(fields.month)),
                            day: Some(i32::from(fields.day)),
                            ..DateFields::default()
                        },
                        time: TimeFields {
                            hour: Some(fields.hour.into()),
                            minute: Some(fields.minute.into()),
                            second: Some(fields.second.into()),
                            millisecond: Some((fields.nanosecond / 1_000_000).into()),
                            microsecond: Some((fields.nanosecond / 1000 % 1000).into()),
                            nanosecond: Some((fields.nanosecond % 1000).into()),
                        },
                    },
                    ..ZonedFields::default()
                };
                for (mode, expected) in [
                    (Disambiguation::Earlier, earlier),
                    (Disambiguation::Later, later),
                    (
                        Disambiguation::Compatible,
                        if offset > old_offset { later } else { earlier },
                    ),
                ] {
                    assert_eq!(
                        zoned
                            .with_fields(
                                update,
                                ZonedWithOptions {
                                    offset: OffsetOption::Ignore,
                                    disambiguation: mode,
                                    ..ZonedWithOptions::default()
                                }
                            )
                            .unwrap()
                            .instant()
                            .epoch_nanoseconds(),
                        expected,
                        "partial local {line}"
                    );
                }
                assert!(
                    zoned
                        .with_fields(
                            update,
                            ZonedWithOptions {
                                offset: OffsetOption::Ignore,
                                disambiguation: Disambiguation::Reject,
                                ..ZonedWithOptions::default()
                            }
                        )
                        .is_err(),
                    "partial local {line}"
                );
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Earlier)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    earlier,
                    "{line}"
                );
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Later)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    later,
                    "{line}"
                );
                assert_eq!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Compatible)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    if offset > old_offset { later } else { earlier },
                    "{line}"
                );
                assert!(
                    ZonedDateTime::from_local(fields, zone, Disambiguation::Reject).is_err(),
                    "{line}"
                );
                let start =
                    Instant::from_epoch_nanoseconds(value - NANOSECONDS_PER_DAY / 2).unwrap();
                let zoned = ZonedDateTime::new(start, zone);
                let day = formatjs_temporal::Duration::new([0, 0, 0, 1, 0, 0, 0, 0, 0, 0]).unwrap();
                let hours =
                    formatjs_temporal::Duration::new([0, 0, 0, 0, 24, 0, 0, 0, 0, 0]).unwrap();
                assert_eq!(
                    zoned
                        .checked_add(day, formatjs_temporal::Overflow::Constrain)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    start.epoch_nanoseconds() + NANOSECONDS_PER_DAY + old_offset - offset,
                    "{line}"
                );
                assert_eq!(
                    zoned
                        .checked_add(hours, formatjs_temporal::Overflow::Constrain)
                        .unwrap()
                        .instant()
                        .epoch_nanoseconds(),
                    start.epoch_nanoseconds() + NANOSECONDS_PER_DAY,
                    "{line}"
                );
                assert_eq!(
                    zoned.compare_durations(day, hours).unwrap(),
                    (old_offset - offset).cmp(&0),
                    "{line}"
                );
                transitions += 1;
            }
        }
        previous = Some((name, value, offset));
        count += 1;
    }
    assert_eq!(count, 17640);
    println!("{count} ICU named offset rows, {transitions} gap/fold controls");
    assert_eq!(transitions, 1900);
}

fn iana_registry() -> formatjs_temporal::TimeZoneRegistry<'static> {
    formatjs_temporal::TimeZoneRegistry::compiled()
}

fn icu_zone(
    registry: formatjs_temporal::TimeZoneRegistry<'static>,
    name: &str,
) -> Option<formatjs_temporal::ResolvedTimeZone<'static>> {
    // ICU also enumerates legacy short IDs such as ACT; these are not IANA IDs.
    if formatjs_temporal::named_time_zone_identifier(name).is_none() {
        assert_eq!(
            registry.resolve(name),
            Err(formatjs_temporal::Error::InvalidTimeZone),
            "{name}"
        );
        None
    } else {
        Some(
            registry
                .resolve(name)
                .unwrap_or_else(|error| panic!("{name}: {error:?}")),
        )
    }
}

#[test]
fn owned_iana_transitions_match_icu() {
    use formatjs_temporal::{TimeZone, TransitionDirection};
    let zones = iana_registry();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TRANSITIONS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let Some(zone) = icu_zone(zones, fields[0]) else {
            continue;
        };
        let instant =
            Instant::from_epoch_nanoseconds(fields[1].parse::<i128>().unwrap() * 1_000_000)
                .unwrap();
        for (index, direction) in [
            (2, TransitionDirection::Next),
            (3, TransitionDirection::Previous),
        ] {
            let expected = if fields[index] == "null" {
                None
            } else {
                Some(fields[index].parse::<i128>().unwrap() * 1_000_000)
            };
            let actual = zone.transition(instant, direction);
            assert_eq!(
                actual.map(Instant::epoch_nanoseconds),
                expected,
                "{line} {direction:?}"
            );
            if let Some(event) = actual {
                let adjacent = Instant::from_epoch_nanoseconds(
                    event.epoch_nanoseconds()
                        + if direction == TransitionDirection::Next {
                            -1
                        } else {
                            1
                        },
                )
                .unwrap();
                assert_eq!(zone.transition(adjacent, direction), Some(event), "{line}");
                let other = zone.transition(event, direction);
                assert!(
                    other.is_none_or(|value| if direction == TransitionDirection::Next {
                        value > event
                    } else {
                        value < event
                    }),
                    "{line}"
                );
            }
        }
        count += 1;
    }
    assert_eq!(count, 14058);
    eprintln!(
        "{count} owned IANA/ICU transition queries, both directions and nanosecond boundaries"
    );
}

#[test]
fn minimum_gap_uses_the_transition_at_the_instant_limit() {
    use formatjs_temporal::{
        Disambiguation, Error, NamedTimeZone, OffsetTransition, TimeZoneRecord, TimeZoneRegistry,
        TransitionZone, ZonedDateTime,
    };
    let minimum = -MAX_EPOCH_NANOSECONDS;
    let seconds = (minimum / 1_000_000_000) as i64;
    let hour = 3_600_000_000_000;
    let events = [
        OffsetTransition {
            epoch_seconds: seconds,
            offset_seconds: 14_400,
        },
        OffsetTransition {
            epoch_seconds: seconds + 3_600,
            offset_seconds: -7200,
        },
        OffsetTransition {
            epoch_seconds: seconds + 10_800,
            offset_seconds: 10_800,
        },
    ];
    let zone = TransitionZone::new(0, &events, None).unwrap();
    let gap = IsoDateTime::from_epoch_nanoseconds(minimum + 2 * hour).unwrap();
    for (mode, expected) in [
        (Disambiguation::Later, Ok(minimum + 5 * hour)),
        (Disambiguation::Compatible, Ok(minimum + 5 * hour)),
        (Disambiguation::Earlier, Err(Error::OutOfRange)),
        (Disambiguation::Reject, Err(Error::InvalidDateTime)),
    ] {
        assert_eq!(
            ZonedDateTime::from_local(gap, zone, mode)
                .map(|zoned| zoned.instant().epoch_nanoseconds()),
            expected,
            "{mode:?}"
        );
    }
    let name = "America/Denver";
    let tagged = NamedTimeZone::new(name, zone).unwrap();
    let records = [TimeZoneRecord::new(name, zone).unwrap()];
    let registered = TimeZoneRegistry::new(&records)
        .unwrap()
        .resolve(name)
        .unwrap();
    let later = Disambiguation::Later;
    let expected = Instant::from_epoch_nanoseconds(minimum + 5 * hour).unwrap();
    assert_eq!(
        ZonedDateTime::from_local(gap, tagged, later)
            .unwrap()
            .instant(),
        expected
    );
    assert_eq!(
        ZonedDateTime::from_local(gap, registered, later)
            .unwrap()
            .instant(),
        expected
    );
}

#[test]
fn local_gap_below_minimum_uses_the_minimum_transition() {
    use formatjs_temporal::{
        Disambiguation, Error, OffsetTransition, TransitionZone, ZonedDateTime,
    };
    let minimum = -MAX_EPOCH_NANOSECONDS;
    let seconds = (minimum / 1_000_000_000) as i64;
    let minute = 60_000_000_000;
    let events = [(0, -3), (1, -27), (3, -23), (15, 0)].map(|(when, offset)| OffsetTransition {
        epoch_seconds: seconds + when * 60,
        offset_seconds: offset * 60,
    });
    let zone = TransitionZone::new(-26 * 60, &events, None).unwrap();
    let resolve = |local, mode| {
        ZonedDateTime::from_local(
            IsoDateTime::from_epoch_nanoseconds(local).unwrap(),
            zone,
            mode,
        )
        .map(|value| value.instant().epoch_nanoseconds())
    };
    assert_eq!(
        resolve(minimum - 8 * minute - 1, Disambiguation::Reject),
        Ok(minimum + 15 * minute - 1)
    );
    assert_eq!(
        resolve(minimum - 3 * minute, Disambiguation::Reject),
        Ok(minimum)
    );
    for (mode, expected) in [
        (Disambiguation::Compatible, Ok(minimum + 15 * minute)),
        (Disambiguation::Later, Ok(minimum + 15 * minute)),
        (Disambiguation::Earlier, Ok(minimum + 2 * minute)),
        (Disambiguation::Reject, Err(Error::InvalidDateTime)),
    ] {
        assert_eq!(resolve(minimum - 5 * minute, mode), expected, "{mode:?}");
    }
}

#[test]
fn borrowed_zones_resolve_nearest_gap_boundaries() {
    use formatjs_temporal::{Disambiguation, OffsetTransition, TransitionZone, ZonedDateTime};
    let minute = 60_000_000_000i128;
    let limit_seconds = (MAX_EPOCH_NANOSECONDS / 1_000_000_000) as i64;
    for (initial, changes, local, earlier, later, origins) in [
        (
            0,
            [(0, 14_400), (3_600, 7_200)],
            90,
            -30,
            90,
            &[0, -limit_seconds + 3_600, limit_seconds - 7_200][..],
        ),
        (-7_200, [(-3_600, -14_400), (0, 0)], -90, -90, 30, &[0]),
        (0, [(0, 14_400), (21_600, 0)], 180, -60, 420, &[0]),
    ] {
        for &origin in origins {
            let changes = changes.map(|(epoch_seconds, offset_seconds)| OffsetTransition {
                epoch_seconds: origin + epoch_seconds,
                offset_seconds,
            });
            let zone = TransitionZone::new(initial, &changes, None).unwrap();
            let origin_ns = i128::from(origin) * 1_000_000_000;
            let fields = IsoDateTime::from_epoch_nanoseconds(origin_ns + local * minute).unwrap();
            assert!(ZonedDateTime::from_local(fields, zone, Disambiguation::Reject).is_err());
            for (mode, expected) in [
                (Disambiguation::Earlier, earlier),
                (Disambiguation::Later, later),
                (Disambiguation::Compatible, later),
            ] {
                let result = ZonedDateTime::from_local(fields, zone, mode).unwrap();
                assert_eq!(
                    result.instant().epoch_nanoseconds(),
                    origin_ns + expected * minute,
                    "{mode:?} at {local} minutes from {origin}"
                );
            }
        }
    }
}

#[test]
fn borrowed_and_registered_zones_reject_mixed_instant_bounds() {
    use formatjs_temporal::{
        Disambiguation, Error, FutureRule, NamedTimeZone, OffsetOption, OffsetTransition,
        PlainDate, TimeZoneRecord, TimeZoneRegistry, TransitionZone, ZonedDateTime,
        ZonedParseOptions,
    };
    let second = 1_000_000_000i128;
    let limit = (MAX_EPOCH_NANOSECONDS / second) as i64;
    let lower = [OffsetTransition {
        epoch_seconds: -limit,
        offset_seconds: 0,
    }];
    let upper = [OffsetTransition {
        epoch_seconds: limit,
        offset_seconds: 7200,
    }];
    let lower_zone = TransitionZone::new(7200, &lower, None).unwrap();
    let upper_zone =
        TransitionZone::new(7200, &upper, Some(FutureRule::new(0, None).unwrap())).unwrap();
    let records = [
        TimeZoneRecord::new("America/Denver", lower_zone).unwrap(),
        TimeZoneRecord::new("America/New_York", upper_zone).unwrap(),
    ];
    let registry = TimeZoneRegistry::new(&records).unwrap();
    let modes = [
        Disambiguation::Earlier,
        Disambiguation::Later,
        Disambiguation::Compatible,
        Disambiguation::Reject,
    ];
    for (zone, name, limit, source, used) in [
        (
            lower_zone,
            "America/Denver",
            -MAX_EPOCH_NANOSECONDS,
            "-271821-04-20T00:30+00:00[America/Denver]",
            -MAX_EPOCH_NANOSECONDS + 1800 * second,
        ),
        (
            upper_zone,
            "America/New_York",
            MAX_EPOCH_NANOSECONDS,
            "+275760-09-13T00:30+02:00[America/New_York]",
            MAX_EPOCH_NANOSECONDS - 5400 * second,
        ),
    ] {
        let local = IsoDateTime::from_epoch_nanoseconds(limit + 1800 * second).unwrap();
        let named = NamedTimeZone::new(name, zone).unwrap();
        for mode in modes {
            assert_eq!(
                ZonedDateTime::from_local(local, zone, mode).unwrap_err(),
                Error::OutOfRange,
                "borrowed {name} {mode:?}"
            );
            assert_eq!(
                ZonedDateTime::from_local(local, named, mode).unwrap_err(),
                Error::OutOfRange,
                "named {name} {mode:?}"
            );
        }
        for offset in [
            OffsetOption::Prefer,
            OffsetOption::Reject,
            OffsetOption::Ignore,
        ] {
            let options = ZonedParseOptions {
                offset,
                ..Default::default()
            };
            assert_eq!(
                ZonedDateTime::parse(source, registry, options).unwrap_err(),
                Error::OutOfRange,
                "registered {name} {offset:?}"
            );
        }
        let options = ZonedParseOptions {
            offset: OffsetOption::Use,
            ..Default::default()
        };
        let exact = ZonedDateTime::parse(source, registry, options).unwrap();
        assert_eq!(exact.instant().epoch_nanoseconds(), used);
    }
    assert_eq!(
        PlainDate::new(-271821, 4, 20)
            .unwrap()
            .to_zoned_date_time(lower_zone, None)
            .unwrap_err(),
        Error::OutOfRange
    );
}

#[test]
fn ignores_out_of_range_probes_with_inapplicable_offsets() {
    use formatjs_temporal::{Disambiguation, OffsetTransition, TransitionZone, ZonedDateTime};
    let second = 1_000_000_000i128;
    let limit = (MAX_EPOCH_NANOSECONDS / second) as i64;
    for (initial, lead, offset, local) in [
        (0, -limit + 3600, 7200, -limit + 1800),
        (-7200, limit - 3600, 0, limit - 1800),
    ] {
        let events = [OffsetTransition {
            epoch_seconds: lead,
            offset_seconds: offset,
        }];
        let zone = TransitionZone::new(initial, &events, None).unwrap();
        let epoch = i128::from(local) * second;
        let fields = IsoDateTime::from_epoch_nanoseconds(epoch).unwrap();
        let result = ZonedDateTime::from_local(fields, zone, Disambiguation::Reject).unwrap();
        assert_eq!(result.instant().epoch_nanoseconds(), epoch);
    }
}

#[test]
fn recurring_leap_only_changes_and_adjacent_gaps() {
    use formatjs_temporal::{
        Disambiguation, FutureRule, OffsetTransition, Overflow, TimeZone, TransitionDirection,
        TransitionRule, TransitionZone, ZonedDateTime,
    };
    let future = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Julian {
                day: 60,
                seconds: 0,
            },
            TransitionRule::Day {
                day: 59,
                seconds: 3600,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(3600, &[], Some(future)).unwrap();
    let query: Instant = "2100-06-01T00:00Z".parse().unwrap();
    assert_eq!(
        zone.transition(query, TransitionDirection::Next),
        Some("2104-02-29T00:00Z".parse().unwrap())
    );
    assert_eq!(
        zone.transition(query, TransitionDirection::Previous),
        Some("2096-03-01T00:00Z".parse().unwrap())
    );
    let events = [
        OffsetTransition {
            epoch_seconds: 0,
            offset_seconds: 0,
        },
        OffsetTransition {
            epoch_seconds: 3600,
            offset_seconds: 3600,
        },
        OffsetTransition {
            epoch_seconds: 7200,
            offset_seconds: 7200,
        },
    ];
    let zone = TransitionZone::new(0, &events, None).unwrap();
    assert_eq!(
        zone.transition(
            Instant::from_epoch_nanoseconds(-1).unwrap(),
            TransitionDirection::Next
        ),
        Some(Instant::from_epoch_nanoseconds(3600_000_000_000).unwrap())
    );
    let local = IsoDateTime {
        year: 1970,
        month: 1,
        day: 1,
        hour: 1,
        minute: 30,
        second: 0,
        nanosecond: 0,
    };
    let later = ZonedDateTime::from_local(local, zone, Disambiguation::Compatible).unwrap();
    let earlier = ZonedDateTime::from_local(local, zone, Disambiguation::Earlier).unwrap();
    assert_eq!(later.instant().epoch_nanoseconds(), 5400_000_000_000);
    assert_eq!(earlier.instant().epoch_nanoseconds(), 1800_000_000_000);
    let duration = formatjs_temporal::Duration::new([0, 0, 0, 0, 1, 0, 0, 0, 0, 0]).unwrap();
    assert_eq!(
        later
            .checked_add(duration, Overflow::Constrain)
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        9000_000_000_000
    );
}

#[test]
fn independent_icu_zoned_calendar_rounding() {
    use formatjs_temporal::{FixedOffset, ZonedDateTime, ZonedUnit};
    let zones = iana_registry();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ZONED_DIFFERENCE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let start = Instant::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap();
        let end = Instant::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap();
        let unit: ZonedUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let mut expected_until = [0; 10];
        expected_until[unit as usize] = fields[6].parse().unwrap();
        let mut expected_since = [0; 10];
        expected_since[unit as usize] = fields[7].parse().unwrap();
        if fields[0] == "UTC" {
            let zone = FixedOffset::new(0).unwrap();
            let a = ZonedDateTime::new(start, zone);
            let b = ZonedDateTime::new(end, zone);
            assert_eq!(
                a.until(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_until,
                "{line}"
            );
            assert_eq!(
                a.since(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_since,
                "{line}"
            );
        } else {
            let zone = zones
                .resolve(fields[0])
                .unwrap_or_else(|error| panic!("{line}: {error:?}"));
            let a = ZonedDateTime::new(start, zone);
            let b = ZonedDateTime::new(end, zone);
            assert_eq!(
                a.until(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_until,
                "{line}"
            );
            assert_eq!(
                a.since(&b, unit, unit, increment, mode).unwrap().fields(),
                expected_since,
                "{line}"
            );
        }
        count += 1;
    }
    assert_eq!(count, 19440);
}

#[test]
fn zoned_differences_at_instant_limits() {
    use formatjs_temporal::{FixedOffset, RoundingMode, ZonedDateTime, ZonedUnit};
    for seconds in [0, 7200, -25200, 1080, -29520] {
        let zone = FixedOffset::new(seconds * 1_000_000_000).unwrap();
        for extreme in [-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS] {
            let limit = ZonedDateTime::new(Instant::from_epoch_nanoseconds(extreme).unwrap(), zone);
            let ordinary = ZonedDateTime::new("1970-09-01T15:47:32Z".parse().unwrap(), zone);
            ordinary
                .until(
                    &limit,
                    ZonedUnit::Year,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap_or_else(|error| panic!("ordinary to limit {seconds} {extreme}: {error:?}"));
            limit
                .until(
                    &ordinary,
                    ZonedUnit::Year,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap_or_else(|error| panic!("limit to ordinary {seconds} {extreme}: {error:?}"));
            let a = ordinary
                .until(
                    &limit,
                    ZonedUnit::Second,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap();
            let b = limit
                .until(
                    &ordinary,
                    ZonedUnit::Second,
                    ZonedUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap();
            assert_eq!(a, b.negated());
        }
    }
}

#[test]
fn independent_icu_relative_duration_operations() {
    use formatjs_temporal::{Duration, RoundingMode, ZonedDateTime, ZonedUnit};
    let zones = iana_registry();
    let mut rounds = 0;
    let mut totals = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ZONED_DIFFERENCE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let zone = zones
            .resolve(fields[0])
            .unwrap_or_else(|error| panic!("{line}: {error:?}"));
        let a = ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap(),
            zone,
        );
        let b = ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap(),
            zone,
        );
        let unit: ZonedUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let duration = a
            .until(&b, unit, ZonedUnit::Nanosecond, 1, RoundingMode::Trunc)
            .unwrap();
        let mut expected = [0; 10];
        expected[unit as usize] = fields[6].parse().unwrap();
        assert_eq!(
            a.round_duration(duration, unit, unit, increment, mode)
                .unwrap(),
            Duration::new(expected).unwrap(),
            "{line}"
        );
        rounds += 1;
        if fields[8] != "null" {
            assert_eq!(
                a.total_duration(duration, unit).unwrap(),
                fields[8].parse::<f64>().unwrap(),
                "{line}"
            );
            totals += 1;
        }
    }
    assert_eq!(rounds, 19440);
    assert_eq!(totals, 6480);
}

#[test]
fn relative_duration_prefixes_and_day_boundaries() {
    use formatjs_temporal::{Duration, FixedOffset, RoundingMode, ZonedDateTime, ZonedUnit};
    let zone = FixedOffset::new(0).unwrap();
    let start = ZonedDateTime::new("2020-01-31T00:00Z".parse().unwrap(), zone);
    let days = Duration::new([0, 0, 0, 59, 0, 0, 0, 0, 0, 0]).unwrap();
    assert_eq!(
        start
            .round_duration(
                days,
                ZonedUnit::Year,
                ZonedUnit::Week,
                1,
                RoundingMode::Ceil
            )
            .unwrap()
            .fields(),
        [0, 1, 5, 0, 0, 0, 0, 0, 0, 0]
    );
    let blank = Duration::new([0; 10]).unwrap();
    let edge = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        zone,
    );
    assert!(
        edge.round_duration(
            blank,
            ZonedUnit::Day,
            ZonedUnit::Minute,
            1,
            RoundingMode::Trunc
        )
        .is_err()
    );
    let before = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(
            MAX_EPOCH_NANOSECONDS - NANOSECONDS_PER_DAY + 1_000_000_000,
        )
        .unwrap(),
        zone,
    );
    assert!(before.total_duration(blank, ZonedUnit::Day).is_err());
    let close = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS - 1_000_000_000).unwrap(),
        zone,
    );
    assert_eq!(
        close
            .round_duration(
                blank,
                ZonedUnit::Year,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::HalfExpand
            )
            .unwrap(),
        blank
    );
}

#[test]
fn now_uses_host_clock_and_owned_iana_with_icu_controls() {
    use formatjs_temporal::{Now, SystemClock};
    struct Clock(i128);
    impl SystemClock for Clock {
        fn epoch_nanoseconds(&self) -> i128 {
            self.0
        }
    }
    let zones = iana_registry();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_TIMEZONE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let Some(zone) = icu_zone(zones, fields[0]) else {
            continue;
        };
        let value = fields[1].parse::<i128>().unwrap() * 1_000_000 + 123;
        let offset = fields[2].parse::<i128>().unwrap() * 1_000_000_000;
        let now = Now::new(Clock(value));
        let local = now.plain_date_time_iso(zone).unwrap();
        assert_eq!(now.instant().epoch_nanoseconds(), value, "{line}");
        assert_eq!(
            now.zoned_date_time_iso(zone).instant().epoch_nanoseconds(),
            value,
            "{line}"
        );
        assert_eq!(local.epoch_nanoseconds(), value + offset, "{line}");
        assert_eq!(now.plain_date_iso(zone).unwrap(), local.date(), "{line}");
        assert_eq!(now.plain_time_iso(zone).unwrap(), local.time(), "{line}");
        count += 1;
    }
    assert_eq!(count, 17640);
    for sign in [-1, 1] {
        let now = Now::new(Clock(sign * (MAX_EPOCH_NANOSECONDS + 1)));
        assert_eq!(
            now.instant().epoch_nanoseconds(),
            sign * MAX_EPOCH_NANOSECONDS
        );
    }
}

#[test]
fn independent_icu_named_zone_identities() {
    use formatjs_temporal::{RoundingMode, ZonedDateTime, ZonedUnit, named_time_zone_identifier};
    let zones = iana_registry();
    let named = |id: &str| zones.resolve(id).unwrap();
    let mut count = 0;
    let mut controls = Vec::new();
    for line in include_str!(env!("FORMATJS_TEMPORAL_TZ_IDENTITIES"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let (id, expected) = line.split_once('\t').unwrap();
        let Some(record) = named_time_zone_identifier(id) else {
            continue;
        };
        assert_eq!(record.primary, expected, "{line}");
        assert_eq!(
            named_time_zone_identifier(&id.to_ascii_lowercase()),
            Some(record)
        );
        controls.push((named(id), expected));
        count += 1;
    }
    assert_eq!(count, 597);
    let expected: std::collections::BTreeSet<_> = controls
        .iter()
        .map(|(_, name)| *name)
        .filter(|name| *name != "UTC")
        .collect();
    let actual: std::collections::BTreeSet<_> = zones
        .records()
        .iter()
        .map(|record| record.identifier())
        .collect();
    assert_eq!(actual, expected);
    eprintln!(
        "{} compiled primary records cover {count} IANA identities",
        actual.len()
    );
    let mut pairs = 0;
    for (i, (one, expected_one)) in controls.iter().enumerate() {
        for (two, expected_two) in &controls[..=i] {
            assert_eq!(one == two, expected_one == expected_two);
            pairs += 1;
        }
    }
    assert_eq!(pairs, 178503);
    for invalid in [
        "Not/AZone",
        "america/new_york ",
        "AMERİCA/NEW_YORK",
        "+00:00",
        "Etc/Unknown",
    ] {
        assert!(named_time_zone_identifier(invalid).is_none());
    }
    let accra = named("aFRICA/aCCRA");
    let abidjan = named("Africa/Abidjan");
    assert_eq!(accra.identifier(), "Africa/Accra");
    assert_ne!(accra, abidjan);
    let epoch = Instant::from_epoch_nanoseconds(0).unwrap();
    let first = ZonedDateTime::new(epoch, accra);
    let second = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(NANOSECONDS_PER_DAY).unwrap(),
        abidjan,
    );
    assert!(
        first
            .until(
                &second,
                ZonedUnit::Day,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .is_err()
    );
    assert_eq!(
        first
            .until(
                &second,
                ZonedUnit::Hour,
                ZonedUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .fields()[4],
        24
    );
    for (alias, primary) in [
        ("US/Eastern", "America/New_York"),
        ("Pacific/Truk", "Pacific/Chuuk"),
        ("Atlantic/Jan_Mayen", "Arctic/Longyearbyen"),
        ("Etc/UTC", "UTC"),
    ] {
        assert_eq!(named(alias), named(primary));
    }
}

#[test]
fn independent_icu_plain_relative_operations() {
    use formatjs_temporal::{DateTimeUnit, Duration, PlainDateTime, TimeUnit};
    let mut rounds = 0;
    let mut totals = 0;
    let mut dates = 0;
    let mut comparisons = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_PLAIN_RELATIVE"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let start = PlainDateTime::from_epoch_nanoseconds(fields[1].parse().unwrap()).unwrap();
        let date = start.date();
        if fields[0] == "C" {
            let one = fields[2].parse().unwrap();
            let two = fields[3].parse().unwrap();
            assert_eq!(
                date.compare_durations(one, two).unwrap() as i8,
                fields[4].parse::<i8>().unwrap(),
                "{line}"
            );
            comparisons += 1;
            continue;
        }
        let end = PlainDateTime::from_epoch_nanoseconds(fields[2].parse().unwrap()).unwrap();
        let unit: DateTimeUnit = fields[3].parse().unwrap();
        let increment = fields[4].parse().unwrap();
        let mode = fields[5].parse().unwrap();
        let mut until = [0; 10];
        until[unit as usize] = fields[6].parse().unwrap();
        let mut since = [0; 10];
        since[unit as usize] = fields[7].parse().unwrap();
        if fields[0] == "D" {
            assert_eq!(
                date.until(end.date(), unit, unit, increment, mode)
                    .unwrap()
                    .fields(),
                until,
                "{line}"
            );
            assert_eq!(
                date.since(end.date(), unit, unit, increment, mode)
                    .unwrap()
                    .fields(),
                since,
                "{line}"
            );
            dates += 1;
            continue;
        }
        assert_eq!(
            start
                .until(end, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            until,
            "{line}"
        );
        assert_eq!(
            start
                .since(end, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            since,
            "{line}"
        );
        let duration = Duration::from_time_nanoseconds(
            end.epoch_nanoseconds() - start.epoch_nanoseconds(),
            TimeUnit::Hour,
        )
        .unwrap();
        assert_eq!(
            date.round_duration(duration, unit, unit, increment, mode)
                .unwrap()
                .fields(),
            until,
            "{line}"
        );
        rounds += 1;
        if fields[8] != "null" {
            assert_eq!(
                date.total_duration(duration, unit).unwrap(),
                fields[8].parse::<f64>().unwrap(),
                "{line}"
            );
            totals += 1;
        }
    }
    assert_eq!(rounds, 51840);
    assert_eq!(totals, 17280);
    assert_eq!(dates, 20736);
    assert_eq!(comparisons, 4224);
}

#[test]
fn plain_relative_test262_range_and_prefix_cases() {
    use formatjs_temporal::{
        DateTimeUnit as U, Duration, PlainDate, PlainDateTime, RoundingMode as R,
    };
    let near_min: PlainDate = "-271821-04-20".parse().unwrap();
    let negative_day: Duration = "-P1D".parse().unwrap();
    assert!(near_min.total_duration(negative_day, U::Hour).is_err());
    assert!(
        near_min
            .round_duration(negative_day, U::Day, U::Hour, 1, R::HalfExpand)
            .is_err()
    );
    let adjacent: Duration = "-PT23H59M59.999999999S".parse().unwrap();
    assert_eq!(
        near_min.total_duration(adjacent, U::Hour).unwrap(),
        -86_399_999_999_999.0 / 3_600_000_000_000.0
    );
    assert_eq!(
        near_min
            .round_duration(adjacent, U::Hour, U::Nanosecond, 1, R::HalfExpand)
            .unwrap(),
        adjacent
    );
    let zero = Duration::new([0; 10]).unwrap();
    let earliest: PlainDate = "-271821-04-19".parse().unwrap();
    let latest: PlainDate = "+275760-09-13".parse().unwrap();
    for date in [earliest, latest] {
        assert_eq!(date.total_duration(zero, U::Day).unwrap(), 0.0);
        assert_eq!(
            date.round_duration(zero, U::Year, U::Nanosecond, 1, R::HalfExpand)
                .unwrap(),
            zero
        );
    }
    for (date, nanosecond, mode) in [
        (latest, 1, R::Ceil),
        ("-271821-04-20".parse().unwrap(), -1, R::Floor),
    ] {
        let duration = Duration::new([0, 0, 0, 0, 0, 0, 0, 0, 0, nanosecond]).unwrap();
        assert_eq!(
            date.round_duration(duration, U::Day, U::Day, 1_000_000_000, mode)
                .unwrap()
                .fields(),
            [0, 0, 0, nanosecond * 1_000_000_000, 0, 0, 0, 0, 0, 0]
        );
    }
    let near_min: PlainDate = "-271821-05-19".parse().unwrap();
    assert_eq!(
        near_min
            .round_duration("-PT23H".parse().unwrap(), U::Year, U::Day, 1, R::Expand)
            .unwrap()
            .to_string(),
        "-P1D"
    );
    let start: PlainDate = "2020-01-31".parse().unwrap();
    assert_eq!(
        start
            .round_duration("P59D".parse().unwrap(), U::Year, U::Week, 1, R::Ceil)
            .unwrap()
            .to_string(),
        "P1M5W"
    );
    let start: PlainDate = "2020-01-01".parse().unwrap();
    for sign in [-1, 1] {
        let long =
            Duration::new([0, 0, 0, 0, 0, 0, sign * 9_007_199_254_740_991, 0, 0, 0]).unwrap();
        for unit in [U::Year, U::Month, U::Week] {
            assert!(start.total_duration(long, unit).is_err());
            assert!(
                start
                    .round_duration(long, unit, unit, 1, R::HalfExpand)
                    .is_err()
            );
        }
        for unit in [U::Day, U::Hour, U::Second] {
            assert!(start.total_duration(long, unit).is_err());
            assert!(
                start
                    .round_duration(long, unit, U::Nanosecond, 1, R::Trunc)
                    .is_err()
            );
        }
        let overflow =
            Duration::new([sign, 0, 0, 0, 0, 0, sign * 9_007_199_254_740_991, 0, 0, 0]).unwrap();
        assert!(start.compare_durations(overflow, zero).is_err());
        assert!(start.compare_durations(zero, overflow).is_err());
    }
    assert_eq!(
        earliest
            .until(latest, U::Day, U::Day, 1, R::Trunc)
            .unwrap()
            .fields()[3],
        200_000_001
    );
    assert!(
        start
            .round_duration(zero, U::Year, U::Week, 2, R::Trunc)
            .is_err()
    );
    assert!(start.until(start, U::Day, U::Hour, 1, R::Trunc).is_err());
    // Test262 Duration/prototype/total/rounding-window.js.
    assert_eq!(
        "2020-01-31"
            .parse::<PlainDate>()
            .unwrap()
            .total_duration("P1MT10H".parse().unwrap(), U::Month)
            .unwrap(),
        1.0134408602150538
    );
    // Native Node controls: unrounded month-end days stay days.
    let first: PlainDateTime = "2020-01-31T23:30".parse().unwrap();
    let last: PlainDateTime = "2020-03-01T00:15".parse().unwrap();
    assert_eq!(
        first
            .until(last, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "P29DT45M"
    );
    let first: PlainDateTime = "2020-01-31T00:00".parse().unwrap();
    let last: PlainDateTime = "2020-02-29T00:00".parse().unwrap();
    assert_eq!(
        first
            .until(last, U::Month, U::Month, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "P1M"
    );
    assert_eq!(
        first
            .until(last, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "P29D"
    );
    assert_eq!(
        first
            .since(last, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "-P29D"
    );
    assert_eq!(
        last.until(first, U::Month, U::Day, 1, R::Trunc)
            .unwrap()
            .to_string(),
        "-P29D"
    );
    let bound = MAX_EPOCH_NANOSECONDS + NANOSECONDS_PER_DAY;
    for edge in [-bound + 1, bound - 1] {
        let edge = PlainDateTime::from_epoch_nanoseconds(edge).unwrap();
        first
            .until(edge, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap();
        edge.until(first, U::Year, U::Nanosecond, 1, R::Trunc)
            .unwrap();
    }
}

#[test]
fn plain_date_time_rounding_crosses_public_date_limits() {
    use formatjs_temporal::{DateTimeUnit as U, PlainDateTime, RoundingMode as R};
    let first: PlainDateTime = "2000-01-31T12:34:56".parse().unwrap();
    for (last, mode, expected) in [
        (
            "+275760-09-13T23:59:59.999999999",
            R::Ceil,
            [
                "P273760Y7M13DT12H",
                "P3285127M13DT12H",
                "P14284144W5DT12H",
                "P99989013DT12H",
            ],
        ),
        (
            "-271821-04-19T00:00:00.000000001",
            R::Floor,
            [
                "-P273820Y9M11DT13H",
                "-P3285849M11DT13H",
                "-P14287284WT13H",
                "-P100010988DT13H",
            ],
        ),
    ] {
        let last = last.parse().unwrap();
        for (largest, expected) in [U::Year, U::Month, U::Week, U::Day]
            .into_iter()
            .zip(expected)
        {
            assert_eq!(
                first
                    .until(last, largest, U::Hour, 1, mode)
                    .unwrap()
                    .to_string(),
                expected
            );
        }
    }
}

#[test]
fn independent_icu_iso_calendar_total_windows() {
    use formatjs_temporal::{DateTimeUnit, Duration, PlainDate};
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_ARITHMETIC_CALENDARS")).lines() {
        let row: Vec<&str> = line.split('\t').collect();
        if row[0] != "T" || row[1] != "iso8601" {
            continue;
        }
        let date = PlainDate::from_epoch_day(row[2].parse().unwrap()).unwrap();
        let unit: DateTimeUnit = row[3].parse().unwrap();
        let amount: i128 = row[4].parse().unwrap();
        let mut fields = [0; 10];
        fields[unit as usize] = amount;
        fields[4] = amount.signum() * 10;
        assert_eq!(
            date.total_duration(Duration::new(fields).unwrap(), unit)
                .unwrap(),
            row[5].parse::<f64>().unwrap(),
            "{line}"
        );
        count += 1;
    }
    assert_eq!(count, 416);
}

#[test]
fn zoned_month_difference_balances_wall_clocks_before_gap_resolution() {
    use formatjs_temporal::{RoundingMode, ZonedDateTime, ZonedUnit};
    let zones = iana_registry();
    let zone = zones.resolve("America/Vancouver").unwrap();
    let start = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(957258000000000000).unwrap(),
        zone,
    );
    let end = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(954669600000000000).unwrap(),
        zone,
    );
    for largest in [ZonedUnit::Year, ZonedUnit::Month, ZonedUnit::Day] {
        assert_eq!(
            start
                .until(&end, largest, ZonedUnit::Nanosecond, 1, RoundingMode::Trunc)
                .unwrap()
                .fields(),
            [0, 0, 0, -29, -23, 0, 0, 0, 0, 0]
        );
        assert_eq!(
            start
                .since(&end, largest, ZonedUnit::Nanosecond, 1, RoundingMode::Trunc)
                .unwrap()
                .fields(),
            [0, 0, 0, 29, 23, 0, 0, 0, 0, 0]
        );
    }
}

#[test]
fn independent_icu_zoned_day_boundaries_and_rounding() {
    use formatjs_temporal::{ZonedDateTime, ZonedUnit};
    let zones = iana_registry();
    let mut count = 0;
    for line in include_str!(env!("FORMATJS_TEMPORAL_ZONED_ROUNDING"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let fields: Vec<&str> = line.split('\t').collect();
        let nanos = |index: usize| fields[index].parse::<i128>().unwrap() * 1_000_000;
        let zone = zones
            .resolve(fields[0])
            .unwrap_or_else(|error| panic!("{line}: {error:?}"));
        let value = ZonedDateTime::new(Instant::from_epoch_nanoseconds(nanos(1)).unwrap(), zone);
        assert_eq!(
            value.start_of_day().unwrap().instant().epoch_nanoseconds(),
            nanos(2),
            "{line}"
        );
        let replacement = value
            .with_calendar(formatjs_temporal::calendar::Calendar::Hebrew)
            .with_time(None)
            .unwrap();
        assert_eq!(
            replacement.instant().epoch_nanoseconds(),
            nanos(2),
            "omitted clock {line}"
        );
        assert_eq!(replacement.calendar_id(), "hebrew");
        let converted = value
            .local()
            .unwrap()
            .date()
            .with_calendar(formatjs_temporal::calendar::Calendar::Hebrew)
            .unwrap()
            .to_zoned_date_time(zone, None)
            .unwrap();
        assert_eq!(
            converted.instant().epoch_nanoseconds(),
            nanos(2),
            "date conversion {line}"
        );
        assert_eq!(converted.calendar_id(), "hebrew");
        assert_eq!(
            value.hours_in_day().unwrap(),
            (nanos(3) - nanos(2)) as f64 / 3_600_000_000_000.0,
            "{line}"
        );
        assert_eq!(
            value
                .round(ZonedUnit::Day, 1, fields[4].parse().unwrap())
                .unwrap()
                .instant()
                .epoch_nanoseconds(),
            nanos(5),
            "{line}"
        );
        count += 1;
    }
    assert_eq!(count, 5292);
}

#[test]
fn zoned_clock_rounding_preserves_folds_and_resolves_gaps() {
    use formatjs_temporal::{RoundingMode, ZonedDateTime, ZonedUnit};
    let zones = iana_registry();
    let zone = zones.resolve("America/New_York").unwrap();
    for (text, expected) in [
        ("2020-11-01T05:29:00Z", "2020-11-01T05:00:00Z"),
        ("2020-11-01T06:29:00Z", "2020-11-01T06:00:00Z"),
        ("2020-03-08T06:45:00Z", "2020-03-08T07:00:00Z"),
    ] {
        let value = ZonedDateTime::new(text.parse::<Instant>().unwrap(), zone);
        let rounded = value
            .round(ZonedUnit::Hour, 1, RoundingMode::HalfExpand)
            .unwrap();
        assert_eq!(
            rounded.instant(),
            expected.parse::<Instant>().unwrap(),
            "{text}"
        );
        for (unit, increment) in [
            (ZonedUnit::Month, 1),
            (ZonedUnit::Day, 2),
            (ZonedUnit::Minute, 7),
            (ZonedUnit::Hour, 0),
        ] {
            assert!(value.round(unit, increment, RoundingMode::Trunc).is_err());
        }
    }
}

#[test]
fn zoned_clock_rounding_validates_the_local_date_and_all_candidates() {
    use formatjs_temporal::{
        Error, FixedOffset, OffsetTransition, RoundingMode, TransitionZone, ZonedDateTime,
        ZonedUnit,
    };

    let minimum = Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS).unwrap();
    let value = ZonedDateTime::new(minimum, FixedOffset::new(-3_600_000_000_000).unwrap());
    assert_eq!(
        value
            .round(ZonedUnit::Hour, 1, RoundingMode::HalfExpand)
            .map(|rounded| rounded.instant()),
        Err(Error::OutOfRange)
    );
    assert_eq!(
        value
            .round(ZonedUnit::Nanosecond, 1, RoundingMode::HalfExpand)
            .unwrap()
            .instant(),
        minimum
    );

    let maximum_seconds = (MAX_EPOCH_NANOSECONDS / 1_000_000_000) as i64;
    let transitions = [OffsetTransition {
        epoch_seconds: maximum_seconds - 1800,
        offset_seconds: 0,
    }];
    let fold = TransitionZone::new(3600, &transitions, None).unwrap();
    // Local 00:15 occurs at max − 45m and again at max + 15m.
    let first = Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS - 2_700_000_000_000).unwrap();
    let value = ZonedDateTime::new(first, fold);
    assert_eq!(
        value
            .round(ZonedUnit::Minute, 1, RoundingMode::HalfExpand)
            .map(|rounded| rounded.instant()),
        Err(Error::OutOfRange)
    );
}

#[test]
fn repeated_timezone_offsets_do_not_repeat_resolution_candidates() {
    use formatjs_temporal::{OffsetTransition, TimeZone, TransitionZone};
    let events: Vec<_> = (0..400)
        .map(|index| OffsetTransition {
            epoch_seconds: index,
            offset_seconds: if index % 2 == 0 { 3600 } else { 0 },
        })
        .collect();
    let zone = TransitionZone::new(0, &events, None).unwrap();
    let mut offsets = Vec::new();
    zone.visit_offsets(&mut |value| offsets.push(value));
    assert_eq!(offsets, [0, 3_600_000_000_000]);

    let many: Vec<_> = (0..40)
        .map(|index| OffsetTransition {
            epoch_seconds: index,
            offset_seconds: index as i32,
        })
        .collect();
    let zone = TransitionZone::new(0, &many, None).unwrap();
    offsets.clear();
    zone.visit_offsets(&mut |value| offsets.push(value));
    offsets.sort();
    offsets.dedup();
    assert_eq!(
        offsets,
        (0..40)
            .map(|value| value * 1_000_000_000)
            .collect::<Vec<i128>>()
    );
}

#[test]
fn bounded_offset_visits_match_full_history_at_gaps_folds_and_bounds() {
    use formatjs_temporal::{
        Disambiguation, FutureRule, OffsetInput, OffsetOption, OffsetTransition, TimeZone,
        TransitionDirection, TransitionRule, TransitionZone, ZonedDateTime, ZonedParseOptions,
        calendar::Calendar,
    };
    #[derive(Clone, Copy)]
    struct FullHistory<'a>(TransitionZone<'a>);
    impl TimeZone for FullHistory<'_> {
        fn offset_nanoseconds(&self, instant: Instant) -> i128 {
            self.0.offset_nanoseconds(instant)
        }
        fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
            self.0.visit_offsets(visitor);
        }
        fn has_out_of_range_candidate(&self, local: i128) -> bool {
            self.0.has_out_of_range_candidate(local)
        }
        fn transition(&self, instant: Instant, direction: TransitionDirection) -> Option<Instant> {
            self.0.transition(instant, direction)
        }
    }
    let rule = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Day { day: 0, seconds: 0 },
            TransitionRule::Day {
                day: 0,
                seconds: 7200,
            },
        )),
    )
    .unwrap();
    let limit = (MAX_EPOCH_NANOSECONDS / 1_000_000_000) as i64;
    let mut events = vec![OffsetTransition {
        epoch_seconds: -limit,
        offset_seconds: -86399,
    }];
    events.extend((0..40).map(|index| OffsetTransition {
        epoch_seconds: -86401 + index * 4400,
        offset_seconds: if index % 2 == 0 {
            index as i32 * 1000
        } else {
            -(index as i32) * 1000
        },
    }));
    events.push(OffsetTransition {
        epoch_seconds: limit,
        offset_seconds: 86399,
    });
    let join = [OffsetTransition {
        epoch_seconds: -1,
        offset_seconds: 3600,
    }];
    for (zone, boundaries) in [
        (
            TransitionZone::new(86399, &events, None).unwrap(),
            events.as_slice(),
        ),
        (
            TransitionZone::new(0, &[], Some(rule)).unwrap(),
            join.as_slice(),
        ),
        (
            TransitionZone::new(0, &join, Some(rule)).unwrap(),
            join.as_slice(),
        ),
    ] {
        let mut locals = vec![0, -MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS];
        for text in [
            "2024-01-01T00:00Z",
            "2024-01-01T01:00Z",
            "2400-01-01T00:00Z",
        ] {
            let at = text.parse::<Instant>().unwrap().epoch_nanoseconds();
            locals.extend([at - 1, at, at + 1]);
        }
        for event in boundaries {
            let at = i128::from(event.epoch_seconds) * 1_000_000_000;
            for offset in [-86399, event.offset_seconds, 0, 86399] {
                for delta in [-1, 0, 1] {
                    locals.push(at + i128::from(offset) * 1_000_000_000 + delta);
                }
            }
        }
        for local in locals {
            let Ok(fields) = IsoDateTime::from_epoch_nanoseconds(local) else {
                continue;
            };
            for mode in [
                Disambiguation::Compatible,
                Disambiguation::Earlier,
                Disambiguation::Later,
                Disambiguation::Reject,
            ] {
                let fast =
                    ZonedDateTime::from_local(fields, zone, mode).map(|value| value.instant());
                let full = ZonedDateTime::from_local(fields, FullHistory(zone), mode)
                    .map(|value| value.instant());
                assert_eq!(fast, full, "{local} {mode:?} {zone:?}");
                for offset in [
                    OffsetOption::Prefer,
                    OffsetOption::Use,
                    OffsetOption::Ignore,
                    OffsetOption::Reject,
                ] {
                    let options = ZonedParseOptions {
                        disambiguation: mode,
                        offset,
                    };
                    let hint = OffsetInput::Exact(0);
                    let fast = ZonedDateTime::from_local_with_offset(
                        fields,
                        zone,
                        Calendar::Iso8601,
                        hint,
                        options,
                    )
                    .map(|v| v.instant());
                    let full = ZonedDateTime::from_local_with_offset(
                        fields,
                        FullHistory(zone),
                        Calendar::Iso8601,
                        hint,
                        options,
                    )
                    .map(|v| v.instant());
                    assert_eq!(fast, full, "{local} {mode:?} {offset:?} {zone:?}");
                }
            }
        }
    }
}

#[test]
fn instant_rounding_keeps_wide_results_at_signed_64_bit_boundaries() {
    use formatjs_temporal::{RoundingMode, TimeUnit};
    let base = 9_223_372_036_854_775_800i128;
    for (value, expected) in [
        (base + 7, [base, base + 10, base + 10]),
        (base + 8, [base, base + 10, base + 10]),
        (-base - 8, [-base - 10, -base, -base - 10]),
        (-base - 9, [-base - 10, -base, -base - 10]),
        (base + 5, [base, base + 10, base]),
        (base + 15, [base + 10, base + 20, base + 20]),
        (-base - 5, [-base - 10, -base, -base]),
        (-base - 15, [-base - 20, -base - 10, -base - 20]),
    ] {
        for (mode, expected) in [
            RoundingMode::Floor,
            RoundingMode::Ceil,
            RoundingMode::HalfEven,
        ]
        .into_iter()
        .zip(expected)
        {
            assert_eq!(
                Instant::from_epoch_nanoseconds(value)
                    .unwrap()
                    .round(TimeUnit::Nanosecond, 10, mode)
                    .unwrap()
                    .epoch_nanoseconds(),
                expected
            );
        }
    }
}

#[test]
fn recurring_transitions_preserve_january_boundary_and_explicit_join() {
    use formatjs_temporal::{
        FutureRule, OffsetTransition, TimeZone, TransitionDirection, TransitionRule, TransitionZone,
    };
    let rule = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Day { day: 0, seconds: 0 },
            TransitionRule::Day {
                day: 0,
                seconds: 7200,
            },
        )),
    )
    .unwrap();
    let midnight: Instant = "2024-01-01T00:00Z".parse().unwrap();
    let end: Instant = "2024-01-01T01:00Z".parse().unwrap();
    let before = Instant::from_epoch_nanoseconds(midnight.epoch_nanoseconds() - 1).unwrap();
    let zone = TransitionZone::new(0, &[], Some(rule)).unwrap();
    assert_eq!(
        zone.transition(before, TransitionDirection::Next),
        Some(midnight)
    );
    assert_eq!(
        zone.transition(midnight, TransitionDirection::Next),
        Some(end)
    );
    assert_eq!(
        zone.transition(end, TransitionDirection::Previous),
        Some(midnight)
    );
    let transitions = [OffsetTransition {
        epoch_seconds: (midnight.epoch_nanoseconds() / 1_000_000_000) as i64 - 1,
        offset_seconds: 3600,
    }];
    let joined = TransitionZone::new(0, &transitions, Some(rule)).unwrap();
    assert_eq!(
        joined.transition(before, TransitionDirection::Next),
        Some(end)
    );
    assert_eq!(joined.offset_nanoseconds(midnight), 3_600_000_000_000);
    assert_eq!(joined.offset_nanoseconds(end), 0);
}

#[test]
fn recurring_last_weekday_handles_short_and_leap_february() {
    use formatjs_temporal::{FutureRule, TimeZone, TransitionRule, TransitionZone};
    let rule = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Month {
                month: 2,
                week: 5,
                weekday: 4,
                seconds: 0,
            },
            TransitionRule::Day {
                day: 200,
                seconds: 0,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(0, &[], Some(rule)).unwrap();
    for text in ["2023-02-23T00:00Z", "2024-02-29T00:00Z"] {
        let instant: Instant = text.parse().unwrap();
        let before = Instant::from_epoch_nanoseconds(instant.epoch_nanoseconds() - 1).unwrap();
        assert_eq!(zone.offset_nanoseconds(before), 0, "{text}");
        assert_eq!(
            zone.offset_nanoseconds(instant),
            3_600_000_000_000,
            "{text}"
        );
    }
}

#[test]
fn recurring_monthly_offsets_preserve_rule_year_boundaries() {
    use formatjs_temporal::{FutureRule, TimeZone, TransitionRule, TransitionZone};
    let month = |month, week, weekday, seconds| TransitionRule::Month {
        month,
        week,
        weekday,
        seconds,
    };
    let check = |standard, daylight, start, end, samples: &[(&str, i32, i32)]| {
        let rule = FutureRule::new(standard, Some((daylight, start, end))).unwrap();
        let zone = TransitionZone::new(standard, &[], Some(rule)).unwrap();
        for &(text, before, after) in samples {
            let at: Instant = text.parse().unwrap();
            for (delta, expected) in [(-1, before), (0, after), (1, after)] {
                let instant =
                    Instant::from_epoch_nanoseconds(at.epoch_nanoseconds() + delta).unwrap();
                assert_eq!(
                    zone.offset_nanoseconds(instant),
                    i128::from(expected) * 1_000_000_000,
                    "{text} {delta} {rule:?}"
                );
            }
        }
        zone
    };
    let north = check(
        -18000,
        -14400,
        month(3, 2, 0, 7200),
        month(11, 1, 0, 7200),
        &[
            ("1969-03-09T07:00Z", -18000, -14400),
            ("1969-11-02T06:00Z", -14400, -18000),
            ("2024-01-01T00:00Z", -18000, -18000),
            ("2024-03-10T07:00Z", -18000, -14400),
            ("2024-07-01T00:00Z", -14400, -14400),
            ("2024-11-03T06:00Z", -14400, -18000),
            ("2024-12-31T23:59:59Z", -18000, -18000),
        ],
    );
    for value in [-MAX_EPOCH_NANOSECONDS, MAX_EPOCH_NANOSECONDS] {
        assert_eq!(
            north.offset_nanoseconds(Instant::from_epoch_nanoseconds(value).unwrap()),
            -14_400_000_000_000
        );
    }
    check(
        36000,
        39600,
        month(10, 1, 0, 7200),
        month(4, 1, 0, 10800),
        &[
            ("2024-01-01T00:00Z", 39600, 39600),
            ("2024-04-06T16:00Z", 39600, 36000),
            ("2024-07-01T00:00Z", 36000, 36000),
            ("2024-10-05T16:00Z", 36000, 39600),
            ("2024-12-31T23:59:59Z", 39600, 39600),
        ],
    );
    check(
        0,
        3600,
        month(2, 5, 4, 0),
        month(4, 1, 0, 0),
        &[
            ("2023-02-23T00:00Z", 0, 3600),
            ("2023-04-01T23:00Z", 3600, 0),
            ("2024-02-29T00:00Z", 0, 3600),
            ("2024-04-06T23:00Z", 3600, 0),
        ],
    );
    check(
        86399,
        -86399,
        month(2, 1, 0, -604799),
        month(11, 5, 0, 604799),
        &[
            ("2024-01-01T00:00Z", 86399, 86399),
            ("2024-01-27T00:00:02Z", 86399, -86399),
            ("2024-07-01T00:00Z", -86399, -86399),
            ("2024-12-01T23:59:58Z", -86399, 86399),
        ],
    );
    // Edge months can move an event into a different UTC year.
    check(
        3600,
        7200,
        month(1, 1, 0, 0),
        month(3, 1, 0, 0),
        &[
            ("2022-12-31T23:00Z", 3600, 7200),
            ("2023-03-04T22:00Z", 7200, 3600),
        ],
    );
    check(
        0,
        -3600,
        month(3, 2, 0, 0),
        month(12, 5, 1, 86399),
        &[
            ("2018-03-11T00:00Z", 0, -3600),
            ("2019-01-01T00:59:59Z", -3600, 0),
        ],
    );
    // Adjacent months can change event order between years.
    check(
        0,
        -3600,
        month(3, 4, 0, 604799),
        month(4, 1, 0, -604799),
        &[
            ("2023-03-26T01:00:01Z", -3600, 0),
            ("2023-04-01T23:59:59Z", 0, -3600),
            ("2024-01-01T00:00Z", -3600, -3600),
            ("2024-03-30T23:59:59Z", -3600, -3600),
            ("2024-03-31T01:00:01Z", -3600, 0),
        ],
    );
}

#[test]
fn recurring_offsets_preserve_nanosecond_integer_widths() {
    use formatjs_temporal::{FutureRule, TimeZone, TransitionRule, TransitionZone};
    let rule = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Month {
                month: 3,
                week: 1,
                weekday: 0,
                seconds: 0,
            },
            TransitionRule::Month {
                month: 8,
                week: 1,
                weekday: 0,
                seconds: 0,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(0, &[], Some(rule)).unwrap();
    // The negative i64 bound is outside DST; the other bounds are inside.
    for (raw, expected) in [
        (i128::from(i64::MIN) - 1, 0_i128),
        (i128::from(i64::MIN), 0),
        (i128::from(i64::MIN) + 1, 0),
        (i128::from(i64::MAX) - 1, 3_600_000_000_000),
        (i128::from(i64::MAX), 3_600_000_000_000),
        (i128::from(i64::MAX) + 1, 3_600_000_000_000),
        (-i128::from(u64::MAX) - 1, 3_600_000_000_000),
        (-i128::from(u64::MAX), 3_600_000_000_000),
        (-i128::from(u64::MAX) + 1, 3_600_000_000_000),
        (i128::from(u64::MAX) - 1, 3_600_000_000_000),
        (i128::from(u64::MAX), 3_600_000_000_000),
        (i128::from(u64::MAX) + 1, 3_600_000_000_000),
    ] {
        assert_eq!(
            zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(raw).unwrap()),
            expected,
            "{raw}"
        );
    }
}

#[test]
fn offsets_preserve_wide_nanosecond_second_boundaries() {
    use formatjs_temporal::{OffsetTransition, TimeZone, TransitionZone};
    for seconds in [
        -8_639_999_999_999_i64,
        -17_179_869_184,
        -13_596_181_323,
        -9_223_372_037,
        9_223_372_037,
        13_596_181_323,
        17_179_869_184,
        8_639_999_999_999,
    ] {
        let events = [
            OffsetTransition {
                epoch_seconds: seconds - 1,
                offset_seconds: 1,
            },
            OffsetTransition {
                epoch_seconds: seconds,
                offset_seconds: 2,
            },
            OffsetTransition {
                epoch_seconds: seconds + 1,
                offset_seconds: 3,
            },
        ];
        let zone = TransitionZone::new(0, &events, None).unwrap();
        let anchor = i128::from(seconds) * 1_000_000_000;
        for (delta, expected) in [
            (-1, 1),
            (0, 2),
            (1, 2),
            (999_999_999, 2),
            (1_000_000_000, 3),
        ] {
            let instant = Instant::from_epoch_nanoseconds(anchor + delta).unwrap();
            assert_eq!(
                zone.offset_nanoseconds(instant),
                expected * 1_000_000_000,
                "{seconds} {delta}"
            );
        }
    }
}

#[test]
fn recurring_month_offsets_match_shifted_transition_intervals() {
    use formatjs_temporal::{FutureRule, TimeZone, TransitionRule, TransitionZone};
    let month = |month, week, seconds| TransitionRule::Month {
        month,
        week,
        weekday: 0,
        seconds,
    };
    for (year_start, first_change, second_change, days) in [
        (
            "1969-01-01T00:00Z",
            "1969-01-25T00:00:02Z",
            "1969-12-07T23:59:58Z",
            365,
        ),
        (
            "2024-01-01T00:00Z",
            "2024-01-27T00:00:02Z",
            "2024-12-01T23:59:58Z",
            366,
        ),
    ] {
        let year_start = year_start.parse::<Instant>().unwrap().epoch_nanoseconds();
        let first_change = first_change.parse::<Instant>().unwrap().epoch_nanoseconds();
        let second_change = second_change
            .parse::<Instant>()
            .unwrap()
            .epoch_nanoseconds();
        for (standard, daylight, start, end, southern) in [
            (
                86399,
                -86399,
                month(2, 1, -604799),
                month(11, 5, 604799),
                false,
            ),
            (
                -86399,
                86399,
                month(11, 5, 604799),
                month(2, 1, -604799),
                true,
            ),
        ] {
            let future = FutureRule::new(standard, Some((daylight, start, end))).unwrap();
            let zone = TransitionZone::new(standard, &[], Some(future)).unwrap();
            for day in 0..days {
                for clock in [0, NANOSECONDS_PER_DAY / 2, NANOSECONDS_PER_DAY - 1] {
                    let nanoseconds = year_start + i128::from(day) * NANOSECONDS_PER_DAY + clock;
                    let between = nanoseconds >= first_change && nanoseconds < second_change;
                    let expected = if between != southern {
                        daylight
                    } else {
                        standard
                    };
                    assert_eq!(
                        zone.offset_nanoseconds(
                            Instant::from_epoch_nanoseconds(nanoseconds).unwrap()
                        ),
                        i128::from(expected) * 1_000_000_000,
                        "nanoseconds={nanoseconds}, southern={southern}"
                    );
                }
            }
        }
    }
}

#[test]
fn system_time_zone_falls_back_to_utc() {
    use formatjs_temporal::TimeZone;
    let zones = iana_registry();
    for host in [None, Some(""), Some("Etc/Unknown"), Some("+05:30:15")] {
        let zone = zones.system(host);
        assert_eq!(zone.identifier(), "UTC", "{host:?}");
        assert_eq!(
            zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(0).unwrap()),
            0
        );
    }
    assert_eq!(
        zones.system(Some("asia/calcutta")).identifier(),
        "Asia/Kolkata"
    );
    assert_eq!(zones.system(Some("-06:00")).identifier(), "-06:00");
    assert_eq!(
        formatjs_temporal::TimeZoneRegistry::empty()
            .system(Some("America/Regina"))
            .identifier(),
        "UTC"
    );
}

#[test]
fn exact_calendar_totals_validate_the_full_window() {
    use formatjs_temporal::{DateTimeUnit, Duration, FixedOffset, PlainDate, ZonedDateTime};
    for (date, duration, unit) in [
        ("+275759-09-13", "P1Y", DateTimeUnit::Year),
        ("+275760-08-13", "P1M", DateTimeUnit::Month),
        ("+275760-09-06", "P1W", DateTimeUnit::Week),
        ("-271821-05-20", "-P1M", DateTimeUnit::Month),
    ] {
        let plain: PlainDate = date.parse().unwrap();
        let duration: Duration = duration.parse().unwrap();
        assert!(
            plain.total_duration(duration, unit).is_err(),
            "{date} {unit:?}"
        );
        let zoned = ZonedDateTime::new(
            format!("{date}T00:00Z").parse().unwrap(),
            FixedOffset::new(0).unwrap(),
        );
        assert!(
            zoned.total_duration(duration, unit).is_err(),
            "{date} {unit:?}"
        );
    }
}

#[test]
fn zero_calendar_totals_depend_on_anchor_kind() {
    use formatjs_temporal::{DateTimeUnit, Duration, FixedOffset, PlainDate, ZonedDateTime};
    let zero: Duration = "PT0S".parse().unwrap();
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    let minimum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    for unit in [DateTimeUnit::Year, DateTimeUnit::Month, DateTimeUnit::Week] {
        assert!(maximum.total_duration(zero, unit).is_err(), "{unit:?}");
        assert_eq!(minimum.total_duration(zero, unit), Ok(0.0));
        for text in ["+275760-09-13", "-271821-04-19"] {
            let plain: PlainDate = text.parse().unwrap();
            assert_eq!(plain.total_duration(zero, unit), Ok(0.0));
        }
    }
    assert_eq!(maximum.total_duration(zero, DateTimeUnit::Hour), Ok(0.0));
}

#[test]
fn comparisons_preserve_chronological_field_order_and_ignore_calendars() {
    use core::cmp::Ordering;
    use formatjs_temporal::{PlainDate, PlainDateTime, PlainTime, calendar::Calendar};
    let clocks = [
        "00:00:00",
        "00:00:00.000000001",
        "00:00:00.000000999",
        "00:00:00.000001000",
        "00:00:00.000999999",
        "00:00:00.001000000",
        "00:00:00.999999999",
        "00:00:01",
        "00:00:59.999999999",
        "00:01:00",
        "00:59:59.999999999",
        "01:00:00",
        "23:59:59.999999999",
    ]
    .map(|text| text.parse::<PlainTime>().unwrap());
    let date = PlainDate::new(2000, 2, 29).unwrap();
    for (first, one) in clocks.iter().enumerate() {
        for (second, two) in clocks.iter().enumerate() {
            assert_eq!(one.cmp(two), first.cmp(&second));
            assert_eq!(
                date.to_date_time(*one)
                    .unwrap()
                    .compare(date.to_date_time(*two).unwrap()),
                first.cmp(&second)
            );
        }
    }
    let dates = [
        "-271821-04-19",
        "-000001-12-31",
        "0000-01-01",
        "1900-02-28",
        "1900-03-01",
        "2000-02-28",
        "2000-02-29",
        "2000-03-01",
        "+275760-09-13",
    ]
    .map(|text| text.parse::<PlainDate>().unwrap());
    let noon = PlainTime::new(12, 0, 0, 0).unwrap();
    for (first, one) in dates.iter().enumerate() {
        for (second, two) in dates.iter().enumerate() {
            assert_eq!(one.compare(*two), first.cmp(&second));
            assert_eq!(
                one.to_date_time(noon)
                    .unwrap()
                    .compare(two.to_date_time(noon).unwrap()),
                first.cmp(&second)
            );
        }
    }
    let last: PlainDateTime = "2000-02-29T23:59:59.999999999".parse().unwrap();
    let next: PlainDateTime = "2000-03-01T00:00".parse().unwrap();
    assert_eq!(last.compare(next), Ordering::Less);
    assert_eq!(
        date.compare(date.with_calendar(Calendar::Hebrew).unwrap()),
        Ordering::Equal
    );
    assert_eq!(
        last.compare(last.with_calendar(Calendar::Hebrew).unwrap()),
        Ordering::Equal
    );
    let epochs = [
        -MAX_EPOCH_NANOSECONDS,
        -MAX_EPOCH_NANOSECONDS + 1,
        -1,
        0,
        1,
        MAX_EPOCH_NANOSECONDS - 1,
        MAX_EPOCH_NANOSECONDS,
    ]
    .map(|value| Instant::from_epoch_nanoseconds(value).unwrap());
    for (first, one) in epochs.iter().enumerate() {
        for (second, two) in epochs.iter().enumerate() {
            assert_eq!(one.cmp(two), first.cmp(&second));
        }
    }
    for value in [-MAX_EPOCH_NANOSECONDS - 1, MAX_EPOCH_NANOSECONDS + 1] {
        assert_eq!(
            Instant::from_epoch_nanoseconds(value),
            Err(formatjs_temporal::Error::OutOfRange)
        );
    }
}

#[test]
fn exact_clock_difference_vectors_and_component_boundaries() {
    use formatjs_temporal::{Duration, PlainTime, RoundingMode, TimeUnit};
    let vectors: serde_json::Value =
        serde_json::from_str(include_str!(env!("FORMATJS_TEMPORAL_TIME_STRINGS"))).unwrap();
    for vector in vectors["differences"].as_array().unwrap() {
        let one: PlainTime = vector["one"].as_str().unwrap().parse().unwrap();
        let two: PlainTime = vector["two"].as_str().unwrap().parse().unwrap();
        let mut expected = [0i128; 10];
        for (index, value) in vector["fields"].as_array().unwrap().iter().enumerate() {
            expected[index + 4] = i128::from(value.as_i64().unwrap());
        }
        let until = one
            .until(
                two,
                TimeUnit::Hour,
                TimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc,
            )
            .unwrap();
        assert_eq!(until.fields(), expected, "{vector}");
        assert_eq!(
            until.time_nanoseconds(false).unwrap(),
            vector["nanoseconds"]
                .as_str()
                .unwrap()
                .parse::<i128>()
                .unwrap()
        );
        assert_eq!(
            one.since(
                two,
                TimeUnit::Hour,
                TimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .fields(),
            expected.map(|field| -field)
        );
        assert_eq!(
            two.until(
                one,
                TimeUnit::Hour,
                TimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .fields(),
            expected.map(|field| -field)
        );
        assert_eq!(
            two.since(
                one,
                TimeUnit::Hour,
                TimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .fields(),
            expected
        );
    }
    let one: PlainTime = "00:59:59.999999999".parse().unwrap();
    let two: PlainTime = "23:00:00".parse().unwrap();
    for vector in vectors["largestDifferences"].as_array().unwrap() {
        let unit = match vector["unit"].as_str().unwrap() {
            "hour" => TimeUnit::Hour,
            "minute" => TimeUnit::Minute,
            "second" => TimeUnit::Second,
            "millisecond" => TimeUnit::Millisecond,
            "microsecond" => TimeUnit::Microsecond,
            "nanosecond" => TimeUnit::Nanosecond,
            value => panic!("Unknown vector unit: {value}"),
        };
        let mut expected = [0i128; 10];
        for (index, value) in vector["fields"].as_array().unwrap().iter().enumerate() {
            expected[index + 4] = i128::from(value.as_i64().unwrap());
        }
        assert_eq!(
            one.until(two, unit, TimeUnit::Nanosecond, 1, RoundingMode::Trunc)
                .unwrap()
                .fields(),
            expected
        );
        assert_eq!(
            one.since(two, unit, TimeUnit::Nanosecond, 1, RoundingMode::Trunc)
                .unwrap()
                .fields(),
            expected.map(|field| -field)
        );
    }
    for sign in [1i128, -1] {
        let mut fields =
            [0, 0, 0, 0, 2_501_999_792_983, 36, 31, 999, 999, 999].map(|field| field * sign);
        let value = Duration::new(fields).unwrap();
        assert_eq!(
            value.time_nanoseconds(false).unwrap(),
            sign * 9_007_199_254_740_991_999_999_999
        );
        fields[9] += sign;
        assert!(Duration::new(fields).is_err());
    }
}

#[test]
fn rounding_increment_caps_distinguish_time_and_instant() {
    use formatjs_temporal::{DateTimeUnit, Duration, PlainTime, RoundingMode, TimeUnit};
    let time = PlainTime::new(0, 0, 0, 0).unwrap();
    let duration = Duration::new([0; 10]).unwrap();
    let instant = Instant::from_epoch_nanoseconds(0).unwrap();
    for (unit, maximum) in [
        (TimeUnit::Hour, 24),
        (TimeUnit::Minute, 60),
        (TimeUnit::Second, 60),
        (TimeUnit::Millisecond, 1000),
        (TimeUnit::Microsecond, 1000),
        (TimeUnit::Nanosecond, 1000),
    ] {
        for increment in [1, 2, maximum / 2] {
            assert_eq!(
                time.round(unit, increment, RoundingMode::HalfExpand)
                    .unwrap(),
                time
            );
            assert_eq!(
                duration
                    .round(
                        unit.into(),
                        unit.into(),
                        increment,
                        RoundingMode::HalfExpand
                    )
                    .unwrap(),
                duration
            );
        }
        for increment in [0, 7, maximum - 1, maximum, maximum + 1] {
            assert!(
                time.round(unit, increment, RoundingMode::HalfExpand)
                    .is_err()
            );
            assert!(
                duration
                    .round(
                        unit.into(),
                        unit.into(),
                        increment,
                        RoundingMode::HalfExpand
                    )
                    .is_err()
            );
        }
    }
    for (unit, maximum) in [
        (TimeUnit::Hour, 24),
        (TimeUnit::Minute, 1440),
        (TimeUnit::Second, 86_400),
        (TimeUnit::Millisecond, 86_400_000),
    ] {
        assert_eq!(
            instant
                .round(unit, maximum, RoundingMode::HalfExpand)
                .unwrap(),
            instant
        );
        for increment in [7, maximum + 1] {
            assert!(
                instant
                    .round(unit, increment, RoundingMode::HalfExpand)
                    .is_err()
            );
        }
    }
    assert!(
        instant
            .round(
                TimeUnit::Nanosecond,
                1_000_000_000,
                RoundingMode::HalfExpand
            )
            .is_ok()
    );
    assert!(
        instant
            .round(
                TimeUnit::Nanosecond,
                1_080_000_000,
                RoundingMode::HalfExpand
            )
            .is_err()
    );
    assert_eq!(
        duration
            .round(
                DateTimeUnit::Day,
                DateTimeUnit::Day,
                1001,
                RoundingMode::HalfExpand
            )
            .unwrap(),
        duration
    );
}

#[test]
fn instant_offsets_preserve_grammar_and_nanosecond_boundaries() {
    for sign in [-1i128, 1] {
        for (body, nanoseconds) in [
            ("00", 0),
            ("23", 82_800_000_000_000),
            ("2359", 86_340_000_000_000),
            ("23:59", 86_340_000_000_000),
            ("235959", 86_399_000_000_000),
            ("23:59:59", 86_399_000_000_000),
            ("23:59:59.1", 86_399_100_000_000),
            ("235959,000000001", 86_399_000_000_001),
            ("23:59:59.999999999", 86_399_999_999_999),
        ] {
            let input = format!(
                "1970-01-01T00:00:00{}{body}",
                if sign < 0 { '-' } else { '+' }
            );
            let instant: Instant = input.parse().unwrap();
            assert_eq!(instant.epoch_nanoseconds(), -sign * nanoseconds, "{input}");
        }
    }
    for offset in [
        "",
        "+",
        "+0",
        "+24",
        "+01:60",
        "+010260",
        "+01:02:60",
        "+0102:03",
        "+01:0203",
        "+01.5",
        "+01:02.5",
        "+01:02:03.",
        "+01:02:03,",
        "+01:02:03.1234567890",
        "+01:02:03.1x",
        "+01:02:03.1\n",
        "+01:02:03.+1",
        "+01:02:03.١",
        "−01",
        "+١٢",
        "+01 ",
    ] {
        let input = format!("1970-01-01T00:00:00{offset}");
        assert!(input.parse::<Instant>().is_err(), "{input:?}");
    }
}

#[test]
fn fixed_zone_identifiers_keep_minute_precision() {
    use formatjs_temporal::{TimeZone, TimeZoneRegistry};
    let registry = TimeZoneRegistry::empty();
    let epoch = Instant::from_epoch_nanoseconds(0).unwrap();
    for (input, canonical, nanoseconds) in [
        ("+00", "+00:00", 0),
        ("-00", "+00:00", 0),
        ("-0000", "+00:00", 0),
        ("-00:00", "+00:00", 0),
        ("+23", "+23:00", 82_800_000_000_000),
        ("-2359", "-23:59", -86_340_000_000_000),
        ("+23:59", "+23:59", 86_340_000_000_000),
    ] {
        let zone = registry.resolve(input).unwrap();
        assert_eq!(zone.identifier(), canonical);
        assert_eq!(zone.offset_nanoseconds(epoch), nanoseconds);
    }
    for input in [
        "+000000",
        "+00:00:00",
        "+010203.1",
        "+01:02:03,000000001",
        "+24",
        "+01:60",
        "−01",
        "+١٢",
        "+01\n",
    ] {
        assert!(registry.resolve(input).is_err(), "{input:?}");
    }
}

#[test]
fn clock_differences_round_exact_nanoseconds_before_number_fields() {
    use formatjs_temporal::{
        DateTimeUnit, FixedOffset, PlainDateTime, RoundingMode, ZonedDateTime, ZonedUnit,
    };
    // Expected values come from the adjacent multiples of ten, before Number conversion.
    let cases: [(i128, RoundingMode, i128, i128); 10] = [
        (
            9_007_199_254_741_005,
            RoundingMode::HalfExpand,
            9_007_199_254_741_010,
            -9_007_199_254_741_010,
        ),
        (
            -9_007_199_254_741_005,
            RoundingMode::HalfExpand,
            -9_007_199_254_741_010,
            9_007_199_254_741_010,
        ),
        (
            9_007_199_254_741_005,
            RoundingMode::HalfEven,
            9_007_199_254_741_000,
            -9_007_199_254_741_000,
        ),
        (
            9_007_199_254_741_015,
            RoundingMode::HalfEven,
            9_007_199_254_741_020,
            -9_007_199_254_741_020,
        ),
        (
            9_007_199_254_741_001,
            RoundingMode::Ceil,
            9_007_199_254_741_010,
            -9_007_199_254_741_000,
        ),
        (
            -9_007_199_254_741_001,
            RoundingMode::Floor,
            -9_007_199_254_741_010,
            9_007_199_254_741_000,
        ),
        (
            9_007_199_254_740_999,
            RoundingMode::Floor,
            9_007_199_254_740_990,
            -9_007_199_254_741_000,
        ),
        (
            -9_007_199_254_740_999,
            RoundingMode::Ceil,
            -9_007_199_254_740_990,
            9_007_199_254_741_000,
        ),
        (
            9_007_199_254_741_005,
            RoundingMode::Trunc,
            9_007_199_254_741_000,
            -9_007_199_254_741_000,
        ),
        (
            -9_007_199_254_741_005,
            RoundingMode::Trunc,
            -9_007_199_254_741_000,
            9_007_199_254_741_000,
        ),
    ];
    let zone = FixedOffset::new(0).unwrap();
    let zoned_start = ZonedDateTime::new(Instant::from_epoch_nanoseconds(0).unwrap(), zone);
    let plain_start = PlainDateTime::from_epoch_nanoseconds(0).unwrap();
    for (delta, mode, until, since) in cases {
        let zoned_end = ZonedDateTime::new(Instant::from_epoch_nanoseconds(delta).unwrap(), zone);
        let plain_end = PlainDateTime::from_epoch_nanoseconds(delta).unwrap();
        let mut expected_until = [0; 10];
        expected_until[9] = until;
        let mut expected_since = [0; 10];
        expected_since[9] = since;
        assert_eq!(
            zoned_start
                .until(
                    &zoned_end,
                    ZonedUnit::Nanosecond,
                    ZonedUnit::Nanosecond,
                    10,
                    mode
                )
                .unwrap()
                .fields(),
            expected_until,
            "zoned until: {delta} {mode:?}"
        );
        assert_eq!(
            zoned_start
                .since(
                    &zoned_end,
                    ZonedUnit::Nanosecond,
                    ZonedUnit::Nanosecond,
                    10,
                    mode
                )
                .unwrap()
                .fields(),
            expected_since,
            "zoned since: {delta} {mode:?}"
        );
        assert_eq!(
            plain_start
                .until(
                    plain_end,
                    DateTimeUnit::Nanosecond,
                    DateTimeUnit::Nanosecond,
                    10,
                    mode
                )
                .unwrap()
                .fields(),
            expected_until,
            "plain until: {delta} {mode:?}"
        );
        assert_eq!(
            plain_start
                .since(
                    plain_end,
                    DateTimeUnit::Nanosecond,
                    DateTimeUnit::Nanosecond,
                    10,
                    mode
                )
                .unwrap()
                .fields(),
            expected_since,
            "plain since: {delta} {mode:?}"
        );
    }
}

#[test]
fn clock_differences_round_exact_leading_microseconds_and_milliseconds() {
    use formatjs_temporal::{
        DateTimeUnit, FixedOffset, PlainDateTime, RoundingMode, ZonedDateTime, ZonedUnit,
    };
    let zone = FixedOffset::new(0).unwrap();
    for (plain_unit, zoned_unit, factor, field) in [
        (
            DateTimeUnit::Microsecond,
            ZonedUnit::Microsecond,
            1000i128,
            8usize,
        ),
        (
            DateTimeUnit::Millisecond,
            ZonedUnit::Millisecond,
            1_000_000i128,
            7usize,
        ),
    ] {
        let half_span = 9_007_199_254_741_005i128 * factor / 2;
        let zoned_start =
            ZonedDateTime::new(Instant::from_epoch_nanoseconds(-half_span).unwrap(), zone);
        let zoned_end =
            ZonedDateTime::new(Instant::from_epoch_nanoseconds(half_span).unwrap(), zone);
        let plain_start = PlainDateTime::from_epoch_nanoseconds(-half_span).unwrap();
        let plain_end = PlainDateTime::from_epoch_nanoseconds(half_span).unwrap();
        let mut expected = [0; 10];
        expected[field] = 9_007_199_254_741_010;
        assert_eq!(
            zoned_start
                .until(
                    &zoned_end,
                    zoned_unit,
                    zoned_unit,
                    10,
                    RoundingMode::HalfExpand
                )
                .unwrap()
                .fields(),
            expected,
            "zoned {zoned_unit:?}"
        );
        assert_eq!(
            plain_start
                .until(
                    plain_end,
                    plain_unit,
                    plain_unit,
                    10,
                    RoundingMode::HalfExpand
                )
                .unwrap()
                .fields(),
            expected,
            "plain {plain_unit:?}"
        );
    }
}

#[test]
fn zoned_round_rejects_invalid_increments_before_offset_queries() {
    use core::cell::Cell;
    use formatjs_temporal::{
        Error, RoundingMode, TimeZone, TransitionDirection, ZonedDateTime, ZonedUnit,
    };
    #[derive(Clone, Copy)]
    struct CountingZone<'a>(&'a Cell<usize>);
    impl TimeZone for CountingZone<'_> {
        fn offset_nanoseconds(&self, _: Instant) -> i128 {
            self.0.set(self.0.get() + 1);
            0
        }
        fn visit_offsets(&self, visitor: &mut dyn FnMut(i128)) {
            visitor(0);
        }
        fn transition(&self, _: Instant, _: TransitionDirection) -> Option<Instant> {
            None
        }
    }
    let queries = Cell::new(0);
    let value = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(0).unwrap(),
        CountingZone(&queries),
    );
    for (unit, increment) in [(ZonedUnit::Nanosecond, 3), (ZonedUnit::Hour, 24)] {
        queries.set(0);
        assert_eq!(
            value.round(unit, increment, RoundingMode::HalfExpand).err(),
            Some(Error::InvalidRoundingOptions)
        );
        assert_eq!(queries.get(), 0, "{unit:?} increment {increment}");
    }
}

fn day_window_gap_near_maximum()
-> formatjs_temporal::ZonedDateTime<formatjs_temporal::TransitionZone<'static>> {
    use formatjs_temporal::{OffsetTransition, TransitionZone, ZonedDateTime};
    static EVENTS: [OffsetTransition; 1] = [OffsetTransition {
        epoch_seconds: 8_639_999_914_500,
        offset_seconds: 9_900,
    }];
    ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(8_639_999_829_900_000_000_000).unwrap(),
        TransitionZone::new(6_300, &EVENTS, None).unwrap(),
    )
}

#[test]
fn day_rounding_retries_toward_origin_when_first_bound_overshoots() {
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let jump = OffsetTransition {
        epoch_seconds: 42 * 3_600,
        offset_seconds: 12 * 3_600,
    };
    let forward = [jump];
    let backward = [
        jump,
        OffsetTransition {
            epoch_seconds: 48 * 3_600,
            offset_seconds: -23 * 3_600,
        },
    ];
    for (transitions, start, end, outer, outer_hour, outward) in [
        (&forward[..], 24, 61, "P2D", 72, RoundingMode::Ceil),
        (&backward[..], 125, 53, "-P2D", 42, RoundingMode::Floor),
    ] {
        let zone = TransitionZone::new(-23 * 3_600, transitions, None).unwrap();
        let zoned = |value| {
            ZonedDateTime::new(Instant::from_epoch_nanoseconds(value * hour).unwrap(), zone)
        };
        let origin = zoned(start);
        let target = zoned(end);
        assert_eq!(
            origin
                .checked_add(outer.parse().unwrap(), Overflow::Constrain)
                .unwrap()
                .instant()
                .epoch_nanoseconds(),
            outer_hour * hour
        );
        for (mode, expected) in [
            (RoundingMode::Trunc, "PT0S"),
            (outward, outer),
            (RoundingMode::HalfExpand, outer),
        ] {
            assert_eq!(
                origin
                    .until(&target, DateTimeUnit::Day, DateTimeUnit::Day, 2, mode)
                    .unwrap()
                    .to_string(),
                expected
            );
        }
    }
}

#[test]
fn week_rounding_finds_an_exact_rebased_bound_in_a_wide_gap() {
    use formatjs_temporal::calendar::Calendar;
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let epoch = "2024-09-11T00:00Z"
        .parse::<Instant>()
        .unwrap()
        .epoch_nanoseconds();
    let hour = 3_600_000_000_000;
    let seconds = (epoch / 1_000_000_000) as i64;
    let transitions = [(-20, 22), (17, -18), (47, 6)].map(|(when, offset)| OffsetTransition {
        epoch_seconds: seconds + when * 3_600,
        offset_seconds: offset * 3_600,
    });
    let zone = TransitionZone::new(-23 * 3_600, &transitions, None).unwrap();
    let at_hour = |value: i128| {
        ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(epoch + value * hour).unwrap(),
            zone,
        )
        .with_calendar(Calendar::Coptic)
    };
    let origin = at_hour(-97);
    let target = at_hour(10);
    assert_eq!(
        origin
            .checked_add("P1W".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .instant(),
        target.instant()
    );
    for mode in [
        RoundingMode::Floor,
        RoundingMode::Ceil,
        RoundingMode::HalfEven,
    ] {
        assert_eq!(
            origin
                .until(&target, DateTimeUnit::Month, DateTimeUnit::Week, 1, mode)
                .unwrap()
                .to_string(),
            "P1W",
            "{mode:?}"
        );
    }
}

#[test]
fn day_rounding_finds_exact_rebased_endpoints_across_wide_gaps() {
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let residual_day = [(9, 0), (20, 16), (39, -22)];
    let past_adjacent = [(9, 2), (45, 23), (47, -23), (54, 19)];
    for (initial, events, start, center, end, increment, expected) in [
        (
            -23,
            &residual_day[..],
            "2024-01-01T23:00Z",
            "2024-02-01T00:00Z",
            32,
            3,
            "P33D",
        ),
        (
            -22,
            &past_adjacent[..],
            "2024-01-01T22:00Z",
            "2024-02-01T00:00Z",
            45,
            2,
            "P34D",
        ),
        (
            -22,
            &past_adjacent[..],
            "+275760-08-10T22:00Z",
            "+275760-09-10T00:00Z",
            45,
            2,
            "P34D",
        ),
    ] {
        let epoch = center.parse::<Instant>().unwrap().epoch_nanoseconds();
        let seconds = (epoch / 1_000_000_000) as i64;
        let transitions: Vec<_> = events
            .iter()
            .map(|&(when, offset)| OffsetTransition {
                epoch_seconds: seconds + when * 3_600,
                offset_seconds: offset * 3_600,
            })
            .collect();
        let zone = TransitionZone::new(initial * 3_600, &transitions, None).unwrap();
        let origin = ZonedDateTime::new(start.parse().unwrap(), zone);
        let target = ZonedDateTime::new(
            Instant::from_epoch_nanoseconds(epoch + end * hour).unwrap(),
            zone,
        );
        assert_eq!(
            origin
                .checked_add(expected.parse().unwrap(), Overflow::Constrain)
                .unwrap()
                .instant(),
            target.instant()
        );
        for mode in [
            RoundingMode::Floor,
            RoundingMode::Ceil,
            RoundingMode::HalfEven,
        ] {
            assert_eq!(
                origin
                    .until(
                        &target,
                        DateTimeUnit::Month,
                        DateTimeUnit::Day,
                        increment,
                        mode
                    )
                    .unwrap()
                    .to_string(),
                expected,
                "{mode:?}"
            );
        }
    }
}

#[test]
fn day_rounding_retries_a_rebased_lower_bound() {
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let march: Instant = "2024-03-01T00:00Z".parse().unwrap();
    let epoch = march.epoch_nanoseconds();
    let hour = 3_600_000_000_000;
    let seconds = (epoch / 1_000_000_000) as i64;
    let transitions = [(9, 0), (20, 16), (39, -22)].map(|(when, offset)| OffsetTransition {
        epoch_seconds: seconds + when * 3_600,
        offset_seconds: offset * 3_600,
    });
    let zone = TransitionZone::new(-23 * 3_600, &transitions, None).unwrap();
    let origin = ZonedDateTime::new("2024-02-01T23:00Z".parse().unwrap(), zone);
    let target = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(epoch + 33 * hour).unwrap(),
        zone,
    );
    for (duration, hours) in [("P27D", -25), ("P30D", 46), ("P1M", 45)] {
        assert_eq!(
            origin
                .checked_add(duration.parse().unwrap(), Overflow::Constrain)
                .unwrap()
                .instant()
                .epoch_nanoseconds(),
            epoch + hours * hour,
            "{duration}"
        );
    }
    for (mode, expected) in [
        (RoundingMode::Floor, "P27D"),
        (RoundingMode::Trunc, "P27D"),
        (RoundingMode::Ceil, "P1M"),
        (RoundingMode::HalfExpand, "P1M"),
    ] {
        assert_eq!(
            origin
                .until(&target, DateTimeUnit::Month, DateTimeUnit::Day, 3, mode)
                .unwrap()
                .to_string(),
            expected,
            "{mode:?}"
        );
    }
}

#[test]
fn day_rounding_crosses_both_early_occurrences_in_a_wide_fold() {
    use formatjs_temporal::{
        DateTimeUnit, OffsetTransition, Overflow, RoundingMode, TransitionZone, ZonedDateTime,
    };
    let hour = 3_600_000_000_000;
    let transitions = [OffsetTransition {
        epoch_seconds: 72 * 3_600,
        offset_seconds: -23 * 3_600,
    }];
    let zone = TransitionZone::new(23 * 3_600, &transitions, None).unwrap();
    let zoned =
        |value| ZonedDateTime::new(Instant::from_epoch_nanoseconds(value * hour).unwrap(), zone);
    let origin = zoned(23);
    let target = zoned(73);
    for (days, endpoint) in [("P1D", 47), ("P2D", 71), ("P3D", 141)] {
        assert_eq!(
            origin
                .checked_add(days.parse().unwrap(), Overflow::Constrain)
                .unwrap()
                .instant()
                .epoch_nanoseconds(),
            endpoint * hour
        );
    }
    for (mode, expected) in [
        (RoundingMode::Trunc, "P2D"),
        (RoundingMode::Ceil, "P3D"),
        (RoundingMode::HalfExpand, "P2D"),
    ] {
        assert_eq!(
            origin
                .until(&target, DateTimeUnit::Day, DateTimeUnit::Day, 1, mode)
                .unwrap()
                .to_string(),
            expected
        );
    }
}

#[test]
fn day_window_gap_literal_endpoints() {
    use formatjs_temporal::{Duration, Overflow};
    let origin = day_window_gap_near_maximum();
    let one_day: Duration = "P1D".parse().unwrap();
    let shifted = origin.checked_add(one_day, Overflow::Constrain).unwrap();
    assert_eq!(
        shifted.instant().epoch_nanoseconds(),
        8_639_999_916_300_000_000_000
    );
    assert_eq!(
        origin
            .checked_add("P1DT30M".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        8_639_999_918_100_000_000_000
    );
    assert_eq!(
        origin
            .checked_add("P2D".parse().unwrap(), Overflow::Constrain)
            .unwrap()
            .instant()
            .epoch_nanoseconds(),
        8_639_999_999_100_000_000_000
    );
    assert!(shifted.checked_add(one_day, Overflow::Constrain).is_err());
}

#[test]
fn day_window_gap_total_retains_original_clock() {
    use formatjs_temporal::DateTimeUnit;
    assert_eq!(
        day_window_gap_near_maximum()
            .total_duration("P1DT30M".parse().unwrap(), DateTimeUnit::Day)
            .unwrap(),
        1.0217391304347827
    );
}

#[test]
fn day_window_gap_round_day_half_expand() {
    use formatjs_temporal::{DateTimeUnit as U, RoundingMode as R};
    assert_eq!(
        day_window_gap_near_maximum()
            .round_duration("P1DT30M".parse().unwrap(), U::Day, U::Day, 1, R::HalfExpand)
            .unwrap()
            .fields(),
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
    );
}

#[test]
fn day_window_gap_round_day_ceil() {
    use formatjs_temporal::{DateTimeUnit as U, RoundingMode as R};
    assert_eq!(
        day_window_gap_near_maximum()
            .round_duration("P1DT30M".parse().unwrap(), U::Day, U::Day, 1, R::Ceil)
            .unwrap()
            .fields(),
        [0, 0, 0, 2, 0, 0, 0, 0, 0, 0]
    );
}

#[test]
fn day_window_gap_round_exact_minute() {
    use formatjs_temporal::{DateTimeUnit as U, RoundingMode as R};
    assert_eq!(
        day_window_gap_near_maximum()
            .round_duration(
                "P1DT30M".parse().unwrap(),
                U::Day,
                U::Minute,
                1,
                R::HalfExpand
            )
            .unwrap()
            .fields(),
        [0, 0, 0, 1, 0, 30, 0, 0, 0, 0]
    );
}

#[test]
fn day_window_maximum_zero_day() {
    use formatjs_temporal::{DateTimeUnit as U, FixedOffset, RoundingMode as R, ZonedDateTime};
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert_eq!(
        maximum
            .until(&maximum, U::Day, U::Day, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
    assert_eq!(
        maximum
            .since(&maximum, U::Day, U::Day, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
    assert!(
        maximum
            .round_duration("PT0S".parse().unwrap(), U::Day, U::Day, 1, R::Trunc)
            .is_err()
    );
}

#[test]
fn day_window_maximum_zero_minute() {
    use formatjs_temporal::{DateTimeUnit as U, FixedOffset, RoundingMode as R, ZonedDateTime};
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert_eq!(
        maximum
            .until(&maximum, U::Day, U::Minute, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
    assert_eq!(
        maximum
            .since(&maximum, U::Day, U::Minute, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
    assert!(
        maximum
            .round_duration("PT0S".parse().unwrap(), U::Day, U::Minute, 1, R::Trunc)
            .is_err()
    );
    for (smallest, increment) in [(U::Minute, 7), (U::Hour, 24)] {
        assert!(
            maximum
                .until(&maximum, U::Day, smallest, increment, R::Trunc)
                .is_err()
        );
        assert!(
            maximum
                .since(&maximum, U::Day, smallest, increment, R::Trunc)
                .is_err()
        );
    }
}

#[test]
fn day_window_maximum_zero_nanosecond() {
    use formatjs_temporal::{DateTimeUnit as U, FixedOffset, RoundingMode as R, ZonedDateTime};
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert_eq!(
        maximum
            .until(&maximum, U::Day, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
    assert_eq!(
        maximum
            .round_duration("PT0S".parse().unwrap(), U::Day, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0; 10]
    );
}

#[test]
fn day_window_maximum_exact_minute() {
    use formatjs_temporal::{DateTimeUnit as U, FixedOffset, RoundingMode as R, ZonedDateTime};
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    let before = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS - 60_000_000_000).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert!(
        before
            .until(&maximum, U::Day, U::Minute, 1, R::Trunc)
            .is_err()
    );
}

#[test]
fn day_window_maximum_exact_nanosecond() {
    use formatjs_temporal::{DateTimeUnit as U, FixedOffset, RoundingMode as R, ZonedDateTime};
    let maximum = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    let before = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS - 60_000_000_000).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert_eq!(
        before
            .until(&maximum, U::Day, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
    );
    assert_eq!(
        before
            .since(&maximum, U::Day, U::Nanosecond, 1, R::Trunc)
            .unwrap()
            .fields(),
        [0, 0, 0, 0, 0, -1, 0, 0, 0, 0]
    );
}

#[test]
fn year_month_addition_checks_intermediate_full_date_range() {
    use formatjs_temporal::calendar::Calendar;
    use formatjs_temporal::{DateFields, Duration, Overflow, PlainYearMonth};
    let origin = PlainYearMonth::new(275760, 8, 22)
        .unwrap()
        .with_calendar(Calendar::IslamicCivil)
        .unwrap();
    let target = PlainYearMonth::new(275760, 9, 21)
        .unwrap()
        .with_calendar(Calendar::IslamicCivil)
        .unwrap();
    assert_eq!(origin.epoch_day(), 99_999_978);
    assert_eq!(target.epoch_day(), 100_000_008);
    assert_eq!(
        origin
            .with_fields(
                DateFields {
                    month: Some(6),
                    ..DateFields::default()
                },
                Overflow::Constrain
            )
            .unwrap()
            .epoch_day(),
        100_000_008
    );
    let forward: Duration = "P1M".parse().unwrap();
    let backward: Duration = "-P1M".parse().unwrap();
    assert!(origin.checked_add(forward, Overflow::Constrain).is_err());
    assert!(
        origin
            .checked_subtract(backward, Overflow::Constrain)
            .is_err()
    );
}

#[test]
fn duration_comparison_validates_calendar_prefix_without_plain_clock_endpoints() {
    use core::cmp::Ordering::{Equal, Less};
    use formatjs_temporal::{Duration, FixedOffset, PlainDate, ZonedDateTime};
    let maximum: PlainDate = "+275760-09-13".parse().unwrap();
    assert!(
        maximum
            .compare_durations("P1YT1H".parse().unwrap(), "P1YT2H".parse().unwrap())
            .is_err()
    );
    assert_eq!(
        maximum
            .compare_durations("P1D".parse().unwrap(), "P2D".parse().unwrap())
            .unwrap(),
        Less
    );
    let prefix: PlainDate = "+275760-08-13".parse().unwrap();
    assert_eq!(
        prefix
            .compare_durations("P1M1D".parse().unwrap(), "P1M2D".parse().unwrap())
            .unwrap(),
        Less
    );
    let one: Duration = "P1D".parse().unwrap();
    let zoned = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(MAX_EPOCH_NANOSECONDS).unwrap(),
        FixedOffset::new(0).unwrap(),
    );
    assert!(
        zoned
            .compare_durations("P1DT1H".parse().unwrap(), "P1DT2H".parse().unwrap())
            .is_err()
    );
    assert_eq!(
        zoned
            .compare_durations("PT1H".parse().unwrap(), "PT2H".parse().unwrap())
            .unwrap(),
        Less
    );
    assert_eq!(zoned.compare_durations(one, one).unwrap(), Equal);
}

#[test]
fn transition_detects_discontinuous_fixed_footer() {
    use formatjs_temporal::{
        FutureRule, OffsetTransition, TimeZone, TransitionDirection, TransitionZone,
    };
    let rows = [OffsetTransition {
        epoch_seconds: 0,
        offset_seconds: 0,
    }];
    let zone = TransitionZone::new(0, &rows, Some(FutureRule::new(3600, None).unwrap())).unwrap();
    let seam = Instant::from_epoch_nanoseconds(1_000_000_000).unwrap();
    let earlier = Instant::from_epoch_nanoseconds(999_999_999).unwrap();
    let later = Instant::from_epoch_nanoseconds(1_000_000_001).unwrap();
    assert_eq!(zone.offset_nanoseconds(earlier), 0);
    assert_eq!(zone.offset_nanoseconds(seam), 3_600_000_000_000);
    assert_eq!(
        zone.transition(earlier, TransitionDirection::Next),
        Some(seam)
    );
    assert_eq!(
        zone.transition(later, TransitionDirection::Previous),
        Some(seam)
    );
    assert_eq!(zone.transition(seam, TransitionDirection::Next), None);
    assert_eq!(zone.transition(seam, TransitionDirection::Previous), None);
}

#[test]
fn previous_transition_includes_minimum_instant() {
    use formatjs_temporal::{
        FutureRule, OffsetTransition, TimeZone, TransitionDirection, TransitionRule,
        TransitionZone, ZonedDateTime,
    };

    let minimum = Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS).unwrap();
    let next_nanosecond = Instant::from_epoch_nanoseconds(-MAX_EPOCH_NANOSECONDS + 1).unwrap();
    let rows = [OffsetTransition {
        epoch_seconds: (-MAX_EPOCH_NANOSECONDS / 1_000_000_000) as i64,
        offset_seconds: 3600,
    }];
    let footer = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Day {
                day: 109,
                seconds: 0,
            },
            TransitionRule::Day {
                day: 300,
                seconds: 0,
            },
        )),
    )
    .unwrap();
    for (name, zone) in [
        ("explicit", TransitionZone::new(0, &rows, None).unwrap()),
        ("footer", TransitionZone::new(0, &[], Some(footer)).unwrap()),
    ] {
        assert_eq!(
            zone.offset_nanoseconds(minimum),
            3_600_000_000_000,
            "{name}"
        );
        let zoned = ZonedDateTime::new(next_nanosecond, zone);
        assert_eq!(
            zoned
                .transition(TransitionDirection::Previous)
                .map(|value| value.instant()),
            Some(minimum),
            "{name}"
        );
        assert_eq!(
            zone.transition(minimum, TransitionDirection::Previous),
            None,
            "{name}"
        );
    }
    let no_change = TransitionZone::new(3600, &rows, None).unwrap();
    assert_eq!(
        no_change.transition(next_nanosecond, TransitionDirection::Previous),
        None
    );
}

#[test]
fn westward_year_window_carries_previous_rule_year_daylight_offset() {
    use formatjs_temporal::{
        FutureRule, TimeZone, TransitionDirection, TransitionRule, TransitionZone,
    };
    let footer = FutureRule::new(
        0,
        Some((
            3600,
            TransitionRule::Julian {
                day: 365,
                seconds: 144 * 3600,
            },
            TransitionRule::Julian {
                day: 364,
                seconds: 120 * 3600,
            },
        )),
    )
    .unwrap();
    let zone = TransitionZone::new(0, &[], Some(footer)).unwrap();
    let january: Instant = "2025-01-01T00:00:00Z".parse().unwrap();
    let end: Instant = "2025-01-03T23:00:00Z".parse().unwrap();
    let start: Instant = "2024-01-06T00:00:00Z".parse().unwrap();
    let before_january = Instant::from_epoch_nanoseconds(january.epoch_nanoseconds() - 1).unwrap();
    let before_end = Instant::from_epoch_nanoseconds(end.epoch_nanoseconds() - 1).unwrap();
    assert_eq!(zone.offset_nanoseconds(before_january), 3_600_000_000_000);
    assert_eq!(zone.offset_nanoseconds(january), 3_600_000_000_000);
    assert_eq!(zone.offset_nanoseconds(before_end), 3_600_000_000_000);
    assert_eq!(zone.offset_nanoseconds(end), 0);
    assert_eq!(
        zone.transition(before_january, TransitionDirection::Next),
        Some(end)
    );
    assert_eq!(
        zone.transition(january, TransitionDirection::Previous),
        Some(start)
    );
}
