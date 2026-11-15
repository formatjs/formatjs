use crate::{Error, Instant, IsoDateTime, PlainTime};

struct Cursor<'a> {
    bytes: &'a [u8],
    position: usize,
}
impl<'a> Cursor<'a> {
    fn new(value: &'a str) -> Self {
        Self {
            bytes: value.as_bytes(),
            position: 0,
        }
    }
    fn peek(&self) -> Option<u8> {
        self.bytes.get(self.position).copied()
    }
    fn take(&mut self, byte: u8) -> bool {
        if self.peek() != Some(byte) {
            return false;
        }
        self.position += 1;
        true
    }
    fn number(&mut self, digits: usize) -> Result<u32, Error> {
        let mut result = 0;
        for _ in 0..digits {
            let byte = self.peek().ok_or(Error::InvalidSyntax)?;
            if !byte.is_ascii_digit() {
                return Err(Error::InvalidSyntax);
            }
            self.position += 1;
            result = result * 10 + u32::from(byte - b'0');
        }
        Ok(result)
    }
    fn time(&mut self, offset: bool, sub_minute: bool) -> Result<(u8, u8, u8, u32), Error> {
        let hour = self.number(2)?;
        let (mut minute, mut second, mut fraction) = (0, 0, 0);
        let extended = self.take(b':');
        if extended || self.peek().is_some_and(|b| b.is_ascii_digit()) {
            minute = self.number(2)?;
            let has_second = if extended {
                self.take(b':')
            } else {
                self.peek().is_some_and(|b| b.is_ascii_digit())
            };
            if has_second {
                if !sub_minute {
                    return Err(Error::InvalidSyntax);
                }
                second = self.number(2)?;
                if self.take(b'.') || self.take(b',') {
                    let mut digits = 0;
                    while self.peek().is_some_and(|b| b.is_ascii_digit()) {
                        if digits == 9 {
                            return Err(Error::InvalidSyntax);
                        }
                        fraction = fraction * 10 + self.number(1)?;
                        digits += 1;
                    }
                    if digits == 0 {
                        return Err(Error::InvalidSyntax);
                    }
                    fraction *= 10u32.pow(9 - digits);
                }
            }
        }
        if hour > 23 || minute > 59 || second > if offset { 59 } else { 60 } {
            return Err(Error::InvalidDateTime);
        }
        Ok((hour as u8, minute as u8, second.min(59) as u8, fraction))
    }
    fn offset(&mut self, sub_minute: bool) -> Result<i128, Error> {
        let negative = self.take(b'-');
        if !negative && !self.take(b'+') {
            return Err(Error::InvalidSyntax);
        }
        let (h, m, s, ns) = self.time(true, sub_minute)?;
        let value = (i128::from(h) * 3600 + i128::from(m) * 60 + i128::from(s)) * 1_000_000_000
            + i128::from(ns);
        Ok(if negative { -value } else { value })
    }
}

