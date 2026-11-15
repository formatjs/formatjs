use formatjs_intl_datetimeformat_calendars::calendar::{
    Calendar, DateDuration, DateUnit, MonthCode, Overflow,
};

fn code(value: &str) -> MonthCode {
    MonthCode {
        number: value[1..3].parse().unwrap(),
        leap: value.ends_with('L'),
    }
}
#[test]
fn independent_icu_arithmetic_calendars() {
    let mut fields = 0;
    let mut additions = 0;
    let mut bounds = 0;
    let mut differences = Vec::new();
    for line in include_str!(env!("FORMATJS_ARITHMETIC_CALENDARS"))
        .lines()
        .filter(|line| !line.starts_with('#'))
    {
        let row: Vec<&str> = line.split('\t').collect();
        let cal = Calendar::from_name(row[1]).unwrap();
        let epoch = row[2].parse().unwrap();
        if row[0] == "F" {
            let actual = cal.from_epoch_day(epoch).unwrap();
            let expected = (
                row[3].parse::<i32>().unwrap(),
                row[4].parse::<u8>().unwrap(),
                code(row[5]),
                row[6].parse::<u8>().unwrap(),
            );
            if (actual.year, actual.month, actual.month_code, actual.day) != expected {
                differences.push(line.to_string());
                if differences.len() >= 20 {
                    break;
                }
            }
            assert_eq!(
                cal.to_epoch_day(
                    actual.year,
                    i32::from(actual.month),
                    i32::from(actual.day),
                    Overflow::Reject
                )
                .unwrap(),
                epoch,
                "{line}"
            );
            assert_eq!(
                cal.to_epoch_day_code(
                    actual.year,
                    actual.month_code,
                    i32::from(actual.day),
                    Overflow::Reject
                )
                .unwrap(),
                epoch,
                "{line}"
            );
            assert_eq!(
                cal.days_in_month(actual.year, actual.month).unwrap(),
                row[7].parse::<u8>().unwrap(),
                "{line}"
            );
            assert_eq!(
                cal.months_in_year(actual.year).unwrap(),
                row[8].parse::<u8>().unwrap(),
                "{line}"
            );
            assert_eq!(
                cal.start_of_year(actual.year + 1).unwrap()
                    - cal.start_of_year(actual.year).unwrap(),
                row[9].parse::<i64>().unwrap(),
                "{line}"
            );
            if row[10] == "-" {
                assert_eq!(cal.era(epoch).unwrap(), None);
            } else {
                let era = cal.era(epoch).unwrap().unwrap();
                assert_eq!(
                    (era.name, era.year),
                    (row[10], row[11].parse().unwrap()),
                    "{line}"
                );
                assert_eq!(
                    cal.year_from_era(era.name, era.year).unwrap(),
                    actual.year,
                    "{line}"
                );
            }
            fields += 1;
        } else {
            let amount = row[4].parse().unwrap();
            let mut duration = DateDuration::default();
            let unit = match row[3] {
                "year" => {
                    duration.years = amount;
                    DateUnit::Year
                }
                "month" => {
                    duration.months = amount;
                    DateUnit::Month
                }
                "week" => {
                    duration.weeks = amount;
                    DateUnit::Week
                }
                _ => {
                    duration.days = amount;
                    DateUnit::Day
                }
            };
            let actual = cal.add(epoch, duration, Overflow::Constrain);
            if row[0] == "X" {
                assert!(actual.is_err(), "{line}");
                bounds += 1;
                continue;
            }
            let end = row[5].parse().unwrap();
            assert_eq!(
                actual.unwrap(),
                end,
                "{line}; start {:?}; expected date {:?}; actual date {:?}",
                cal.from_epoch_day(epoch),
                cal.from_epoch_day(end),
                actual.map(|value| cal.from_epoch_day(value))
            );
            assert_eq!(cal.until(epoch, end, unit).unwrap(), duration, "{line}");
            additions += 1;
        }
    }
    assert!(
        differences.is_empty(),
        "ICU field differences: {differences:?}"
    );
    println!("{fields} ICU field samples, {additions} additions, {bounds} bounds");
    assert_eq!((fields, additions, bounds), (34366, 32352, 176));
}
#[test]
fn proleptic_invariants_and_overflow() {
    for cal in Calendar::ALL {
        for day in (-100_000_001..=100_000_000)
            .step_by(98731)
            .chain([-100_000_001, 100_000_000])
        {
            let value = cal.from_epoch_day(day).unwrap();
            assert_eq!(
                cal.to_epoch_day_code(
                    value.year,
                    value.month_code,
                    i32::from(value.day),
                    Overflow::Reject
                )
                .unwrap(),
                day,
                "{cal:?} {day}"
            );
            let next = cal.add(
                day,
                DateDuration {
                    days: 1,
                    ..DateDuration::default()
                },
                Overflow::Constrain,
            );
            if day == 100_000_000 {
                assert!(next.is_err());
            } else {
                assert_eq!(next.unwrap(), day + 1);
            }
        }
        for months in [i64::MAX, i64::MIN] {
            assert!(
                cal.add(
                    0,
                    DateDuration {
                        months,
                        ..DateDuration::default()
                    },
                    Overflow::Constrain
                )
                .is_err()
            );
        }
        assert!(cal.to_epoch_day(2020, 0, 1, Overflow::Reject).is_err());
        assert!(
            cal.to_epoch_day_code(
                2020,
                MonthCode {
                    number: 1,
                    leap: true
                },
                1,
                Overflow::Constrain
            )
            .is_err()
        );
    }
    let cal = Calendar::Hebrew;
    assert!(
        cal.to_epoch_day_code(
            5783,
            MonthCode {
                number: 5,
                leap: true
            },
            30,
            Overflow::Reject
        )
        .is_err()
    );
    assert_eq!(
        cal.from_epoch_day(
            cal.to_epoch_day_code(
                5783,
                MonthCode {
                    number: 5,
                    leap: true
                },
                30,
                Overflow::Constrain
            )
            .unwrap()
        )
        .unwrap()
        .day,
        29
    );
}

#[test]
fn differences_balance_with_one_sign_and_exact_endpoints() {
    for cal in Calendar::ALL {
        for one in [-719529, -35428, 0, 11016, 19782] {
            for days in [-800, -365, -29, -1, 1, 29, 365, 800] {
                for largest in [
                    DateUnit::Year,
                    DateUnit::Month,
                    DateUnit::Week,
                    DateUnit::Day,
                ] {
                    let two = one + days;
                    let difference = cal.until(one, two, largest).unwrap();
                    for value in [
                        difference.years,
                        difference.months,
                        difference.weeks,
                        difference.days,
                    ] {
                        assert!(
                            value * days.signum() >= 0,
                            "{cal:?} {one} {two} {largest:?}: {difference:?}"
                        );
                    }
                    assert_eq!(
                        cal.add(one, difference, Overflow::Constrain).unwrap(),
                        two,
                        "{cal:?} {one} {two} {largest:?}"
                    );
                }
            }
        }
    }
}
