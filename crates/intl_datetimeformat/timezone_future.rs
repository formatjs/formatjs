use serde::Deserialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TimeZoneOffset {
    pub seconds: i32,
    pub in_dst: bool,
}

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum Rule {
    Month {
        month: i64,
        week: i64,
        weekday: i64,
        seconds: i64,
    },
    Day {
        day: i64,
        seconds: i64,
    },
    Julian {
        day: i64,
        seconds: i64,
    },
}

fn leap(year: i64) -> bool {
    year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)
}

fn year_start(year: i64) -> i64 {
    365 * (year - 1970) + (year - 1969).div_euclid(4) - (year - 1901).div_euclid(100)
        + (year - 1601).div_euclid(400)
}

impl Rule {
    fn valid(&self) -> bool {
        let (valid, seconds) = match *self {
            Self::Month {
                month,
                week,
                weekday,
                seconds,
            } => (
                (1..=12).contains(&month) && (1..=5).contains(&week) && (0..=6).contains(&weekday),
                seconds,
            ),
            Self::Day { day, seconds } => ((0..=365).contains(&day), seconds),
            Self::Julian { day, seconds } => ((1..=365).contains(&day), seconds),
        };
        valid && (-604_799..=604_799).contains(&seconds)
    }

    fn transition(&self, year: i64) -> i64 {
        const MONTHS: [i64; 12] = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let start = year_start(year);
        let is_leap = leap(year);
        let (day, seconds) = match *self {
            Self::Month {
                month,
                week,
                weekday,
                seconds,
            } => {
                let first = start + MONTHS[(month - 1) as usize] + i64::from(is_leap && month > 2);
                let mut day =
                    first + (weekday - (first + 4).rem_euclid(7)).rem_euclid(7) + (week - 1) * 7;
                let next = if month == 12 {
                    year_start(year + 1)
                } else {
                    start + MONTHS[month as usize] + i64::from(is_leap && month >= 2)
                };
                if day >= next {
                    day -= 7;
                }
                (day, seconds)
            }
            Self::Day { day, seconds } => (start + day, seconds),
            Self::Julian { day, seconds } => {
                (start + day - 1 + i64::from(is_leap && day >= 60), seconds)
            }
        };
        day * 86_400 + seconds
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct FutureRule {
    standard_offset: i32,
    daylight_offset: Option<i32>,
    start: Option<Rule>,
    end: Option<Rule>,
}

impl FutureRule {
    pub fn valid(&self) -> bool {
        if !(-93_599..=93_599).contains(&self.standard_offset) {
            return false;
        }
        match (&self.daylight_offset, &self.start, &self.end) {
            (None, None, None) => true,
            (Some(offset), Some(start), Some(end)) => {
                (-93_599..=93_599).contains(offset) && start.valid() && end.valid()
            }
            _ => false,
        }
    }

    pub fn offset_at(&self, epoch_nanoseconds: i128) -> Option<TimeZoneOffset> {
        let Some(daylight) = self.daylight_offset else {
            return Some(TimeZoneOffset {
                seconds: self.standard_offset,
                in_dst: false,
            });
        };
        let seconds = epoch_nanoseconds.div_euclid(1_000_000_000);
        let day = i64::try_from(seconds.div_euclid(86_400)).ok()?;
        if !(-100_000_031..=100_000_031).contains(&day) {
            return None;
        }
        let mut year = 1970 + (day * 400).div_euclid(146_097);
        while year_start(year) > day {
            year -= 1;
        }
        while year_start(year + 1) <= day {
            year += 1;
        }
        let mut latest = i128::MIN;
        let mut in_dst = false;
        for y in year - 1..=year + 1 {
            let begin =
                i128::from(self.start.as_ref()?.transition(y) - i64::from(self.standard_offset));
            let finish = i128::from(self.end.as_ref()?.transition(y) - i64::from(daylight));
            // All-year DST has coincident end/start events; start wins.
            if begin <= seconds && begin >= latest {
                latest = begin;
                in_dst = true;
            }
            if finish <= seconds && finish > latest {
                latest = finish;
                in_dst = false;
            }
        }
        Some(TimeZoneOffset {
            seconds: if in_dst {
                daylight
            } else {
                self.standard_offset
            },
            in_dst,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rule(value: &str) -> FutureRule {
        let result: FutureRule = serde_json::from_str(value).unwrap();
        assert!(result.valid());
        result
    }

    #[test]
    fn future_transition_keeps_nanosecond_boundary() {
        let future = rule(
            r#"{"standardOffset":-18000,"daylightOffset":-14400,"start":{"kind":"month","month":3,"week":2,"weekday":0,"seconds":7200},"end":{"kind":"month","month":11,"week":1,"weekday":0,"seconds":7200}}"#,
        );
        // 2500-03-14T07:00:00Z, independently fixed calendar date.
        let instant = 16_731_471_600_000_000_000i128;
        assert_eq!(
            future.offset_at(instant - 1).unwrap(),
            TimeZoneOffset {
                seconds: -18000,
                in_dst: false
            }
        );
        assert_eq!(
            future.offset_at(instant).unwrap(),
            TimeZoneOffset {
                seconds: -14400,
                in_dst: true
            }
        );
    }

    #[test]
    fn southern_half_hour_dst_continues_in_distant_years() {
        let future = rule(
            r#"{"standardOffset":37800,"daylightOffset":39600,"start":{"kind":"month","month":10,"week":1,"weekday":0,"seconds":7200},"end":{"kind":"month","month":4,"week":1,"weekday":0,"seconds":7200}}"#,
        );
        let january = i128::from(year_start(2500) + 14) * 86_400_000_000_000;
        let july = i128::from(year_start(2500) + 195) * 86_400_000_000_000;
        assert_eq!(
            future.offset_at(january).unwrap(),
            TimeZoneOffset {
                seconds: 39600,
                in_dst: true
            }
        );
        assert_eq!(
            future.offset_at(july).unwrap(),
            TimeZoneOffset {
                seconds: 37800,
                in_dst: false
            }
        );
    }

    #[test]
    fn malformed_rules_reject_before_evaluation() {
        for value in [
            r#"{"standardOffset":0,"daylightOffset":3600}"#,
            r#"{"standardOffset":100000}"#,
            r#"{"standardOffset":0,"daylightOffset":3600,"start":{"kind":"month","month":0,"week":1,"weekday":0,"seconds":7200},"end":{"kind":"day","day":365,"seconds":0}}"#,
        ] {
            let future: FutureRule = serde_json::from_str(value).unwrap();
            assert!(!future.valid());
        }
    }

    #[test]
    fn all_year_dst_wins_coincident_transition_events() {
        // RFC 9636 section 3.3.1, including its negative-DST form.
        for (standard, daylight, end_seconds) in [(-18000, -14400, 90000), (-10800, -14400, 82800)]
        {
            let future: FutureRule = serde_json::from_value(serde_json::json!({
                "standardOffset": standard, "daylightOffset": daylight,
                "start": {"kind": "day", "day": 0, "seconds": 0},
                "end": {"kind": "julian", "day": 365, "seconds": end_seconds},
            }))
            .unwrap();
            assert!(future.valid());
            for day in [0, 14, 195, 364] {
                let instant = i128::from(year_start(2500) + day) * 86_400_000_000_000;
                assert_eq!(
                    future.offset_at(instant).unwrap(),
                    TimeZoneOffset {
                        seconds: daylight,
                        in_dst: true
                    }
                );
            }
        }
    }
}
