use formatjs_intl_datetimeformat_calendars::calendar::{
    DateDuration, DateUnit, MonthCode, Overflow,
};
use formatjs_intl_datetimeformat_calendars::table_calendar::{
    LunisolarData, TableCalendar, TableCalendarId, UmmAlQuraData,
};
use serde::Deserialize;

#[test]
fn lunisolar_checkpoint_and_final_year_boundaries() {
    let years = "AAAB".repeat(32) + "AA";
    let dictionary = [0, (6 << 13) | (1 << 12)];
    let calendar = TableCalendar::lunisolar(
        TableCalendarId::Chinese,
        LunisolarData {
            first_year: 2000,
            end_day: 24580,
            checkpoints: &[1000, 24232],
            month_checkpoints: &[0, 800],
            dictionary: &dictionary,
            years: &years,
        },
    )
    .unwrap();
    for (epoch, year, month, day, month_code) in [
        (1000, 2000, 1, 1, "M01"),
        (1347, 2000, 12, 29, "M12"),
        (1348, 2001, 1, 1, "M01"),
        (1522, 2001, 7, 1, "M06L"),
        (24231, 2063, 13, 30, "M12"),
        (24232, 2064, 1, 1, "M01"),
        (24233, 2064, 1, 2, "M01"),
        (24579, 2064, 12, 29, "M12"),
    ] {
        let value = calendar.from_epoch_day(epoch).unwrap();
        assert_eq!((value.year, value.month, value.day), (year, month, day));
        assert_eq!(value.month_code, code(month_code));
    }
    for (origin, months, expected) in [(24202, 1, 24232), (24232, -1, 24202)] {
        assert_eq!(
            calendar
                .add(
                    origin,
                    DateDuration {
                        months,
                        ..DateDuration::default()
                    },
                    Overflow::Constrain
                )
                .unwrap(),
            expected
        );
    }
    for (origin, months) in [(1000, -1), (24551, 1)] {
        assert!(
            calendar
                .add(
                    origin,
                    DateDuration {
                        months,
                        ..DateDuration::default()
                    },
                    Overflow::Constrain
                )
                .is_err()
        );
    }
    assert!(calendar.from_epoch_day(999).is_err());
    assert!(calendar.from_epoch_day(24580).is_err());
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Lunar {
    first_year: i32,
    end_day: i64,
    checkpoints: Vec<i64>,
    month_checkpoints: Vec<i64>,
    dictionary: Vec<u32>,
    years: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Umm {
    first_year: i32,
    start_days: Vec<i64>,
    month_lengths: Vec<u16>,
}
#[derive(Deserialize)]
struct Pack<T> {
    data: T,
}
impl Lunar {
    fn view(&self) -> LunisolarData<'_> {
        LunisolarData {
            first_year: self.first_year,
            end_day: self.end_day,
            checkpoints: &self.checkpoints,
            month_checkpoints: &self.month_checkpoints,
            dictionary: &self.dictionary,
            years: &self.years,
        }
    }
}
impl Umm {
    fn view(&self) -> UmmAlQuraData<'_> {
        UmmAlQuraData {
            first_year: self.first_year,
            start_days: &self.start_days,
            month_lengths: &self.month_lengths,
        }
    }
}
fn code(text: &str) -> MonthCode {
    MonthCode {
        number: text[1..3].parse().unwrap(),
        leap: text.ends_with('L'),
    }
}
#[test]
fn independent_icu_table_calendar_fields_and_arithmetic() {
    let chinese: Pack<Lunar> =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_CHINESE"))).unwrap();
    let dangi: Pack<Lunar> =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_DANGI"))).unwrap();
    let umm: Pack<Umm> =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_UMALQURA"))).unwrap();
    let calendars = [
        TableCalendar::lunisolar(TableCalendarId::Chinese, chinese.data.view()).unwrap(),
        TableCalendar::lunisolar(TableCalendarId::Dangi, dangi.data.view()).unwrap(),
        TableCalendar::umm_al_qura(umm.data.view()).unwrap(),
    ];
    for (epoch, year, month, day, month_code) in [
        (-32181, 1298, 12, 29, "M12"),
        (-32180, 1299, 1, 1, "M01"),
        (-32179, 1299, 1, 2, "M01"),
        (75546, 1602, 12, 29, "M12"),
        (75547, 1603, 1, 1, "M01"),
        (75548, 1603, 1, 2, "M01"),
    ] {
        let calendar = calendars[2];
        let value = calendar.from_epoch_day(epoch).unwrap();
        assert_eq!(
            (value.year, value.month, value.month_code, value.day),
            (year, month, code(month_code), day)
        );
        assert_eq!(
            calendar
                .to_epoch_day_code(year, code(month_code), i32::from(day), Overflow::Reject)
                .unwrap(),
            epoch
        );
    }
    let mut fields = 0;
    let mut additions = 0;
    let mut differences = 0;
    for line in include_str!(env!("FORMATJS_TABLE_CALENDARS"))
        .lines()
        .filter(|s| !s.starts_with('#'))
    {
        let row: Vec<&str> = line.split('\t').collect();
        if row[0] == "T" {
            continue;
        }
        let cal = calendars[match row[1] {
            "chinese" => 0,
            "dangi" => 1,
            _ => 2,
        }];
        let epoch = row[2].parse().unwrap();
        if row[0] == "F" {
            let value = cal.from_epoch_day(epoch).unwrap();
            assert_eq!(
                (value.year, value.month, value.month_code, value.day),
                (
                    row[3].parse().unwrap(),
                    row[4].parse().unwrap(),
                    code(row[5]),
                    row[6].parse().unwrap()
                ),
                "{line}"
            );
            assert_eq!(
                cal.to_epoch_day(
                    value.year,
                    i32::from(value.month),
                    i32::from(value.day),
                    Overflow::Reject
                )
                .unwrap(),
                epoch,
                "{line}"
            );
            assert_eq!(
                cal.to_epoch_day_code(
                    value.year,
                    value.month_code,
                    i32::from(value.day),
                    Overflow::Reject
                )
                .unwrap(),
                epoch,
                "{line}"
            );
            assert_eq!(
                cal.days_in_month(value.year, value.month).unwrap(),
                row[7].parse::<u8>().unwrap(),
                "{line}"
            );
            assert_eq!(
                cal.months_in_year(value.year).unwrap(),
                row[8].parse::<u8>().unwrap(),
                "{line}"
            );
            assert_eq!(
                cal.start_of_year(value.year + 1).unwrap() - cal.start_of_year(value.year).unwrap(),
                row[9].parse::<i64>().unwrap(),
                "{line}"
            );
            assert_eq!(
                epoch - cal.start_of_year(value.year).unwrap() + 1,
                row[12].parse::<i64>().unwrap(),
                "{line}"
            );
            let era = cal.era(epoch).unwrap();
            if row[10] == "-" {
                assert!(era.is_none())
            } else {
                let era = era.unwrap();
                assert_eq!((era.name, era.year), (row[10], row[11].parse().unwrap()));
                assert_eq!(cal.year_from_era(era.name, era.year).unwrap(), value.year);
            }
            fields += 1;
        } else if row[0] == "A" {
            let mut duration = DateDuration::default();
            let amount = row[4].parse().unwrap();
            match row[3] {
                "year" => duration.years = amount,
                "month" => duration.months = amount,
                "week" => duration.weeks = amount,
                _ => duration.days = amount,
            };
            assert_eq!(
                cal.add(epoch, duration, Overflow::Constrain).unwrap(),
                row[5].parse::<i64>().unwrap(),
                "{line}"
            );
            additions += 1;
        } else if row[0] == "D" {
            let unit = match row[4] {
                "year" => DateUnit::Year,
                "month" => DateUnit::Month,
                "week" => DateUnit::Week,
                _ => DateUnit::Day,
            };
            let expected = DateDuration {
                years: row[5].parse().unwrap(),
                months: row[6].parse().unwrap(),
                weeks: row[7].parse().unwrap(),
                days: row[8].parse().unwrap(),
            };
            assert_eq!(
                cal.until(epoch, row[3].parse().unwrap(), unit).unwrap(),
                expected,
                "{line}"
            );
            differences += 1;
        } else {
            panic!("Unknown fixture row: {line}")
        }
    }
    println!(
        "ICU table calendars: {fields} fields, {additions} additions, {differences} differences"
    );
    assert_eq!(fields, 15932);
    assert_eq!(additions, 6720);
    assert_eq!(additions, differences);
    let mut previous = None;
    let mut hko = 0;
    for line in include_str!(env!("FORMATJS_HKO_CALENDAR"))
        .lines()
        .filter(|s| !s.starts_with('#'))
    {
        let row: Vec<&str> = line.split('\t').collect();
        let epoch = row[0].parse::<i64>().unwrap();
        let cal = calendars[0];
        let value = cal.from_epoch_day(epoch).unwrap();
        assert_eq!(
            (value.year, value.month_code, value.day),
            (row[1].parse().unwrap(), code(row[2]), 1),
            "HKO {line}"
        );
        if let Some(last) = previous {
            let date = cal.from_epoch_day(last).unwrap();
            assert_eq!(
                i64::from(cal.days_in_month(date.year, date.month).unwrap()),
                epoch - last
            );
            assert_eq!(
                cal.add(
                    last,
                    DateDuration {
                        months: 1,
                        ..DateDuration::default()
                    },
                    Overflow::Constrain
                )
                .unwrap(),
                epoch
            );
        }
        previous = Some(epoch);
        hko += 1;
    }
    assert_eq!(hko, 2474);
    for cal in calendars {
        assert!(
            cal.until_raw(-110000000, 110000000, DateUnit::Year)
                .unwrap()
                .years
                > 600000
        );
        for epoch in [-100000001, -100000000, -1, 0, 1, 99999999, 100000000]
            .into_iter()
            .chain((-100000001..=100000000).step_by(133337))
        {
            let value = cal.from_epoch_day(epoch).unwrap();
            assert_eq!(
                cal.to_epoch_day_code(
                    value.year,
                    value.month_code,
                    i32::from(value.day),
                    Overflow::Reject
                )
                .unwrap(),
                epoch
            );
            assert_eq!(
                cal.add(epoch, DateDuration::default(), Overflow::Reject)
                    .unwrap(),
                epoch
            );
            for unit in [
                DateUnit::Year,
                DateUnit::Month,
                DateUnit::Week,
                DateUnit::Day,
            ] {
                assert_eq!(
                    cal.until(epoch, epoch, unit).unwrap(),
                    DateDuration::default()
                )
            }
        }
        assert!(cal.from_epoch_day(-100000002).is_err());
        assert!(cal.from_epoch_day(100000001).is_err());
    }
}
#[test]
fn rejects_corrupt_table_metadata_before_use() {
    let pack: Pack<Lunar> =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_CHINESE"))).unwrap();
    let data = pack.data.view();
    assert!(TableCalendar::lunisolar(TableCalendarId::IslamicUmmAlQura, data).is_err());
    assert!(
        TableCalendar::lunisolar(
            TableCalendarId::Chinese,
            LunisolarData {
                month_checkpoints: &[],
                ..data
            }
        )
        .is_err()
    );
    assert!(
        TableCalendar::lunisolar(
            TableCalendarId::Chinese,
            LunisolarData {
                end_day: data.end_day + 1,
                ..data
            }
        )
        .is_err()
    );
    let mut dictionary = data.dictionary.to_vec();
    dictionary.push(1 << 20);
    assert!(
        TableCalendar::lunisolar(
            TableCalendarId::Chinese,
            LunisolarData {
                dictionary: &dictionary,
                ..data
            }
        )
        .is_err()
    );
    let mut starts = data.month_checkpoints.to_vec();
    starts[1] += 1;
    assert!(
        TableCalendar::lunisolar(
            TableCalendarId::Chinese,
            LunisolarData {
                month_checkpoints: &starts,
                ..data
            }
        )
        .is_err()
    );
    let mut years = data.years.to_owned();
    years.replace_range(0..1, "!");
    assert!(
        TableCalendar::lunisolar(
            TableCalendarId::Chinese,
            LunisolarData {
                years: &years,
                ..data
            }
        )
        .is_err()
    );
    let pack: Pack<Umm> =
        serde_json::from_str(include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_UMALQURA"))).unwrap();
    let data = pack.data.view();
    let mut starts = data.start_days.to_vec();
    starts[1] += 1;
    assert!(
        TableCalendar::umm_al_qura(UmmAlQuraData {
            start_days: &starts,
            ..data
        })
        .is_err()
    );
}
