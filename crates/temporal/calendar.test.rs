use formatjs_temporal::{
    CalendarProvider, CalendarRef, CalendarRegistry, DateFields, DateTimeUnit, Duration,
    FixedOffset, Instant, NANOSECONDS_PER_DAY, OffsetTransition, Overflow, PlainDate,
    PlainDateTime, PlainMonthDay, PlainTime, PlainYearMonth, Precision, RoundingMode,
    TemporalContext, TimeUnit, TimeZoneRegistry, TransitionDirection, TransitionZone,
    YearMonthUnit, ZonedDateTime,
    calendar::{Calendar, MonthCode},
    table_calendar::{LunisolarData, TableCalendar, TableCalendarId},
};

fn month_code(text: &str) -> MonthCode {
    MonthCode {
        number: text[1..3].parse().unwrap(),
        leap: text.ends_with('L'),
    }
}
fn zero_zone() -> FixedOffset {
    FixedOffset::new(0).unwrap()
}

fn one_year_lunisolar_calendar(checkpoints: &'static [i64; 1]) -> TableCalendar<'static> {
    TableCalendar::lunisolar(
        TableCalendarId::Chinese,
        LunisolarData {
            first_year: 2020,
            end_day: checkpoints[0] + 348,
            checkpoints,
            month_checkpoints: &[0],
            dictionary: &[0],
            years: "AA",
        },
    )
    .unwrap()
}

#[test]
fn zoned_difference_queries_calendar_for_selected_gap_date() {
    let transitions = [OffsetTransition {
        epoch_seconds: 1_615_705_200,
        offset_seconds: -14_400,
    }];
    let zone = TransitionZone::new(-18_000, &transitions, None).unwrap();
    // One table ends before March 14. The other begins on March 14.
    for checkpoints in [&[18_352], &[18_700]] {
        let calendar = one_year_lunisolar_calendar(checkpoints);
        let zoned = |seconds: i128| {
            ZonedDateTime::new_in_calendar(
                Instant::from_epoch_nanoseconds(seconds * 1_000_000_000).unwrap(),
                zone,
                calendar,
            )
        };
        let origin = zoned(1_615_620_600); // March 13 at 02:30.
        let difference = |target| {
            origin.until(
                &zoned(target),
                DateTimeUnit::Day,
                DateTimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc,
            )
        };
        assert_eq!(
            difference(1_615_705_800), // 03:10, before compatible 03:30.
            Ok("PT23H40M".parse::<Duration>().unwrap()),
            "{checkpoints:?}"
        );
        assert_eq!(
            difference(1_615_707_000), // 03:30 requires a difference between dates.
            Err(formatjs_temporal::Error::OutOfRange),
            "{checkpoints:?}"
        );
    }
}

#[test]
fn zoned_difference_on_same_day_needs_no_calendar_coverage() {
    let calendar = one_year_lunisolar_calendar(&[18_352]);
    let transitions = [
        OffsetTransition {
            epoch_seconds: 1_615_705_200,
            offset_seconds: -14_400,
        },
        OffsetTransition {
            epoch_seconds: 1_636_264_800,
            offset_seconds: -18_000,
        },
    ];
    let zone = TransitionZone::new(-18_000, &transitions, None).unwrap();
    let zoned = |seconds: i128| {
        ZonedDateTime::new_in_calendar(
            Instant::from_epoch_nanoseconds(seconds * 1_000_000_000).unwrap(),
            zone,
            calendar,
        )
    };
    let difference = |first, second| {
        zoned(first).until(
            &zoned(second),
            DateTimeUnit::Day,
            DateTimeUnit::Nanosecond,
            1,
            RoundingMode::Trunc,
        )
    };
    for (first, second, expected) in [
        (1_615_705_800, 1_615_707_000, "PT20M"),
        (1_615_707_000, 1_615_705_800, "-PT20M"),
        // Both instants show November 7 at 01:30, on opposite sides of the fold.
        (1_636_263_000, 1_636_266_600, "PT1H"),
        (1_636_266_600, 1_636_263_000, "-PT1H"),
        (1_636_266_600, 1_636_266_600, "PT0S"),
    ] {
        assert_eq!(
            difference(first, second),
            Ok(expected.parse::<Duration>().unwrap())
        );
    }
}

fn unit(text: &str) -> DateTimeUnit {
    text.parse().unwrap()
}
fn date_fields(year: i32, code: MonthCode, day: i32) -> DateFields<'static> {
    DateFields {
        year: Some(year),
        month_code: Some(code),
        day: Some(day),
        ..DateFields::default()
    }
}

