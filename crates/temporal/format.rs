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
impl fmt::Display for FormattedInstant {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let fields = self.fields;
        if (0..=9999).contains(&fields.year) {
            write!(f, "{:04}", fields.year)?;
        } else {
            write!(f, "{:+07}", fields.year)?;
        }
        write!(
            f,
            "-{:02}-{:02}T{:02}:{:02}",
            fields.month, fields.day, fields.hour, fields.minute
        )?;
        if self.precision != Precision::Minute {
            write!(f, ":{:02}", fields.second)?;
            let (value, digits) = match self.precision {
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
                write!(f, ".{value:0digits$}")?;
            }
        }
        match self.offset {
            None => f.write_str("Z"),
            Some(offset) => {
                let minutes = (offset.abs() + 30_000_000_000) / 60_000_000_000;
                write!(
                    f,
                    "{}{:02}:{:02}",
                    if offset < 0 && minutes != 0 { '-' } else { '+' },
                    minutes / 60,
                    minutes % 60
                )
            }
        }
    }
}