pub fn instant(value: &str) -> Result<Instant, Error> {
    let mut input = Cursor::new(value);
    let negative = input.take(b'-');
    let extended_year = negative || input.take(b'+');
    let year = input.number(if extended_year { 6 } else { 4 })? as i32;
    if negative && year == 0 {
        return Err(Error::InvalidSyntax);
    }
    let separated = input.take(b'-');
    let month = input.number(2)?;
    if separated && !input.take(b'-') {
        return Err(Error::InvalidSyntax);
    }
    let day = input.number(2)?;
    if !input.take(b'T') && !input.take(b't') && !input.take(b' ') {
        return Err(Error::InvalidSyntax);
    }
    let (hour, minute, second, nanosecond) = input.time(false, true)?;
    let offset = if input.take(b'Z') || input.take(b'z') {
        0
    } else {
        input.offset(true)?
    };
    annotations(&value[input.position..])?;
    Instant::from_iso_offset(
        IsoDateTime {
            year: if negative { -year } else { year },
            month: month as u8,
            day: day as u8,
            hour,
            minute,
            second,
            nanosecond,
        },
        offset,
    )
}
pub fn plain_time(value: &str) -> Result<PlainTime, Error> {
    let index = value.find('[').unwrap_or(value.len());
    let body = &value[..index];
    annotations(&value[index..])?;
    let mut input = Cursor::new(body);
    if let Some(separator) = body.find(['T', 't', ' ']) {
        if separator == 0 && body.starts_with(' ') {
            return Err(Error::InvalidSyntax);
        }
        if separator > 0 {
            let negative = input.take(b'-');
            let extended = negative || input.take(b'+');
            let year = input.number(if extended { 6 } else { 4 })?;
            let separated = input.take(b'-');
            let month = input.number(2)?;
            if separated && !input.take(b'-') {
                return Err(Error::InvalidSyntax);
            }
            let day = input.number(2)?;
            let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
            let maximum = match month {
                2 => 28 + u32::from(leap),
                4 | 6 | 9 | 11 => 30,
                _ => 31,
            };
            if (negative && year == 0)
                || !(1..=12).contains(&month)
                || day == 0
                || day > maximum
                || input.position != separator
            {
                return Err(Error::InvalidDateTime);
            }
        }
        input.position = separator + 1;
    } else {
        let (digits, separated) = match body.len() {
            4 => (4, false),
            5 if body.as_bytes()[2] == b'-' => (4, true),
            6 => (6, false),
            7 if body.as_bytes()[4] == b'-' => (6, true),
            _ => (0, false),
        };
        if digits > 0 {
            let mut date = Cursor::new(body);
            if let Ok(first) = date.number(if digits == 4 { 2 } else { 4 }) {
                if separated {
                    date.take(b'-');
                }
                if let Ok(second) = date.number(2) {
                    let valid = if digits == 6 {
                        (1..=12).contains(&second)
                    } else {
                        (1..=12).contains(&first)
                            && second > 0
                            && second
                                <= match first {
                                    2 => 29,
                                    4 | 6 | 9 | 11 => 30,
                                    _ => 31,
                                }
                    };
                    if valid {
                        return Err(Error::InvalidSyntax);
                    }
                }
            }
        }
    }
    let (hour, minute, second, fraction) = input.time(false, true)?;
    if input.peek().is_some() {
        input.offset(true)?;
    }
    if input.position != body.len() {
        return Err(Error::InvalidSyntax);
    }
    PlainTime::new(hour, minute, second, fraction)
}

pub(crate) fn plain_date_time_fields(value: &str) -> Result<IsoDateTime, Error> {
    let index = value.find('[').unwrap_or(value.len());
    iso_annotations(&value[index..])?;
    let body = &value[..index];
    let mut input = Cursor::new(body);
    let negative = input.take(b'-');
    let extended = negative || input.take(b'+');
    let year = input.number(if extended { 6 } else { 4 })? as i32;
    if negative && year == 0 {
        return Err(Error::InvalidSyntax);
    }
    let separated = input.take(b'-');
    let month = input.number(2)? as u8;
    if separated && !input.take(b'-') {
        return Err(Error::InvalidSyntax);
    }
    let day = input.number(2)? as u8;
    let (hour, minute, second, nanosecond) =
        if input.take(b'T') || input.take(b't') || input.take(b' ') {
            let fields = input.time(false, true)?;
            if input.peek().is_some() {
                input.offset(true)?;
            }
            fields
        } else {
            (0, 0, 0, 0)
        };
    if input.position != body.len() {
        return Err(Error::InvalidSyntax);
    }
    Ok(IsoDateTime {
        year: if negative { -year } else { year },
        month,
        day,
        hour,
        minute,
        second,
        nanosecond,
    })
}