fn check_oracle<C: CalendarProvider>(
    row: &[&str],
    calendar: C,
    registry: CalendarRegistry<'_>,
) -> usize {
    let epoch = row[2].parse::<i64>().unwrap();
    let date = PlainDate::from_epoch_day_in(epoch, calendar).unwrap();
    let noon = PlainTime::new(12, 0, 0, 0).unwrap();
    let datetime = date.to_date_time(noon).unwrap();
    let zoned = Instant::from_epoch_nanoseconds(datetime.epoch_nanoseconds())
        .ok()
        .map(|instant| ZonedDateTime::new_in_calendar(instant, zero_zone(), calendar));
    match row[0] {
        "F" => {
            let first = match PlainDate::from_calendar_fields(
                calendar,
                DateFields {
                    year: Some(row[3].parse().unwrap()),
                    month: Some(1),
                    day: Some(1),
                    ..DateFields::default()
                },
                Overflow::Reject,
            ) {
                Ok(value) => value,
                Err(formatjs_temporal::Error::OutOfRange) => date,
                Err(error) => panic!("first day {row:?}: {error:?}"),
            };
            let updated = first
                .with_fields(
                    DateFields {
                        month: Some(row[4].parse().unwrap()),
                        day: Some(row[6].parse().unwrap()),
                        ..DateFields::default()
                    },
                    Overflow::Reject,
                )
                .unwrap();
            assert_eq!(updated.epoch_day(), epoch, "field update {row:?}");
            let parsed = TemporalContext::new(registry, TimeZoneRegistry::empty())
                .parse_date(&date.to_string())
                .unwrap();
            assert_eq!(
                parsed.calendar_fields().unwrap(),
                date.calendar_fields().unwrap(),
                "{row:?}"
            );
            assert_eq!(parsed.calendar_id(), row[1]);
            let expected = (
                row[3].parse::<i32>().unwrap(),
                row[4].parse::<u8>().unwrap(),
                month_code(row[5]),
                row[6].parse::<u8>().unwrap(),
            );
            for fields in [
                date.calendar_fields().unwrap(),
                datetime.calendar_fields().unwrap(),
            ]
            .into_iter()
            .chain(
                zoned
                    .as_ref()
                    .map(|value| value.local().unwrap().calendar_fields().unwrap()),
            ) {
                assert_eq!(
                    (fields.year, fields.month, fields.month_code, fields.day),
                    expected,
                    "{row:?}"
                );
            }
            assert_eq!(
                date.days_in_month().unwrap(),
                row[7].parse::<u8>().unwrap(),
                "{row:?}"
            );
            assert_eq!(
                date.months_in_year().unwrap(),
                row[8].parse::<u8>().unwrap(),
                "{row:?}"
            );
            assert_eq!(
                date.days_in_year().unwrap(),
                row[9].parse::<u16>().unwrap(),
                "{row:?}"
            );
            assert_eq!(
                date.day_of_year().unwrap(),
                row[12].parse::<u16>().unwrap(),
                "{row:?}"
            );
            assert_eq!(date.day_of_week(), ((epoch + 3).rem_euclid(7) + 1) as u8);
            let fields = date_fields(expected.0, expected.2, i32::from(expected.3));
            assert!(date.equals(
                PlainDate::from_calendar_fields(calendar, fields, Overflow::Reject).unwrap()
            ));
            if row[10] == "-" {
                assert!(date.era().unwrap().is_none());
            } else {
                let era = date.era().unwrap().unwrap();
                assert_eq!(
                    (era.name, era.year),
                    (row[10], row[11].parse().unwrap()),
                    "{row:?}"
                );
                let bag = DateFields {
                    year: None,
                    era: Some(era.name),
                    era_year: Some(era.year),
                    ..fields
                };
                assert!(date.equals(
                    PlainDate::from_calendar_fields(calendar, bag, Overflow::Reject).unwrap()
                ));
            }
            let year_month = PlainYearMonth::from_epoch_day_in(epoch, calendar).unwrap();
            assert_eq!(
                year_month.calendar_fields().unwrap(),
                date.calendar_fields().unwrap(),
                "{row:?}"
            );
            assert_eq!(
                year_month.days_in_month().unwrap(),
                date.days_in_month().unwrap()
            );
            assert_eq!(
                year_month.months_in_year().unwrap(),
                date.months_in_year().unwrap()
            );
            assert_eq!(
                year_month.days_in_year().unwrap(),
                date.days_in_year().unwrap()
            );
            assert_eq!(
                year_month.in_leap_year().unwrap(),
                date.in_leap_year().unwrap()
            );
            assert_eq!(year_month.era().unwrap(), date.era().unwrap());
            assert!(
                year_month
                    .to_plain_date(expected.3, Overflow::Reject)
                    .unwrap()
                    .equals(date)
            );
            let normalized =
                PlainYearMonth::from_calendar_fields(calendar, fields, Overflow::Reject);
            let updated = year_month.with_fields(
                DateFields {
                    month: Some(i32::from(expected.1)),
                    ..DateFields::default()
                },
                Overflow::Reject,
            );
            let first = epoch - i64::from(expected.3) + 1;
            if first < PlainYearMonth::new(-271821, 4, 1).unwrap().epoch_day() {
                assert!(normalized.is_err(), "{row:?}");
                assert!(updated.is_err(), "{row:?}");
                assert!(PlainYearMonth::parse_in(&year_month.to_string(), calendar).is_err());
            } else {
                let normalized = normalized.unwrap();
                assert_eq!(normalized.epoch_day(), first, "{row:?}");
                assert_eq!(updated.unwrap().epoch_day(), first, "updated {row:?}");
                assert!(
                    normalized.equals(
                        PlainYearMonth::parse_in(&year_month.to_string(), calendar).unwrap()
                    )
                );
            }
            0
        }
        "A" | "X" => {
            let mut fields = [0; 10];
            fields[unit(row[3]) as usize] = row[4].parse().unwrap();
            let duration = Duration::new(fields).unwrap();
            let result = date.checked_add(duration, Overflow::Constrain);
            if row[0] == "X" {
                assert!(result.is_err(), "{row:?}");
                assert!(
                    datetime.checked_add(duration, Overflow::Constrain).is_err(),
                    "{row:?}"
                );
                return 3;
            }
            let end = row[5].parse::<i64>().unwrap();
            if date.calendar_fields().unwrap().day == 1 && matches!(row[3], "year" | "month") {
                let start = PlainYearMonth::from_epoch_day_in(epoch, calendar).unwrap();
                let actual = start.checked_add(duration, Overflow::Constrain).unwrap();
                assert_eq!(actual.epoch_day(), end, "{row:?}");
                assert_eq!(actual.calendar_id(), calendar.id());
            }
            let result = result.unwrap();
            assert_eq!(result.epoch_day(), end, "{row:?}");
            assert_eq!(result.calendar_id(), date.calendar_id());
            let days = Duration::new([0, 0, 0, i128::from(end - epoch), 0, 0, 0, 0, 0, 0]).unwrap();
            assert_eq!(
                date.compare_durations(duration, days).unwrap(),
                core::cmp::Ordering::Equal,
                "{row:?}"
            );
            let result = datetime.checked_add(duration, Overflow::Constrain).unwrap();
            assert_eq!(
                (
                    result.date().epoch_day(),
                    result.time(),
                    result.calendar_id()
                ),
                (end, noon, date.calendar_id()),
                "{row:?}"
            );
            if let Some(zoned) = zoned
                .filter(|_| Instant::from_epoch_nanoseconds(result.epoch_nanoseconds()).is_ok())
            {
                let result = zoned.checked_add(duration, Overflow::Constrain).unwrap();
                assert_eq!(
                    (
                        result.local().unwrap().date().epoch_day(),
                        result.calendar_id()
                    ),
                    (end, date.calendar_id()),
                    "{row:?}"
                );
            }
            1
        }
        "D" => {
            let end = PlainDate::from_epoch_day_in(row[3].parse().unwrap(), calendar).unwrap();
            let expected: Vec<i128> = row[5..9].iter().map(|n| n.parse().unwrap()).collect();
            let largest = unit(row[4]);
            if date.calendar_fields().unwrap().day == 1
                && end.calendar_fields().unwrap().day == 1
                && matches!(row[4], "year" | "month")
            {
                let start = PlainYearMonth::from_epoch_day_in(epoch, calendar).unwrap();
                let finish = PlainYearMonth::from_epoch_day_in(end.epoch_day(), calendar).unwrap();
                let unit = if row[4] == "year" {
                    YearMonthUnit::Year
                } else {
                    YearMonthUnit::Month
                };
                assert_eq!(
                    &start
                        .until(finish, unit, YearMonthUnit::Month, 1, RoundingMode::Trunc)
                        .unwrap()
                        .fields()[..4],
                    expected.as_slice(),
                    "{row:?}"
                );
                let inverse: Vec<_> = expected.iter().map(|value| -value).collect();
                assert_eq!(
                    &start
                        .since(finish, unit, YearMonthUnit::Month, 1, RoundingMode::Trunc)
                        .unwrap()
                        .fields()[..4],
                    inverse.as_slice(),
                    "{row:?}"
                );
            }
            let end_time = end.to_date_time(noon).unwrap();
            let end_zoned = Instant::from_epoch_nanoseconds(end_time.epoch_nanoseconds())
                .ok()
                .map(|instant| ZonedDateTime::new_in_calendar(instant, zero_zone(), calendar));
            for value in [
                date.until(end, largest, DateTimeUnit::Day, 1, RoundingMode::Trunc)
                    .unwrap(),
                datetime
                    .until(
                        end_time,
                        largest,
                        DateTimeUnit::Nanosecond,
                        1,
                        RoundingMode::Trunc,
                    )
                    .unwrap(),
            ]
            .into_iter()
            .chain(zoned.zip(end_zoned).map(|(one, two)| {
                one.until(
                    &two,
                    largest,
                    DateTimeUnit::Nanosecond,
                    1,
                    RoundingMode::Trunc,
                )
                .unwrap()
            })) {
                assert_eq!(&value.fields()[..4], expected.as_slice(), "{row:?}");
                assert_eq!(&value.fields()[4..], &[0; 6], "{row:?}");
            }
            2
        }
        "T" => {
            let smallest = unit(row[3]);
            let mut fields = [0; 10];
            fields[smallest as usize] = row[4].parse::<i128>().unwrap();
            fields[4] = fields[smallest as usize].signum() * 10;
            let duration = Duration::new(fields).unwrap();
            let expected = row[5].parse::<f64>().unwrap();
            assert_eq!(
                date.total_duration(duration, smallest).unwrap(),
                expected,
                "{row:?}"
            );
            let zoned = zoned.unwrap();
            assert_eq!(
                zoned.total_duration(duration, smallest).unwrap(),
                expected,
                "{row:?}"
            );
            for (mode, count) in [
                (RoundingMode::Trunc, expected.trunc()),
                (RoundingMode::Ceil, expected.ceil()),
                (RoundingMode::Floor, expected.floor()),
            ] {
                let mut expected = [0; 10];
                expected[smallest as usize] = count as i128;
                assert_eq!(
                    date.round_duration(duration, smallest, smallest, 1, mode)
                        .unwrap()
                        .fields(),
                    expected,
                    "{row:?} {mode:?}"
                );
                assert_eq!(
                    zoned
                        .round_duration(duration, smallest, smallest, 1, mode)
                        .unwrap()
                        .fields(),
                    expected,
                    "{row:?} {mode:?}"
                );
            }
            4
        }
        _ => panic!("Unknown row {row:?}"),
    }
}

