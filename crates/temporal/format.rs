use crate::rounding::round_instant;
use crate::{Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY, RoundingMode};
use core::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Precision {
    Auto,
    Minute,
    Digits(u8),
}

pub struct FormattedInstant {
    fields: IsoDateTime,
    precision: Precision,
    offset: Option<i64>,
}
impl Instant {
    pub fn format(
        self,
        precision: Precision,
        mode: RoundingMode,
        offset_nanoseconds: Option<i64>,
    ) -> Result<FormattedInstant, Error> {
        let quantum = match precision {
            Precision::Auto => 1,
            Precision::Minute => 60_000_000_000,
            Precision::Digits(digits) if digits <= 9 => 10i128.pow(u32::from(9 - digits)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        let offset = i128::from(offset_nanoseconds.unwrap_or(0));
        if !(-NANOSECONDS_PER_DAY + 1..NANOSECONDS_PER_DAY).contains(&offset) {
            return Err(Error::InvalidDateTime);
        }
        let rounded = round_instant(self.epoch_nanoseconds(), quantum, mode);
        Ok(FormattedInstant {
            fields: IsoDateTime::from_epoch_nanoseconds(rounded + offset)?,
            precision,
            offset: offset_nanoseconds,
        })
    }
}
impl fmt::Display for Instant {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(Precision::Auto, RoundingMode::Trunc, None)
            .map_err(|_| fmt::Error)?
            .fmt(f)
    }
}
pub(crate) struct IsoString {
    bytes: [u8; 64],
    len: usize,
}
impl IsoString {
    fn new() -> Self {
        Self {
            bytes: [0; 64],
            len: 0,
        }
    }
    fn push(&mut self, byte: u8) {
        self.bytes[self.len] = byte;
        self.len += 1;
    }
    fn pair(&mut self, value: u32) {
        self.push(b'0' + (value / 10) as u8);
        self.push(b'0' + (value % 10) as u8);
    }
    fn number(&mut self, mut value: u32, width: usize) {
        let end = self.len + width;
        for byte in self.bytes[self.len..end].iter_mut().rev() {
            *byte = b'0' + (value % 10) as u8;
            value /= 10;
        }
        self.len = end;
    }
    pub(crate) fn date_time(fields: IsoDateTime, precision: Precision) -> Self {
        let mut output = IsoString::new();
        if (0..=9999).contains(&fields.year) {
            output.number(fields.year as u32, 4);
        } else {
            output.push(if fields.year < 0 { b'-' } else { b'+' });
            output.number(fields.year.unsigned_abs(), 6);
        }
        output.push(b'-');
        output.pair(u32::from(fields.month));
        output.push(b'-');
        output.pair(u32::from(fields.day));
        output.push(b'T');
        output.pair(u32::from(fields.hour));
        output.push(b':');
        output.pair(u32::from(fields.minute));
        if precision != Precision::Minute {
            output.push(b':');
            output.pair(u32::from(fields.second));
            let (value, digits) = match precision {
                Precision::Auto => {
                    let (mut value, mut digits) = (fields.nanosecond, 9usize);
                    while digits > 0 && value % 10 == 0 {
                        value /= 10;
                        digits -= 1;
                    }
                    (value, digits)
                }
                Precision::Digits(digits) => (
                    fields.nanosecond / 10u32.pow(u32::from(9 - digits)),
                    usize::from(digits),
                ),
                Precision::Minute => unreachable!(),
            };
            if digits > 0 {
                output.push(b'.');
                output.number(value, digits);
            }
        }
        output
    }
    pub(crate) fn as_str(&self) -> Result<&str, fmt::Error> {
        core::str::from_utf8(&self.bytes[..self.len]).map_err(|_| fmt::Error)
    }
}
impl fmt::Display for FormattedInstant {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut output = IsoString::date_time(self.fields, self.precision);
        match self.offset {
            None => output.push(b'Z'),
            Some(offset) => {
                let minutes = offset_minutes(i128::from(offset));
                output.push(if minutes < 0 { b'-' } else { b'+' });
                let absolute = minutes.unsigned_abs() as u32;
                output.pair(absolute / 60);
                output.push(b':');
                output.pair(absolute % 60);
            }
        }
        f.write_str(output.as_str()?)
    }
}

pub(crate) fn offset_minutes(offset: i128) -> i128 {
    offset.signum() * ((offset.abs() + 30_000_000_000) / 60_000_000_000)
}
pub(crate) fn write_offset(f: &mut fmt::Formatter<'_>, offset: i128) -> fmt::Result {
    let minutes = offset_minutes(offset);
    write!(
        f,
        "{}{:02}:{:02}",
        if minutes < 0 { '-' } else { '+' },
        minutes.abs() / 60,
        minutes.abs() % 60
    )
}
