use formatjs_temporal::{
    CalendarProvider, CalendarRef, DateFields, DateTimeUnit, Duration, FixedOffset, Instant,
    NANOSECONDS_PER_DAY, OffsetTransition, Overflow, PlainDate, PlainDateTime, PlainTime,
    Precision, RoundingMode, TimeUnit, TransitionDirection, TransitionZone, ZonedDateTime,
    calendar::{Calendar, MonthCode},
    table_calendar::{LunisolarData, TableCalendar, TableCalendarId, UmmAlQuraData},
};
use serde_json::Value;

fn month_code(text: &str) -> MonthCode {
    MonthCode {
        number: text[1..3].parse().unwrap(),
        leap: text.ends_with('L'),
    }
}
fn zero_zone() -> FixedOffset {
    FixedOffset::new(0).unwrap()
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

fn check_oracle<C: CalendarProvider>(row: &[&str], calendar: C) -> usize {
    let epoch = row[2].parse::<i64>().unwrap();
    let date = PlainDate::from_epoch_day_in(epoch, calendar).unwrap();
    let noon = PlainTime::new(12, 0, 0, 0).unwrap();
    let datetime = date.to_date_time(noon).unwrap();
    let zoned = Instant::from_epoch_nanoseconds(datetime.epoch_nanoseconds())
        .ok()
        .map(|instant| ZonedDateTime::new_in_calendar(instant, zero_zone(), calendar));
    match row[0] {
        "F" => {
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
fn public_arithmetic_calendar_types_match_icu() {
    let mut counts = [0; 5];
    for line in include_str!(env!("FORMATJS_ARITHMETIC_CALENDARS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<_> = line.split('\t').collect();
        let calendar = Calendar::from_name(row[1]).unwrap();
        counts[check_oracle(&row, calendar)] += 1;
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

struct Lunar {
    first: i32,
    end: i64,
    checkpoints: Vec<i64>,
    months: Vec<i64>,
    dictionary: Vec<u32>,
    years: String,
}
impl Lunar {
    fn load(text: &str) -> Self {
        let raw: Value = serde_json::from_str(text).unwrap();
        let raw = &raw["data"];
        Self {
            first: raw["firstYear"].as_i64().unwrap() as i32,
            end: raw["endDay"].as_i64().unwrap(),
            checkpoints: serde_json::from_value(raw["checkpoints"].clone()).unwrap(),
            months: serde_json::from_value(raw["monthCheckpoints"].clone()).unwrap(),
            dictionary: serde_json::from_value(raw["dictionary"].clone()).unwrap(),
            years: raw["years"].as_str().unwrap().into(),
        }
    }
    fn calendar(&self, id: TableCalendarId) -> TableCalendar<'_> {
        TableCalendar::lunisolar(
            id,
            LunisolarData {
                first_year: self.first,
                end_day: self.end,
                checkpoints: &self.checkpoints,
                month_checkpoints: &self.months,
                dictionary: &self.dictionary,
                years: &self.years,
            },
        )
        .unwrap()
    }
}

#[test]
fn public_borrowed_calendar_types_match_icu_and_published_authorities() {
    let chinese = Lunar::load(include_str!(env!("FORMATJS_CALENDAR_CHINESE")));
    let dangi = Lunar::load(include_str!(env!("FORMATJS_CALENDAR_DANGI")));
    let raw: Value =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_UMALQURA"))).unwrap();
    let raw = &raw["data"];
    let starts: Vec<i64> = serde_json::from_value(raw["startDays"].clone()).unwrap();
    let lengths: Vec<u16> = serde_json::from_value(raw["monthLengths"].clone()).unwrap();
    let umm = TableCalendar::umm_al_qura(UmmAlQuraData {
        first_year: raw["firstYear"].as_i64().unwrap() as i32,
        start_days: &starts,
        month_lengths: &lengths,
    })
    .unwrap();
    let providers = [
        chinese.calendar(TableCalendarId::Chinese),
        dangi.calendar(TableCalendarId::Dangi),
        umm,
    ];
    for provider in providers {
        check_date_limits(provider);
        let date = PlainDate::new(2020, 2, 29)
            .unwrap()
            .with_calendar(provider)
            .unwrap();
        assert!(
            date.equals(
                PlainDate::parse_in(&date.to_string(), CalendarRef::Table(provider)).unwrap()
            )
        );
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
        let provider = CalendarRef::Table(providers[index]);
        counts[check_oracle(&row, provider)] += 1;
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