#[test]
fn partial_dates_preserve_month_codes_and_replace_era_groups() {
    let hebrew = PlainDate::from_calendar_fields(
        Calendar::Hebrew,
        date_fields(5784, month_code("M06"), 29),
        Overflow::Reject,
    )
    .unwrap();
    let common = hebrew
        .with_fields(
            DateFields {
                year: Some(5785),
                ..DateFields::default()
            },
            Overflow::Reject,
        )
        .unwrap();
    let fields = common.calendar_fields().unwrap();
    assert_eq!(
        (fields.year, fields.month, fields.month_code, fields.day),
        (5785, 6, month_code("M06"), 29)
    );
    let datetime = hebrew
        .to_date_time(PlainTime::new(12, 34, 56, 123_456_789).unwrap())
        .unwrap();
    let updated = datetime
        .with_fields(
            formatjs_temporal::DateTimeFields {
                date: DateFields {
                    year: Some(5785),
                    ..DateFields::default()
                },
                ..formatjs_temporal::DateTimeFields::default()
            },
            Overflow::Reject,
        )
        .unwrap();
    assert!(updated.date().equals(common));
    assert_eq!(updated.time(), datetime.time());
    assert_eq!(updated.calendar_id(), "hebrew");
    let zoned = ZonedDateTime::new_in_calendar(
        Instant::from_epoch_nanoseconds(datetime.epoch_nanoseconds()).unwrap(),
        zero_zone(),
        Calendar::Hebrew,
    );
    let updated = zoned
        .with_fields(
            formatjs_temporal::ZonedFields {
                date_time: formatjs_temporal::DateTimeFields {
                    date: DateFields {
                        year: Some(5785),
                        ..DateFields::default()
                    },
                    ..formatjs_temporal::DateTimeFields::default()
                },
                ..formatjs_temporal::ZonedFields::default()
            },
            formatjs_temporal::ZonedWithOptions::default(),
        )
        .unwrap();
    assert!(updated.local().unwrap().date().equals(common));
    assert_eq!(updated.local().unwrap().time(), datetime.time());
    let leap = PlainDate::from_calendar_fields(
        Calendar::Hebrew,
        date_fields(5784, month_code("M05L"), 30),
        Overflow::Reject,
    )
    .unwrap();
    let update = DateFields {
        year: Some(5785),
        ..DateFields::default()
    };
    assert!(leap.with_fields(update, Overflow::Reject).is_err());
    let fields = leap
        .with_fields(update, Overflow::Constrain)
        .unwrap()
        .calendar_fields()
        .unwrap();
    assert_eq!((fields.month_code, fields.day), (month_code("M06"), 29));

    let heisei = PlainDate::new(2019, 4, 30)
        .unwrap()
        .with_calendar(Calendar::Japanese)
        .unwrap();
    let reiwa = heisei
        .with_fields(
            DateFields {
                month: Some(5),
                day: Some(1),
                ..DateFields::default()
            },
            Overflow::Reject,
        )
        .unwrap();
    let era = reiwa.era().unwrap().unwrap();
    assert_eq!((era.name, era.year), ("reiwa", 1));
    assert_eq!(
        heisei
            .with_fields(
                DateFields {
                    year: Some(2020),
                    ..DateFields::default()
                },
                Overflow::Reject
            )
            .unwrap()
            .fields(),
        (2020, 4, 30)
    );
    assert!(
        heisei
            .with_fields(
                DateFields {
                    era_year: Some(1),
                    ..DateFields::default()
                },
                Overflow::Reject
            )
            .is_err()
    );
    assert_eq!(
        heisei
            .with_fields(
                DateFields {
                    era: Some("heisei"),
                    era_year: Some(1),
                    ..DateFields::default()
                },
                Overflow::Reject
            )
            .unwrap()
            .fields(),
        (1989, 4, 30)
    );
}

