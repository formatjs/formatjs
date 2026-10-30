use crate::{DateTimeValue, civil::TIME_CLIP_BOUND, selection::Kind};
use serde::Deserialize;
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase", deny_unknown_fields)]
pub(crate) enum Value {
    Number {
        value: String,
    },
    Epoch {
        kind: Kind,
        value: String,
        calendar: Option<String>,
    },
    Plain {
        kind: Kind,
        iso: String,
    },
    Zoned {},
}
impl Value {
    pub fn into_value(self) -> Result<DateTimeValue, i32> {
        match self {
            Self::Number { value } => Ok(DateTimeValue::Number(value.parse().map_err(|_| 1)?)),
            Self::Epoch {
                kind,
                value,
                calendar,
            } => Ok(DateTimeValue::Temporal {
                kind,
                calendar,
                epoch_nanoseconds: value.parse().map_err(|_| 1)?,
            }),
            Self::Plain { kind, iso } => plain(kind, &iso),
            Self::Zoned {} => Ok(DateTimeValue::ZonedDateTime),
        }
    }
}
fn number(text: &str) -> Result<i32, i32> {
    if text.is_empty() || !text.bytes().all(|byte| byte.is_ascii_digit()) {
        return Err(1);
    }
    text.parse().map_err(|_| 1)
}
fn plain(kind: Kind, iso: &str) -> Result<DateTimeValue, i32> {
    if kind == Kind::Instant || !iso.is_ascii() {
        return Err(1);
    }
    let (text, calendar) = if let Some((text, annotation)) = iso.split_once("[u-ca=") {
        let calendar = annotation
            .strip_suffix(']')
            .filter(|calendar| !calendar.is_empty() && !calendar.contains(['[', ']']))
            .ok_or(1)?;
        (text, Some(calendar.into()))
    } else {
        (iso, None)
    };
    let mut days = 0i64;
    let time;
    if kind == Kind::PlainTime {
        time = Some(text);
    } else {
        let (date, clock) = text
            .split_once('T')
            .map(|(date, time)| (date, Some(time)))
            .unwrap_or((text, None));
        if (kind == Kind::PlainDateTime) != clock.is_some() {
            return Err(1);
        }
        let signed = date.starts_with(['+', '-']);
        let length = if signed { 7 } else { 4 };
        if date.len() != length + 6
            || date.get(length..length + 1) != Some("-")
            || date.get(length + 3..length + 4) != Some("-")
        {
            return Err(1);
        }
        let mut year = number(&date[usize::from(signed)..length])?;
        if date.starts_with('-') {
            if year == 0 {
                return Err(1);
            }
            year = -year;
        }
        let month = number(&date[length + 1..length + 3])?;
        let day = number(&date[length + 4..length + 6])?;
        let leap =
            year.rem_euclid(4) == 0 && (year.rem_euclid(100) != 0 || year.rem_euclid(400) == 0);
        let months = [
            31,
            if leap { 29 } else { 28 },
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ];
        if !(1..=12).contains(&month) || day < 1 || day > months[(month - 1) as usize] {
            return Err(1);
        }
        let adjusted = i64::from(year) - i64::from(month <= 2);
        let era = adjusted.div_euclid(400);
        let year_of_era = adjusted.rem_euclid(400);
        let march_month = i64::from(month) + if month > 2 { -3 } else { 9 };
        let day_of_year = (153 * march_month + 2) / 5 + i64::from(day) - 1;
        days = era * 146097 + year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year
            - 719468;
        if kind == Kind::PlainYearMonth {
            if !(-3261848..=3309129).contains(&(12 * year + month)) {
                return Err(1);
            }
        } else if !(-100000001..=100000000).contains(&days) {
            return Err(1);
        }
        time = clock;
    }
    let mut nanos = 43_200_000_000_000i128;
    if let Some(clock) = time {
        let (whole, fraction) = clock
            .split_once('.')
            .map(|(whole, fraction)| (whole, Some(fraction)))
            .unwrap_or((clock, None));
        if whole.len() != 8 || whole.get(2..3) != Some(":") || whole.get(5..6) != Some(":") {
            return Err(1);
        }
        let hour = number(&whole[..2])?;
        let minute = number(&whole[3..5])?;
        let second = number(&whole[6..])?;
        if hour > 23 || minute > 59 || second > 59 {
            return Err(1);
        }
        nanos = i128::from(hour * 3600 + minute * 60 + second) * 1_000_000_000;
        if let Some(fraction) = fraction {
            if fraction.len() > 9 {
                return Err(1);
            }
            nanos += i128::from(number(fraction)?) * 10i128.pow(9 - fraction.len() as u32);
        }
    }
    let epoch_nanoseconds = i128::from(days) * 86_400_000_000_000 + nanos;
    if kind == Kind::PlainDateTime {
        let edge = i128::from(TIME_CLIP_BOUND) * 1_000_000 + 86_400_000_000_000;
        if epoch_nanoseconds <= -edge || epoch_nanoseconds >= edge {
            return Err(1);
        }
    }
    Ok(DateTimeValue::Temporal {
        kind,
        calendar,
        epoch_nanoseconds,
    })
}
