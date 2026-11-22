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
    // Proposal comparison §8.5.8 step 4: project the rounded epoch using the supplied offset.
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
    // Proposal comparison §8.5.8 steps 2, 5–6.a: display UTC with automatic precision.
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
    // Proposal comparison §5.5.9 step 7: start an empty buffer for ISO text.
    fn new() -> Self {
        Self {
            bytes: [0; 64],
            len: 0,
        }
    }
    // Proposal comparison §5.5.9 step 7: append one ASCII byte to the ISO text.
    fn push(&mut self, byte: u8) {
        self.bytes[self.len] = byte;
        self.len += 1;
    }
    // Proposal comparison §13.26 steps 2–3, 5: write two decimal digits.
    fn pair(&mut self, value: u32) {
        self.push(b'0' + (value / 10) as u8);
        self.push(b'0' + (value % 10) as u8);
    }
    // Proposal comparison §3.5.10 steps 1, 3: write the year at its selected width.
    fn number(&mut self, mut value: u32, width: usize) {
        let end = self.len + width;
        for byte in self.bytes[self.len..end].iter_mut().rev() {
            *byte = b'0' + (value % 10) as u8;
            value /= 10;
        }
        self.len = end;
    }
    // Proposal comparison §5.5.9 steps 1–3: write the year, month and day.
    pub(crate) fn date((year, month, day): (i32, u8, u8)) -> Self {
        let mut output = Self::new();
        // ECMA-262 preview §22.5.8 steps 1–4: choose four digits or a signed six-digit year.
        // https://tc39.es/ecma262/pr/3966/#sec-padisoyear
        if (0..=9999).contains(&year) {
            output.number(year as u32, 4);
        } else {
            output.push(if year < 0 { b'-' } else { b'+' });
            output.number(year.unsigned_abs(), 6);
        }
        output.push(b'-');
        output.pair(u32::from(month));
        output.push(b'-');
        output.pair(u32::from(day));
        output
    }
    // Proposal comparison §5.5.9 steps 5, 7: join the date and clock with T.
    pub(crate) fn date_time(fields: IsoDateTime, precision: Precision) -> Self {
        let mut output = Self::date((fields.year, fields.month, fields.day));
        output.push(b'T');
        output.append_time(
            (fields.hour, fields.minute, fields.second, fields.nanosecond),
            precision,
        );
        output
    }
    // ECMA-262 preview §22.3.15.11 steps 1–2: format the clock and its packed fraction.
    // https://tc39.es/ecma262/pr/3966/#sec-timerecordtostring
    pub(crate) fn time(fields: (u8, u8, u8, u32), precision: Precision) -> Self {
        let mut output = Self::new();
        output.append_time(fields, precision);
        output
    }
    // ECMA-262 preview §22.5.6 steps 1–7: write the colon-separated clock at the selected precision.
    // https://tc39.es/ecma262/pr/3966/#sec-formattimestring
    fn append_time(&mut self, fields: (u8, u8, u8, u32), precision: Precision) {
        self.pair(u32::from(fields.0));
        self.push(b':');
        self.pair(u32::from(fields.1));
        if precision != Precision::Minute {
            self.push(b':');
            self.pair(u32::from(fields.2));
            // https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L762-L770
            // Auto strips trailing zeroes, including the zero fraction; fixed precision truncates.
            let (value, digits) = match precision {
                Precision::Auto => {
                    let (mut value, mut digits) = (fields.3, 9usize);
                    while digits > 0 && value % 10 == 0 {
                        value /= 10;
                        digits -= 1;
                    }
                    (value, digits)
                }
                Precision::Digits(digits) => (
                    fields.3 / 10u32.pow(u32::from(9 - digits)),
                    usize::from(digits),
                ),
                Precision::Minute => unreachable!(),
            };
            if digits > 0 {
                self.push(b'.');
                self.number(value, digits);
            }
        }
    }
    // Proposal comparison §5.5.9 step 7: read the completed ISO text prefix.
    pub(crate) fn as_str(&self) -> Result<&str, fmt::Error> {
        core::str::from_utf8(&self.bytes[..self.len]).map_err(|_| fmt::Error)
    }
}
impl fmt::Display for FormattedInstant {
    // Proposal comparison §8.5.8 steps 5–8: append Z or the rounded offset to the ISO text.
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

// Proposal comparison §11.1.7 steps 1–2: round a signed offset to whole minutes.
pub(crate) fn offset_minutes(offset: i128) -> i128 {
    offset.signum() * ((offset.abs() + 30_000_000_000) / 60_000_000_000)
}
// Proposal comparison §11.1.7 step 3: write the rounded offset as signed hours and minutes.
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