#[test]
fn public_arithmetic_calendar_types_match_icu() {
    let registry = CalendarRegistry::compiled().unwrap();
    let mut counts = [0; 5];
    for line in include_str!(env!("FORMATJS_ARITHMETIC_CALENDARS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<_> = line.split('\t').collect();
        let calendar = registry.resolve(row[1]).unwrap();
        counts[check_oracle(&row, calendar, registry)] += 1;
    }
    assert_eq!(counts, [34366, 32352, 32352, 176, 5408]);
    for calendar in Calendar::ALL {
        check_date_limits(calendar);
    }
}

fn check_date_limits<C: CalendarProvider>(calendar: C) {
    for (day, epoch_sign, offset_sign) in [(-100_000_001, -1, -1), (100_000_000, 1, 1)] {
        let date = PlainDate::from_epoch_day_in(day, calendar).unwrap();
        let offset = FixedOffset::new(offset_sign * 12 * 3_600_000_000_000).unwrap();
        let instant =
            Instant::from_epoch_nanoseconds(epoch_sign * formatjs_temporal::MAX_EPOCH_NANOSECONDS)
                .unwrap();
        let zoned = ZonedDateTime::new_in_calendar(instant, offset, calendar);
        assert_eq!(zoned.local().unwrap().date().epoch_day(), day);
        assert_eq!(
            zoned.local().unwrap().calendar_fields().unwrap(),
            date.calendar_fields().unwrap()
        );
        let zero = Duration::new([0; 10]).unwrap();
        assert_eq!(date.total_duration(zero, DateTimeUnit::Year).unwrap(), 0.0);
        assert_eq!(
            date.round_duration(
                zero,
                DateTimeUnit::Year,
                DateTimeUnit::Year,
                1,
                RoundingMode::HalfExpand
            )
            .unwrap(),
            zero
        );
        assert!(
            PlainDate::from_epoch_day_in(if day < 0 { day - 1 } else { day + 1 }, calendar)
                .is_err()
        );
    }
}

#[test]
fn public_borrowed_calendar_types_match_icu_and_published_authorities() {
    let registry = CalendarRegistry::compiled().unwrap();
    let providers =
        ["chinese", "dangi", "islamic-umalqura"].map(|id| registry.resolve(id).unwrap());
    for provider in providers {
        check_date_limits(provider);
        let date = PlainDate::new(2020, 2, 29)
            .unwrap()
            .with_calendar(provider)
            .unwrap();
        assert!(date.equals(PlainDate::parse_in(&date.to_string(), provider).unwrap()));
        assert!(date.to_string().parse::<PlainDate>().is_err());
        let datetime = date
            .to_date_time(PlainTime::new(12, 34, 56, 123).unwrap())
            .unwrap();
        assert!(datetime.equals(PlainDateTime::parse_in(&datetime.to_string(), provider).unwrap()));
    }
    let mut counts = [0; 5];
    for line in include_str!(env!("FORMATJS_TABLE_CALENDARS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<_> = line.split('\t').collect();
        let index = match row[1] {
            "chinese" => 0,
            "dangi" => 1,
            _ => 2,
        };
        let provider = providers[index];
        counts[check_oracle(&row, provider, registry)] += 1;
    }
    assert_eq!(counts, [15932, 6720, 6720, 0, 1248]);
}

#[test]
fn public_calendar_identity_parsing_fields_and_rounding() {
    let iso = PlainDate::new(2020, 2, 29).unwrap();
    let hebrew = iso.with_calendar(Calendar::Hebrew).unwrap();
    assert!(!iso.equals(hebrew));
    assert!(
        iso.equals(
            iso.with_calendar(CalendarRef::Arithmetic(Calendar::Iso8601))
                .unwrap()
        )
    );
    assert_eq!(iso.compare(hebrew), core::cmp::Ordering::Equal);
    assert_eq!(hebrew.to_string(), "2020-02-29[u-ca=hebrew]");
    assert_eq!(hebrew.to_string().parse::<PlainDate>().unwrap(), hebrew);
    assert!(PlainDate::parse_in("2020-02-29[u-ca=gregory]", Calendar::Hebrew).is_err());
    for (annotation, expected) in [
        ("ISLAMICC", "islamic-civil"),
        ("ethiopic-amete-alem", "ethioaa"),
        ("!u-ca=hebrew", "hebrew"),
    ] {
        let text = if annotation.starts_with('!') {
            format!("2020-02-29[{annotation}]")
        } else {
            format!("2020-02-29[u-ca={annotation}]")
        };
        assert_eq!(text.parse::<PlainDate>().unwrap().calendar_id(), expected);
    }
    assert_eq!(
        "2020-02-29[u-ca=hebrew][u-ca=unknown]"
            .parse::<PlainDate>()
            .unwrap()
            .calendar_id(),
        "hebrew"
    );
    for text in [
        "2020-02-29[u-ca=unknown]",
        "2020-02-29[u-ca=hebrew][!u-ca=iso8601]",
    ] {
        assert!(text.parse::<PlainDate>().is_err());
    }
    assert_eq!(
        PlainDate::new(2021, 1, 1).unwrap().week_of_year(),
        Some((2020, 53))
    );
    assert_eq!(
        PlainDate::new(2024, 12, 30).unwrap().week_of_year(),
        Some((2025, 1))
    );
    assert_eq!(hebrew.week_of_year(), None);
    let clock = PlainTime::new(23, 59, 59, 999_999_999).unwrap();
    let time = hebrew.to_date_time(clock).unwrap();
    assert_eq!(
        time.to_string(),
        "2020-02-29T23:59:59.999999999[u-ca=hebrew]"
    );
    assert_eq!(time.to_string().parse::<PlainDateTime>().unwrap(), time);
    for value in [
        time.round(TimeUnit::Second, 1, RoundingMode::HalfExpand)
            .unwrap(),
        time.round_day(RoundingMode::HalfExpand).unwrap(),
    ] {
        assert_eq!(value.calendar_id(), "hebrew");
        assert_eq!(value.date().epoch_day(), iso.epoch_day() + 1);
    }
    assert_eq!(
        time.format(Precision::Minute, RoundingMode::Ceil)
            .unwrap()
            .to_string(),
        "2020-03-01T00:00[u-ca=hebrew]"
    );
    assert!(
        iso.until(
            hebrew,
            DateTimeUnit::Day,
            DateTimeUnit::Day,
            1,
            RoundingMode::Trunc
        )
        .is_err()
    );
    assert!(
        iso.to_date_time(clock)
            .unwrap()
            .until(
                time,
                DateTimeUnit::Hour,
                DateTimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .is_err()
    );
    let zoned = ZonedDateTime::new(Instant::from_epoch_nanoseconds(0).unwrap(), zero_zone());
    assert!(
        zoned
            .until(
                &zoned.with_calendar(Calendar::Hebrew),
                DateTimeUnit::Hour,
                DateTimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .is_err()
    );
    for fields in [
        DateFields {
            month: Some(0),
            ..date_fields(2020, month_code("M01"), 1)
        },
        DateFields {
            day: Some(0),
            ..date_fields(2020, month_code("M01"), 1)
        },
        DateFields {
            year: Some(2020),
            era: Some("bce"),
            era_year: Some(1),
            ..date_fields(2020, month_code("M01"), 1)
        },
        DateFields {
            month: Some(2),
            ..date_fields(2020, month_code("M01"), 1)
        },
    ] {
        assert!(
            PlainDate::from_calendar_fields(Calendar::Gregory, fields, Overflow::Constrain)
                .is_err(),
            "{fields:?}"
        );
    }
}

#[test]
fn non_iso_month_addition_resolves_offset_after_calendar_arithmetic() {
    let row = include_str!(env!("FORMATJS_ARITHMETIC_CALENDARS"))
        .lines()
        .find_map(|line| {
            let row: Vec<_> = line.split('\t').collect();
            (row.len() > 5
                && row[0] == "A"
                && row[1] == "hebrew"
                && row[3] == "month"
                && row[4] == "1")
                .then_some(row)
        })
        .unwrap();
    let start = row[2].parse::<i64>().unwrap();
    let end = row[5].parse::<i64>().unwrap();
    let events = [OffsetTransition {
        epoch_seconds: (start + 3) * 86400 + 7 * 3600,
        offset_seconds: -14400,
    }];
    let zone = TransitionZone::new(-18000, &events, None).unwrap();
    let first = ZonedDateTime::new_in_calendar(
        Instant::from_epoch_nanoseconds(
            i128::from(start) * NANOSECONDS_PER_DAY + 17 * 3_600_000_000_000,
        )
        .unwrap(),
        zone,
        Calendar::Hebrew,
    );
    let month = Duration::new([0, 1, 0, 0, 0, 0, 0, 0, 0, 0]).unwrap();
    let next = first.checked_add(month, Overflow::Constrain).unwrap();
    assert_eq!(
        next.instant().epoch_nanoseconds(),
        i128::from(end) * NANOSECONDS_PER_DAY + 16 * 3_600_000_000_000
    );
    assert_eq!(next.calendar_id(), "hebrew");
    assert_eq!(
        first.total_duration(month, DateTimeUnit::Hour).unwrap(),
        ((end - start) * 24 - 1) as f64
    );
    assert_eq!(
        first
            .until(
                &next,
                DateTimeUnit::Month,
                DateTimeUnit::Nanosecond,
                1,
                RoundingMode::Trunc
            )
            .unwrap(),
        month
    );
    assert_eq!(
        first
            .transition(TransitionDirection::Next)
            .unwrap()
            .calendar_id(),
        "hebrew"
    );
    assert_eq!(next.start_of_day().unwrap().calendar_id(), "hebrew");
    assert_eq!(
        next.round(DateTimeUnit::Day, 1, RoundingMode::Floor)
            .unwrap()
            .calendar_id(),
        "hebrew"
    );
}

fn with_all_calendars(check: impl FnOnce(&[CalendarRef<'_>])) {
    let registry = CalendarRegistry::compiled().unwrap();
    let providers: Vec<_> = registry.calendars().collect();
    check(&providers);
}

#[test]
fn public_short_dates_match_independent_icu_catalog_and_rounding() {
    with_all_calendars(|providers| {
        let mut count = 0;
        for line in include_str!(env!("FORMATJS_SHORT_CALENDARS"))
            .lines()
            .filter(|line| !line.starts_with('#'))
        {
            let row: Vec<_> = line.split('\t').collect();
            let calendar = *providers
                .iter()
                .find(|calendar| calendar.id() == row[1])
                .unwrap();
            if row[0] == "R" {
                let start =
                    PlainYearMonth::from_epoch_day_in(row[2].parse().unwrap(), calendar).unwrap();
                let end =
                    PlainYearMonth::from_epoch_day_in(row[3].parse().unwrap(), calendar).unwrap();
                let unit = |name| {
                    if name == "year" {
                        YearMonthUnit::Year
                    } else {
                        YearMonthUnit::Month
                    }
                };
                let increment = row[6].parse().unwrap();
                let mode = row[7].parse().unwrap();
                for (operation, actual) in [
                    start.until(end, unit(row[4]), unit(row[5]), increment, mode),
                    start.since(end, unit(row[4]), unit(row[5]), increment, mode),
                ]
                .into_iter()
                .enumerate()
                {
                    let expected = Duration::new([
                        row[8 + operation * 2].parse().unwrap(),
                        row[9 + operation * 2].parse().unwrap(),
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                    ])
                    .unwrap();
                    assert_eq!(
                        actual.unwrap_or_else(|error| panic!("{line}: {error:?}")),
                        expected,
                        "{line}"
                    );
                }
                count += 1;
                continue;
            }
            let row = &row[1..];
            let fields = DateFields {
                month_code: Some(month_code(row[1])),
                day: Some(row[2].parse().unwrap()),
                ..DateFields::default()
            };
            let overflow = if row[3] == "reject" {
                Overflow::Reject
            } else {
                Overflow::Constrain
            };
            let source = PlainMonthDay::from_epoch_day_in(0, calendar).unwrap();
            for actual in [
                PlainMonthDay::from_calendar_fields(calendar, fields, overflow),
                source.with_fields(fields, overflow),
            ] {
                if row[4] == "X" {
                    assert!(actual.is_err(), "{line}: {actual:?}");
                } else {
                    let actual = actual.unwrap_or_else(|error| panic!("{line}: {error:?}"));
                    assert_eq!(actual.epoch_day(), row[4].parse::<i64>().unwrap(), "{line}");
                    assert_eq!(actual.calendar_id(), row[0]);
                    assert!(
                        actual.equals(
                            PlainMonthDay::parse_in(&actual.to_string(), calendar).unwrap()
                        )
                    );
                    let reference = actual.calendar_fields().unwrap();
                    let date = actual
                        .to_plain_date(reference.year, Overflow::Reject)
                        .unwrap();
                    assert_eq!(date.epoch_day(), actual.epoch_day(), "{line}");
                    let year_fields = match date.era().unwrap() {
                        Some(era) => DateFields {
                            era: Some(era.name),
                            era_year: Some(era.year),
                            ..DateFields::default()
                        },
                        None => DateFields {
                            year: Some(reference.year),
                            ..DateFields::default()
                        },
                    };
                    assert!(
                        actual
                            .to_plain_date_fields(year_fields, Overflow::Reject)
                            .unwrap()
                            .equals(date)
                    );
                }
            }
            count += 1;
        }
        assert_eq!(count, 10176);
        println!("{count} independent all-calendar short-date cases");
    });
}

#[test]
fn public_short_dates_calendar_bounds_identity_and_overflow() {
    with_all_calendars(|providers| {
        let zero = Duration::new([0; 10]).unwrap();
        for &calendar in providers {
            for epoch in [i64::MIN, -110_000_001, 110_000_001, i64::MAX] {
                assert!(calendar.date_extended(epoch).is_err());
                assert!(calendar.era_extended(epoch).is_err());
                assert!(
                    calendar
                        .add_extended(
                            epoch,
                            formatjs_temporal::calendar::DateDuration::default(),
                            formatjs_temporal::calendar::Overflow::Constrain
                        )
                        .is_err()
                );
            }
            for (year, month, day) in [(-271821, 4, 1), (275760, 9, 30)] {
                let raw = PlainYearMonth::new(year, month, day)
                    .unwrap()
                    .with_calendar(calendar)
                    .unwrap();
                assert_eq!(raw.fields(), (year, month, day));
                let text = raw.to_string();
                let normalized = PlainYearMonth::parse_in(&text, calendar);
                let first = raw.epoch_day() - i64::from(raw.calendar_fields().unwrap().day) + 1;
                if let Ok(normalized) = normalized {
                    assert_eq!(normalized.epoch_day(), first);
                    assert_eq!(normalized.calendar_id(), calendar.id());
                }
                assert_eq!(
                    raw.until(
                        raw,
                        YearMonthUnit::Year,
                        YearMonthUnit::Month,
                        1,
                        RoundingMode::Trunc
                    )
                    .unwrap(),
                    zero
                );
                if first < -100_000_001 {
                    assert!(raw.checked_add(zero, Overflow::Constrain).is_err());
                }
                assert!(PlainMonthDay::from_epoch_day_in(raw.epoch_day(), calendar).is_err());
            }
            let iso = PlainYearMonth::new(2024, 3, 15)
                .unwrap()
                .with_calendar(CalendarRef::Arithmetic(Calendar::Iso8601))
                .unwrap();
            let raw = iso.with_calendar(calendar).unwrap();
            assert_eq!(iso.compare(raw), core::cmp::Ordering::Equal);
            assert_eq!(iso.equals(raw), calendar.id() == "iso8601");
            if calendar.id() != "iso8601" {
                assert!(
                    iso.until(
                        raw,
                        YearMonthUnit::Year,
                        YearMonthUnit::Month,
                        1,
                        RoundingMode::Trunc
                    )
                    .is_err()
                );
                assert!(
                    PlainYearMonth::parse_in(&format!("2024-03[u-ca={}]", calendar.id()), calendar)
                        .is_err()
                );
                assert!(
                    PlainMonthDay::parse_in(&format!("03-15[u-ca={}]", calendar.id()), calendar)
                        .is_err()
                );
            }
            let first = raw.epoch_day() - i64::from(raw.calendar_fields().unwrap().day) + 1;
            assert_eq!(
                raw.checked_add(zero, Overflow::Constrain)
                    .unwrap()
                    .epoch_day(),
                first
            );
            let date = raw.to_plain_date(255, Overflow::Constrain).unwrap();
            assert_eq!(
                date.calendar_fields().unwrap().day,
                raw.days_in_month().unwrap()
            );
            assert!(raw.to_plain_date(255, Overflow::Reject).is_err());
            assert!(raw.to_plain_date(0, Overflow::Constrain).is_err());
        }
    });
    let leap = PlainMonthDay::from_calendar_fields(
        Calendar::Hebrew,
        DateFields {
            month_code: Some(month_code("M05L")),
            day: Some(30),
            ..DateFields::default()
        },
        Overflow::Reject,
    )
    .unwrap();
    assert_eq!(
        leap.to_plain_date(5783, Overflow::Constrain)
            .unwrap()
            .calendar_fields()
            .unwrap()
            .month_code,
        month_code("M06")
    );
    assert!(leap.to_plain_date(5783, Overflow::Reject).is_err());
    assert!(
        PlainMonthDay::from_calendar_fields(
            Calendar::Gregory,
            DateFields {
                year: Some(2020),
                month: Some(2),
                day: Some(29),
                era: Some("ce"),
                era_year: Some(2019),
                ..DateFields::default()
            },
            Overflow::Constrain
        )
        .is_err()
    );
}

#[test]
fn public_short_date_fields_validate_years_codes_and_annotations() {
    let start = PlainYearMonth::new(2019, 1, 1).unwrap();
    let end = PlainYearMonth::new(2021, 9, 1).unwrap();
    assert_eq!(
        start
            .until(
                end,
                YearMonthUnit::Year,
                YearMonthUnit::Month,
                5,
                RoundingMode::Trunc
            )
            .unwrap()
            .to_string(),
        "P2Y5M"
    );
    let fields = DateFields {
        year: Some(2019),
        month: Some(2),
        day: Some(29),
        ..DateFields::default()
    };
    for calendar in [Calendar::Iso8601, Calendar::Gregory] {
        let value =
            PlainMonthDay::from_calendar_fields(calendar, fields, Overflow::Constrain).unwrap();
        assert_eq!(value.fields(), (2, 28, 1972));
        assert!(PlainMonthDay::from_calendar_fields(calendar, fields, Overflow::Reject).is_err());
        let conflict = DateFields {
            month_code: Some(month_code("M03")),
            ..fields
        };
        assert!(
            PlainMonthDay::from_calendar_fields(calendar, conflict, Overflow::Constrain).is_err()
        );
        assert!(
            PlainYearMonth::from_calendar_fields(calendar, conflict, Overflow::Constrain).is_err()
        );
    }
    let missing = DateFields {
        month: Some(2),
        day: Some(29),
        ..DateFields::default()
    };
    assert!(
        PlainMonthDay::from_calendar_fields(Calendar::Gregory, missing, Overflow::Constrain)
            .is_err()
    );
    assert_eq!(
        PlainMonthDay::from_calendar_fields(Calendar::Iso8601, missing, Overflow::Constrain)
            .unwrap()
            .fields(),
        (2, 29, 1972)
    );
    let regnal = DateFields {
        era: Some("reiwa"),
        era_year: Some(1),
        month_code: Some(month_code("M02")),
        day: Some(15),
        ..DateFields::default()
    };
    assert_eq!(
        PlainYearMonth::from_calendar_fields(Calendar::Japanese, regnal, Overflow::Reject)
            .unwrap()
            .fields(),
        (2019, 2, 1)
    );
    for text in [
        "2020-02-29[u-ca=hebrew][!u-ca=iso8601]",
        "2020-02-29[!x=unknown]",
        "2020-02-29[u-ca=unknown]",
    ] {
        assert!(text.parse::<PlainYearMonth>().is_err());
        assert!(text.parse::<PlainMonthDay>().is_err());
    }
    assert_eq!(
        "2020-02-29[u-ca=HEBREW][u-ca=unknown]"
            .parse::<PlainYearMonth>()
            .unwrap()
            .calendar_id(),
        "hebrew"
    );
    assert_eq!(
        "2020-02-29[!u-ca=ISLAMICC]"
            .parse::<PlainMonthDay>()
            .unwrap()
            .calendar_id(),
        "islamic-civil"
    );
    assert!(PlainMonthDay::parse_in("2020-02-29[u-ca=gregory]", Calendar::Hebrew).is_err());
    assert!(PlainYearMonth::parse_in("2020-02-29[u-ca=gregory]", Calendar::Hebrew).is_err());
    let year_month = PlainYearMonth::from_calendar_fields(
        Calendar::Hebrew,
        DateFields {
            year: Some(5782),
            month_code: Some(month_code("M01")),
            ..DateFields::default()
        },
        Overflow::Reject,
    )
    .unwrap();
    let one_year: Duration = "P1Y".parse().unwrap();
    let end = year_month.checked_add(one_year, Overflow::Reject).unwrap();
    assert_eq!(
        year_month
            .until(
                end,
                YearMonthUnit::Month,
                YearMonthUnit::Month,
                1,
                RoundingMode::Trunc
            )
            .unwrap()
            .to_string(),
        "P13M"
    );
    assert_eq!(
        year_month
            .until(
                end,
                YearMonthUnit::Year,
                YearMonthUnit::Month,
                1,
                RoundingMode::Trunc
            )
            .unwrap(),
        one_year
    );
    let hebrew_leap = PlainYearMonth::from_calendar_fields(
        Calendar::Hebrew,
        DateFields {
            year: Some(5782),
            month_code: Some(month_code("M05L")),
            ..DateFields::default()
        },
        Overflow::Reject,
    )
    .unwrap();
    assert_eq!(
        hebrew_leap
            .checked_add(one_year, Overflow::Constrain)
            .unwrap()
            .calendar_fields()
            .unwrap()
            .month_code,
        month_code("M06")
    );
    assert!(hebrew_leap.checked_add(one_year, Overflow::Reject).is_err());
}

#[test]
fn zoned_strings_retain_all_calendar_providers() {
    with_all_calendars(|providers| {
        for &calendar in providers {
            let text = format!("2020-02-29T12:34:56.123456789[UTC][u-ca={}]", calendar.id());
            let value = ZonedDateTime::parse_in(
                &text,
                formatjs_temporal::TimeZoneRegistry::empty(),
                calendar,
                formatjs_temporal::ZonedParseOptions::default(),
            )
            .unwrap();
            assert_eq!(value.calendar_id(), calendar.id());
            let expected = PlainDate::new(2020, 2, 29)
                .unwrap()
                .with_calendar(calendar)
                .unwrap();
            assert_eq!(
                value.local().unwrap().calendar_fields().unwrap(),
                expected.calendar_fields().unwrap()
            );
            let serialized = value.to_string();
            let roundtrip = ZonedDateTime::parse_in(
                &serialized,
                formatjs_temporal::TimeZoneRegistry::empty(),
                calendar,
                formatjs_temporal::ZonedParseOptions::default(),
            )
            .unwrap();
            assert_eq!(roundtrip.instant(), value.instant());
            assert_eq!(roundtrip.calendar_id(), calendar.id());
            assert!(
                ZonedDateTime::parse_in(
                    "2020-02-29[UTC][u-ca=unknown]",
                    formatjs_temporal::TimeZoneRegistry::empty(),
                    calendar,
                    formatjs_temporal::ZonedParseOptions::default()
                )
                .is_err()
            );
        }
    });
}
