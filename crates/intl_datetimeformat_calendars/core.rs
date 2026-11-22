//! Allocation-free numeric calendar math. Callers own Temporal coercion.
use crate::date_math::NumericCalendar;
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Calendar {
    Iso8601,
    Gregory,
    Buddhist,
    Japanese,
    Roc,
    Coptic,
    Ethiopic,
    Ethioaa,
    Hebrew,
    Indian,
    IslamicCivil,
    IslamicTabular,
    Persian,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Error {
    InvalidDate,
    InvalidMonthCode,
    InvalidEra,
    InvalidDuration,
    OutOfRange,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Overflow {
    Constrain,
    Reject,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct MonthCode {
    pub number: u8,
    pub leap: bool,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Date {
    pub year: i32,
    pub month: u8,
    pub day: u8,
    pub month_code: MonthCode,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct Era {
    pub name: &'static str,
    pub year: i32,
}
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq)]
pub struct DateDuration {
    pub years: i64,
    pub months: i64,
    pub weeks: i64,
    pub days: i64,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum DateUnit {
    Year,
    Month,
    Week,
    Day,
}
const MIN_DAY: i64 = -100_000_001;
const MAX_DAY: i64 = 100_000_000;
const JAPANESE_ERAS: [(i64, &str, i32); 5] = [
    (18017, "reiwa", 2018),
    (6947, "heisei", 1988),
    (-15713, "showa", 1925),
    (-20974, "taisho", 1911),
    (-35428, "meiji", 1867),
];

impl Calendar {
    pub const ALL: [Self; 13] = [
        Self::Iso8601,
        Self::Gregory,
        Self::Buddhist,
        Self::Japanese,
        Self::Roc,
        Self::Coptic,
        Self::Ethiopic,
        Self::Ethioaa,
        Self::Hebrew,
        Self::Indian,
        Self::IslamicCivil,
        Self::IslamicTabular,
        Self::Persian,
    ];
    // Proposal comparison §3.3.3 step 3: expose the selected arithmetic calendar name.
    pub fn name(self) -> &'static str {
        match self {
            Self::Iso8601 => "iso8601",
            Self::Gregory => "gregory",
            Self::Buddhist => "buddhist",
            Self::Japanese => "japanese",
            Self::Roc => "roc",
            Self::Coptic => "coptic",
            Self::Ethiopic => "ethiopic",
            Self::Ethioaa => "ethioaa",
            Self::Hebrew => "hebrew",
            Self::Indian => "indian",
            Self::IslamicCivil => "islamic-civil",
            Self::IslamicTabular => "islamic-tbla",
            Self::Persian => "persian",
        }
    }
    // Proposal comparison §12.3.10 step 4: select the arithmetic calendar for a prepared name.
    pub fn from_name(name: &str) -> Option<Self> {
        Some(match name {
            "iso8601" => Self::Iso8601,
            "gregory" => Self::Gregory,
            "buddhist" => Self::Buddhist,
            "japanese" => Self::Japanese,
            "roc" => Self::Roc,
            "coptic" => Self::Coptic,
            "ethiopic" => Self::Ethiopic,
            "ethioaa" | "ethiopic-amete-alem" => Self::Ethioaa,
            "hebrew" => Self::Hebrew,
            "indian" => Self::Indian,
            "islamic-civil" | "islamicc" => Self::IslamicCivil,
            "islamic-tbla" => Self::IslamicTabular,
            "persian" => Self::Persian,
            _ => return None,
        })
    }
    // Proposal comparison §3.3.11 step 3: compute the year boundary used by day-of-year.
    pub fn start_of_year(self, year: i32) -> Result<i64, Error> {
        let year = check_year(i64::from(year))?;
        Ok(match self {
            Self::Iso8601 | Self::Gregory | Self::Japanese => iso_day(year as i32, 1, 1),
            Self::Buddhist => iso_day((year - 543) as i32, 1, 1),
            Self::Roc => iso_day((year + 1911) as i32, 1, 1),
            Self::Coptic => 1_824_665 - 2_440_588 + 365 * year + year.div_euclid(4),
            Self::Ethiopic => 1_723_856 - 2_440_588 + 365 * year + year.div_euclid(4),
            Self::Ethioaa => {
                let y = year - 5500;
                1_723_856 - 2_440_588 + 365 * y + y.div_euclid(4)
            }
            Self::Hebrew => hebrew_start(year),
            Self::Indian => {
                let y = (year + 78) as i32;
                iso_day(y, 3, if leap(y) { 21 } else { 22 })
            }
            Self::IslamicCivil | Self::IslamicTabular => {
                1_948_440 - 2_440_588 - i64::from(self == Self::IslamicTabular)
                    + 354 * (year - 1)
                    + (3 + 11 * year).div_euclid(30)
            }
            Self::Persian => {
                1_948_320 - 2_440_588 + 365 * (year - 1) + (8 * year + 21).div_euclid(33)
            }
        })
    }
    // Proposal comparison §3.3.17 step 3: read the arithmetic calendar month count.
    pub fn months_in_year(self, year: i32) -> Result<u8, Error> {
        check_year(i64::from(year))?;
        Ok(match self {
            Self::Coptic | Self::Ethiopic | Self::Ethioaa => 13,
            Self::Hebrew if hebrew_leap(year) => 13,
            _ => 12,
        })
    }
    // Proposal comparison §3.3.15 step 3: calculate month length for the validated calendar month.
    pub fn days_in_month(self, year: i32, month: u8) -> Result<u8, Error> {
        if month == 0 || month > self.months_in_year(year)? {
            return Err(Error::InvalidDate);
        }
        let year_length = || -> Result<i64, Error> {
            Ok(self.start_of_year(year + 1)? - self.start_of_year(year)?)
        };
        Ok(match self {
            Self::Iso8601 | Self::Gregory | Self::Japanese | Self::Buddhist | Self::Roc => {
                let y = year
                    + if self == Self::Buddhist {
                        -543
                    } else if self == Self::Roc {
                        1911
                    } else {
                        0
                    };
                match month {
                    2 => 28 + u8::from(leap(y)),
                    4 | 6 | 9 | 11 => 30,
                    _ => 31,
                }
            }
            Self::Coptic | Self::Ethiopic | Self::Ethioaa => {
                if month == 13 {
                    (year_length()? - 360) as u8
                } else {
                    30
                }
            }
            Self::Indian => {
                if month == 1 {
                    30 + u8::from(leap(year + 78))
                } else if month <= 6 {
                    31
                } else {
                    30
                }
            }
            Self::IslamicCivil | Self::IslamicTabular => {
                if month % 2 == 1 || month == 12 && year_length()? == 355 {
                    30
                } else {
                    29
                }
            }
            Self::Persian => {
                if month <= 6 {
                    31
                } else if month < 12 {
                    30
                } else {
                    (year_length()? - 336) as u8
                }
            }
            Self::Hebrew => {
                let code = month + u8::from(!hebrew_leap(year) && month >= 6);
                match code {
                    4 | 7 | 9 | 11 | 13 => 29,
                    2 => {
                        if year_length()? % 10 == 5 {
                            30
                        } else {
                            29
                        }
                    }
                    3 => {
                        if year_length()? % 10 == 3 {
                            29
                        } else {
                            30
                        }
                    }
                    _ => 30,
                }
            }
        })
    }
    // Proposal comparison §3.3.8 step 3: map the ordinal to its month code.
    pub fn month_code(self, year: i32, month: u8) -> Result<MonthCode, Error> {
        if month == 0 || month > self.months_in_year(year)? {
            return Err(Error::InvalidDate);
        }
        let leap = self == Self::Hebrew && hebrew_leap(year);
        Ok(if leap && month == 6 {
            MonthCode {
                number: 5,
                leap: true,
            }
        } else {
            MonthCode {
                number: month - u8::from(leap && month > 6),
                leap: false,
            }
        })
    }
    // Proposal comparison §12.3.31 step 2.a: resolve the month code to an ordinal.
    pub fn month_from_code(
        self,
        year: i32,
        code: MonthCode,
        overflow: Overflow,
    ) -> Result<u8, Error> {
        check_year(i64::from(year))?;
        if code.leap {
            if self != Self::Hebrew || code.number != 5 {
                return Err(Error::InvalidMonthCode);
            }
            if !hebrew_leap(year) && overflow == Overflow::Reject {
                return Err(Error::InvalidMonthCode);
            }
            return Ok(6);
        }
        let max = if matches!(self, Self::Coptic | Self::Ethiopic | Self::Ethioaa) {
            13
        } else {
            12
        };
        if code.number == 0 || code.number > max {
            return Err(Error::InvalidMonthCode);
        }
        Ok(code.number + u8::from(self == Self::Hebrew && hebrew_leap(year) && code.number >= 6))
    }
    // Proposal comparison §12.3.12 steps 2–3: convert fields and check the ordinary date range.
    pub fn to_epoch_day(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        check_day(self.to_epoch_day_raw(year, month, day, overflow)?)
    }
    // Proposal comparison §12.3.31 step 2.a: resolve the month code before date conversion.
    pub fn to_epoch_day_code(
        self,
        year: i32,
        code: MonthCode,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        self.to_epoch_day(
            year,
            i32::from(self.month_from_code(year, code, overflow)?),
            day,
            overflow,
        )
    }
    // Proposal comparison §12.3.22 steps 1.b, 2: regulate fields and accumulate the epoch day.
    pub(crate) fn to_epoch_day_raw(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        let month = regulate(month, 1, i32::from(self.months_in_year(year)?), overflow)? as u8;
        let day = regulate(
            day,
            1,
            i32::from(self.days_in_month(year, month)?),
            overflow,
        )?;
        let mut epoch = self.start_of_year(year)? + i64::from(day) - 1;
        for m in 1..month {
            epoch += i64::from(self.days_in_month(year, m)?);
        }
        Ok(epoch)
    }
    // Proposal comparison §12.3.26 steps 1.b, 2: project a checked epoch day.
    pub fn from_epoch_day(self, epoch: i64) -> Result<Date, Error> {
        self.from_epoch_day_raw(check_day(epoch)?)
    }
    // Proposal comparison §12.3.26 steps 1.b, 2: extract civil or arithmetic calendar fields.
    pub(crate) fn from_epoch_day_raw(self, epoch: i64) -> Result<Date, Error> {
        if !(-110_000_000..=110_000_000).contains(&epoch) {
            return Err(Error::OutOfRange);
        }
        let (iso_year, iso_month, iso_day) = iso_fields(epoch);
        if matches!(
            self,
            Self::Iso8601 | Self::Gregory | Self::Japanese | Self::Buddhist | Self::Roc
        ) {
            let year = iso_year
                + if self == Self::Buddhist {
                    543
                } else if self == Self::Roc {
                    -1911
                } else {
                    0
                };
            return Ok(Date {
                year,
                month: iso_month,
                day: iso_day,
                month_code: MonthCode {
                    number: iso_month,
                    leap: false,
                },
            });
        }
        let jd = epoch + 2_440_588;
        let estimate = match self {
            Self::Coptic => (4 * (jd - 1_824_665) + 3).div_euclid(1461),
            Self::Ethiopic | Self::Ethioaa => {
                (4 * (jd - 1_723_856) + 3).div_euclid(1461)
                    + if self == Self::Ethioaa { 5500 } else { 0 }
            }
            Self::IslamicCivil | Self::IslamicTabular => {
                (30 * (jd - 1_948_440 + i64::from(self == Self::IslamicTabular)) + 10646)
                    .div_euclid(10631)
            }
            Self::Persian => 1 + (33 * (jd - 1_948_320) + 3).div_euclid(12053),
            Self::Hebrew => ((epoch + 2092590) * 492480).div_euclid(179876755) + 1,
            Self::Indian => i64::from(iso_year) - 78,
            _ => unreachable!(),
        };
        let mut year = i32::try_from(check_year(estimate)?).map_err(|_| Error::OutOfRange)?;
        while self.start_of_year(year)? > epoch {
            year -= 1;
        }
        while self.start_of_year(year + 1)? <= epoch {
            year += 1;
        }
        let mut remaining = epoch - self.start_of_year(year)?;
        let mut month = 1;
        while remaining >= i64::from(self.days_in_month(year, month)?) {
            remaining -= i64::from(self.days_in_month(year, month)?);
            month += 1;
        }
        Ok(Date {
            year,
            month,
            day: (remaining + 1) as u8,
            month_code: self.month_code(year, month)?,
        })
    }
    // Proposal comparison §12.3.7 step 2.a: get the serial month prefix for calendar arithmetic.
    pub fn months_before_year(self, year: i32) -> Result<i64, Error> {
        let y = check_year(i64::from(year))?;
        Ok(if self == Self::Hebrew {
            (235 * y - 234).div_euclid(19)
        } else {
            y * i64::from(self.months_in_year(year)?)
        })
    }
    // Proposal comparison §12.3.7 step 2.a: recover calendar year and month from a serial.
    pub(crate) fn year_month(self, serial: i64) -> Result<(i32, u8), Error> {
        if serial.unsigned_abs() > 6_000_000 {
            return Err(Error::OutOfRange);
        }
        let mut year = if self == Self::Hebrew {
            (19 * serial + 234).div_euclid(235)
        } else {
            serial.div_euclid(i64::from(self.months_in_year(1)?))
        };
        check_year(year)?;
        while self.months_before_year(year as i32)? > serial {
            year -= 1;
        }
        while self.months_before_year((year + 1) as i32)? <= serial {
            year += 1;
        }
        Ok((
            year as i32,
            (serial - self.months_before_year(year as i32)? + 1) as u8,
        ))
    }

    // Proposal comparison §12.3.7 steps 1, 2.a: delegate calendar addition on raw days.
    fn add_raw(self, epoch: i64, duration: DateDuration, overflow: Overflow) -> Result<i64, Error> {
        NumericCalendar::add_raw(self, epoch, duration, overflow)
    }
    // Proposal comparison §12.3.7 steps 2.a, 3: add calendar fields and check the result day.
    pub fn add(self, epoch: i64, duration: DateDuration, overflow: Overflow) -> Result<i64, Error> {
        check_day(epoch)?;
        check_day(self.add_raw(epoch, duration, overflow)?)
    }
    /// Internal reference dates and rounding coordinates within ±110000000 epoch days.
    // Proposal comparison §12.3.26 steps 1.b, 2: project a private extended reference day.
    pub fn from_epoch_day_extended(self, epoch: i64) -> Result<Date, Error> {
        self.from_epoch_day_raw(epoch)
    }
    // Proposal comparison §12.3.13 step 3: convert fields in the wider reference-day range.
    pub fn to_epoch_day_extended(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        check_extended_day(self.to_epoch_day_raw(year, month, day, overflow)?)
    }
    // Proposal comparison §9.5.8 step 12: add a duration to an extended reference date.
    pub fn add_extended(
        self,
        epoch: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        check_extended_day(NumericCalendar::add_raw(self, epoch, duration, overflow)?)
    }
    // Proposal comparison §12.3.9 steps 3–4: check input days and route date difference.
    pub fn until(self, one: i64, two: i64, largest: DateUnit) -> Result<DateDuration, Error> {
        check_day(one)?;
        check_day(two)?;
        self.until_raw(one, two, largest)
    }
    /// Difference for internal rounding coordinates within ±110000000 epoch days.
    // Proposal comparison §12.3.9 steps 3–4: delegate date difference on typed endpoints.
    pub fn until_raw(self, one: i64, two: i64, largest: DateUnit) -> Result<DateDuration, Error> {
        NumericCalendar::until_raw(self, one, two, largest)
    }
    // Proposal comparison §3.3.4 and §3.3.5 step 3: check the day before projecting era fields.
    pub fn era(self, epoch: i64) -> Result<Option<Era>, Error> {
        check_day(epoch)?;
        self.era_extended(epoch)
    }
    // Proposal comparison §9.3.4 and §9.3.5 step 3: project era fields on an extended day.
    pub fn era_extended(self, epoch: i64) -> Result<Option<Era>, Error> {
        Ok(self.era_of(self.from_epoch_day_extended(epoch)?, epoch))
    }
    // Proposal comparison §12.3.26 steps 1.b, 2: supply era name and year for the projected date.
    pub(crate) fn era_of(self, date: Date, epoch: i64) -> Option<Era> {
        let y = date.year;
        let (name, year) = match self {
            Self::Iso8601 => return None,
            Self::Gregory => (
                if y > 0 { "ce" } else { "bce" },
                if y > 0 { y } else { 1 - y },
            ),
            Self::Japanese => {
                if let Some((_, name, offset)) =
                    JAPANESE_ERAS.iter().find(|(start, _, _)| epoch >= *start)
                {
                    (*name, y - *offset)
                } else {
                    (
                        if y > 0 { "ce" } else { "bce" },
                        if y > 0 { y } else { 1 - y },
                    )
                }
            }
            Self::Buddhist => ("be", y),
            Self::Coptic | Self::Hebrew => ("am", y),
            Self::Ethioaa => ("aa", y),
            Self::Ethiopic => {
                if y > 0 {
                    ("am", y)
                } else {
                    ("aa", y + 5500)
                }
            }
            Self::Indian => ("shaka", y),
            Self::Persian => ("ap", y),
            Self::Roc => (
                if y > 0 { "roc" } else { "broc" },
                if y > 0 { y } else { 1 - y },
            ),
            Self::IslamicCivil | Self::IslamicTabular => (
                if y > 0 { "ah" } else { "bh" },
                if y > 0 { y } else { 1 - y },
            ),
        };
        Some(Era { name, year })
    }
    // Proposal comparison §12.3.31 step 2.a: resolve an era year to the calendar year.
    pub fn year_from_era(self, era: &str, year: i32) -> Result<i32, Error> {
        let value = i64::from(year);
        let result = match (self, era) {
            (Self::Gregory | Self::Japanese, "ce" | "ad")
            | (Self::Buddhist, "be")
            | (Self::Coptic | Self::Hebrew | Self::Ethiopic, "am")
            | (Self::Ethioaa, "aa")
            | (Self::Indian, "shaka")
            | (Self::Persian, "ap")
            | (Self::Roc, "roc")
            | (Self::IslamicCivil | Self::IslamicTabular, "ah") => value,
            (Self::Gregory | Self::Japanese, "bce" | "bc")
            | (Self::Roc, "broc")
            | (Self::IslamicCivil | Self::IslamicTabular, "bh") => 1 - value,
            (Self::Ethiopic, "aa") => value - 5500,
            (Self::Japanese, _) => {
                value
                    + i64::from(
                        JAPANESE_ERAS
                            .iter()
                            .find(|(_, name, _)| *name == era)
                            .ok_or(Error::InvalidEra)?
                            .2,
                    )
            }
            _ => return Err(Error::InvalidEra),
        };
        Ok(check_year(result)? as i32)
    }
}
// Proposal comparison §3.5.7 steps 1.a, 1.c, 2.b: clamp or reject a bounded field.
pub(crate) fn regulate(value: i32, min: i32, max: i32, overflow: Overflow) -> Result<i32, Error> {
    if overflow == Overflow::Reject && (value < min || value > max) {
        Err(Error::InvalidDate)
    } else {
        Ok(value.clamp(min, max))
    }
}
pub(crate) fn check_year(year: i64) -> Result<i64, Error> {
    if (-400_000..=400_000).contains(&year) {
        Ok(year)
    } else {
        Err(Error::OutOfRange)
    }
}
// Proposal comparison §3.5.12 step 2: check the inclusive ordinary epoch-day range.
pub(crate) fn check_day(day: i64) -> Result<i64, Error> {
    if (MIN_DAY..=MAX_DAY).contains(&day) {
        Ok(day)
    } else {
        Err(Error::OutOfRange)
    }
}
// Proposal comparison §9.5.8 step 12: guard private reference-day arithmetic.
pub(crate) fn check_extended_day(day: i64) -> Result<i64, Error> {
    if (-110_000_000..=110_000_000).contains(&day) {
        Ok(day)
    } else {
        Err(Error::OutOfRange)
    }
}
// Proposal comparison §12.3.17 step 4: detect a Gregorian leap year.
fn leap(year: i32) -> bool {
    year.rem_euclid(4) == 0 && (year.rem_euclid(100) != 0 || year.rem_euclid(400) == 0)
}
// Proposal comparison §12.3.26 step 2: determine whether a Hebrew year adds a month.
fn hebrew_leap(year: i32) -> bool {
    (7 * i64::from(year) + 1).rem_euclid(19) < 7
}
// Proposal comparison §12.3.26 step 2: compute the Hebrew year-start postponement input.
fn hebrew_delay(year: i64) -> i64 {
    let months = (235 * year - 234).div_euclid(19);
    let day = 29 * months + (12084 + 13753 * months).div_euclid(25920);
    day + i64::from((3 * (day + 1)).rem_euclid(7) < 3)
}
// Proposal comparison §12.3.26 step 2: compute the Hebrew year boundary.
fn hebrew_start(year: i64) -> i64 {
    let present = hebrew_delay(year);
    -2092590
        + present
        + if hebrew_delay(year + 1) - present == 356 {
            2
        } else if present - hebrew_delay(year - 1) == 382 {
            1
        } else {
            0
        }
}
/// Unchecked ISO fields to Unix epoch day; callers validate date fields.
// Proposal comparison §13.1 steps 3–4: convert prepared civil fields to a Unix epoch day.
pub fn iso_day(year: i32, month: u8, day: u8) -> i64 {
    let y = i64::from(year) - i64::from(month <= 2);
    let era = y.div_euclid(400);
    let m = i64::from(month) + if month > 2 { -3 } else { 9 };
    era * 146097
        + (y.rem_euclid(400) * 365 + y.rem_euclid(400) / 4 - y.rem_euclid(400) / 100)
        + (153 * m + 2) / 5
        + i64::from(day)
        - 1
        - 719468
}
const ISO_YEAR_BLOCK_COUNT: usize = (146097 + 127) / 128;
static ISO_YEAR_BLOCKS: [u32; ISO_YEAR_BLOCK_COUNT] = iso_year_blocks();

// Proposal comparison §11.1.10 step 2: precompute year blocks for inverse ISO projection.
const fn iso_year_blocks() -> [u32; ISO_YEAR_BLOCK_COUNT] {
    let mut blocks = [0; ISO_YEAR_BLOCK_COUNT];
    let mut index = 0;
    while index < ISO_YEAR_BLOCK_COUNT {
        let doe = index as u32 * 128;
        let year = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
        let ordinal = doe - (365 * year + year / 4 - year / 100);
        let leap = if year % 4 == 3 && (year % 100 != 99 || year == 399) {
            1
        } else {
            0
        };
        // March-based year, ordinal and year length at each 128-day block.
        blocks[index] = year | (ordinal << 9) | (leap << 18);
        index += 1;
    }
    blocks
}

/// Raw inverse ISO conversion for validated epoch days within ±110000000.
#[inline]
// Proposal comparison §11.1.10 step 2: recover ISO date fields from an exact epoch day.
pub fn iso_fields(day: i64) -> (i32, u8, u8) {
    let d = day + 719468;
    let era = d.div_euclid(146097);
    // Day within the era is in 0..146097.
    let doe = d.rem_euclid(146097) as u32;
    let block = ISO_YEAR_BLOCKS[(doe >> 7) as usize];
    let ordinal = ((block >> 9) & 511) + (doe & 127);
    let length = 365 + (block >> 18);
    let next_year = u32::from(ordinal >= length);
    let y = (block & 511) + next_year;
    let doy = ordinal - length * next_year;
    let m = (5 * doy + 2) / 153;
    let month = if m < 10 { m + 3 } else { m - 9 };
    (
        (i64::from(y) + era * 400 + i64::from(month <= 2)) as i32,
        month as u8,
        (doy - (153 * m + 2) / 5 + 1) as u8,
    )
}