fn iso_annotations(value: &str) -> Result<(), Error> {
    annotations(value)?;
    let mut calendar_seen = false;
    for annotation in value.split('[').skip(1) {
        let text = annotation
            .trim_end_matches(']')
            .strip_prefix('!')
            .unwrap_or(annotation.trim_end_matches(']'));
        if let Some(calendar) = text.strip_prefix("u-ca=") {
            if !calendar_seen && !calendar.eq_ignore_ascii_case("iso8601") {
                return Err(Error::InvalidSyntax);
            }
            calendar_seen = true;
        }
    }
    Ok(())
}
pub(crate) fn short_date_fields(value: &str, year_month: bool) -> Result<IsoDateTime, Error> {
    let index = value.find('[').unwrap_or(value.len());
    iso_annotations(&value[index..])?;
    let body = &value[..index];
    if !year_month
        && (body.len() > 7
            || body.starts_with('+')
            || (body.starts_with('-') && !body.starts_with("--")))
    {
        let fields = plain_date_time_fields(value)?;
        if fields.day == 0 || fields.day > crate::date::month_length(fields.year, fields.month) {
            return Err(Error::InvalidDateTime);
        }
        return Ok(fields);
    }
    let mut input = Cursor::new(body);
    let short = if year_month {
        let negative = input.take(b'-');
        let extended = negative || input.take(b'+');
        let year = input.number(if extended { 6 } else { 4 })? as i32;
        if negative && year == 0 {
            return Err(Error::InvalidSyntax);
        }
        input.take(b'-');
        let month = input.number(2)? as u8;
        (if negative { -year } else { year }, month, 1)
    } else {
        let md = body.strip_prefix("--").unwrap_or(body);
        input = Cursor::new(md);
        let month = input.number(2)? as u8;
        input.take(b'-');
        let day = input.number(2)? as u8;
        (1972, month, day)
    };
    let fields = if input.position == input.bytes.len() {
        IsoDateTime {
            year: short.0,
            month: short.1,
            day: short.2,
            hour: 0,
            minute: 0,
            second: 0,
            nanosecond: 0,
        }
    } else {
        plain_date_time_fields(value)?
    };
    if fields.day == 0 || fields.day > crate::date::month_length(fields.year, fields.month) {
        return Err(Error::InvalidDateTime);
    }
    Ok(fields)
}

fn annotations(mut value: &str) -> Result<(), Error> {
    let (mut calendar_seen, mut critical_calendar, mut annotation_seen, mut zone_seen) =
        (false, false, false, false);
    while !value.is_empty() {
        value = value.strip_prefix('[').ok_or(Error::InvalidSyntax)?;
        let critical = value.starts_with('!');
        if critical {
            value = &value[1..];
        }
        let end = value.find(']').ok_or(Error::InvalidSyntax)?;
        let text = &value[..end];
        if let Some((key, contents)) = text.split_once('=') {
            let lower = |b: u8| b.is_ascii_lowercase() || b == b'_';
            if !key.as_bytes().first().copied().is_some_and(lower)
                || !key
                    .bytes()
                    .all(|b| lower(b) || b.is_ascii_digit() || b == b'-')
                || !contents
                    .split('-')
                    .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_alphanumeric()))
            {
                return Err(Error::InvalidSyntax);
            }
            annotation_seen = true;
            if key == "u-ca" {
                if calendar_seen && (critical || critical_calendar) {
                    return Err(Error::InvalidSyntax);
                }
                calendar_seen = true;
                critical_calendar |= critical;
            } else if critical {
                return Err(Error::InvalidSyntax);
            }
        } else {
            if zone_seen || annotation_seen {
                return Err(Error::InvalidSyntax);
            }
            zone_seen = true;
            if text.starts_with(['+', '-']) {
                let mut zone = Cursor::new(text);
                zone.offset(false)?;
                if zone.position != text.len() {
                    return Err(Error::InvalidSyntax);
                }
            } else if !text.split('/').all(|part| {
                let leading = |b: u8| b.is_ascii_alphabetic() || b == b'.' || b == b'_';
                part.as_bytes().first().copied().is_some_and(leading)
                    && part
                        .bytes()
                        .all(|b| leading(b) || b.is_ascii_digit() || b == b'+' || b == b'-')
            }) {
                return Err(Error::InvalidSyntax);
            }
        }
        value = &value[end + 1..];
    }
    Ok(())
}
