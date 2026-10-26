use formatjs_intl_datetimeformat::{
    Error,
    civil::{CivilDateTime, TIME_CLIP_BOUND, time_clip},
};

fn date(milliseconds: i64) -> CivilDateTime {
    CivilDateTime::from_epoch_nanoseconds(i128::from(milliseconds) * 1_000_000).unwrap()
}

#[test]
fn time_clip_checks_bounds_before_truncation_and_rejects_nonfinite() {
    for value in [
        f64::NAN,
        f64::INFINITY,
        f64::NEG_INFINITY,
        (TIME_CLIP_BOUND + 1) as f64,
        -(TIME_CLIP_BOUND + 1) as f64,
    ] {
        assert_eq!(time_clip(value), Err(Error::InvalidDate));
    }
    assert_eq!(time_clip(TIME_CLIP_BOUND as f64), Ok(TIME_CLIP_BOUND));
    assert_eq!(time_clip(-(TIME_CLIP_BOUND as f64)), Ok(-TIME_CLIP_BOUND));
    assert_eq!(time_clip(-1.9), Ok(-1));
    assert_eq!(time_clip(1.9), Ok(1));
    assert_eq!(time_clip(-0.0), Ok(0));
}

#[test]
fn negative_submilliseconds_floor_for_calendar_fields() {
    assert_eq!(
        CivilDateTime::from_epoch_nanoseconds(-1).unwrap(),
        CivilDateTime {
            year: 1969,
            month: 12,
            day: 31,
            weekday: 3,
            hour: 23,
            minute: 59,
            second: 59,
            nanosecond: 999_999_999,
        }
    );
    assert_eq!(
        date(0),
        CivilDateTime {
            year: 1970,
            month: 1,
            day: 1,
            weekday: 4,
            hour: 0,
            minute: 0,
            second: 0,
            nanosecond: 0,
        }
    );
}

#[test]
fn full_date_range_and_offset_crossings_use_astronomical_years() {
    for value in [
        i128::MIN,
        i128::MAX,
        i128::from(TIME_CLIP_BOUND + 86_400_000) * 1_000_000 + 1,
        -i128::from(TIME_CLIP_BOUND + 86_400_000) * 1_000_000 - 1,
    ] {
        assert_eq!(
            CivilDateTime::from_epoch_nanoseconds(value),
            Err(Error::InvalidDate)
        );
    }
    let first = date(-TIME_CLIP_BOUND);
    assert_eq!((first.year, first.month, first.day), (-271821, 4, 20));
    let last = date(TIME_CLIP_BOUND);
    assert_eq!((last.year, last.month, last.day), (275760, 9, 13));
    let before = date(-TIME_CLIP_BOUND - 86_400_000);
    let after = date(TIME_CLIP_BOUND + 86_400_000);
    assert_eq!((before.year, before.month, before.day), (-271821, 4, 19));
    assert_eq!((after.year, after.month, after.day), (275760, 9, 14));
    let zero = date(-62_167_219_200_000);
    assert_eq!((zero.year, zero.month, zero.day), (0, 1, 1));
    assert_eq!(zero.era_year(), ("BC", 1));
    assert_eq!(date(0).era_year(), ("AD", 1970));
}

#[test]
fn gregorian_century_rules_and_four_hundred_year_cycles() {
    let leap = date(951_782_400_000);
    assert_eq!((leap.year, leap.month, leap.day), (2000, 2, 29));
    let century = date(-2_203_891_200_000);
    assert_eq!((century.year, century.month, century.day), (1900, 3, 1));
    for milliseconds in [-62_167_219_200_000, -1, 0, 951_782_400_000] {
        let start = date(milliseconds);
        let next = date(milliseconds + 146_097 * 86_400_000);
        assert_eq!(next.year, start.year + 400);
        assert_eq!(
            (
                next.month,
                next.day,
                next.weekday,
                next.hour,
                next.nanosecond
            ),
            (
                start.month,
                start.day,
                start.weekday,
                start.hour,
                start.nanosecond
            )
        );
    }
}
