//! Borrowed ICU calendar tables. Loading and storage belong to the embedder.
use crate::calendar::{
    Calendar, Date, DateDuration, DateUnit, Era, Error, MonthCode, Overflow, check_day, check_year,
    regulate,
};
use crate::date_math::NumericCalendar;

#[derive(Clone, Copy, Debug)]
pub struct LunisolarData<'a> {
    pub first_year: i32,
    pub end_day: i64,
    pub checkpoints: &'a [i64],
    pub month_checkpoints: &'a [i64],
    pub dictionary: &'a [u32],
    pub years: &'a str,
}
#[derive(Clone, Copy, Debug)]
pub struct UmmAlQuraData<'a> {
    pub first_year: i32,
    pub start_days: &'a [i64],
    pub month_lengths: &'a [u16],
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TableCalendarId {
    Chinese,
    Dangi,
    IslamicUmmAlQura,
}
#[derive(Clone, Copy, Debug)]
enum Data<'a> {
    Lunisolar(LunisolarData<'a>),
    UmmAlQura(UmmAlQuraData<'a>),
}
#[derive(Clone, Copy, Debug)]
pub struct TableCalendar<'a> {
    id: TableCalendarId,
    data: Data<'a>,
}
fn digit(value: u8) -> Result<usize, Error> {
    Ok(match value {
        b'A'..=b'Z' => usize::from(value - b'A'),
        b'a'..=b'z' => usize::from(value - b'a') + 26,
        b'0'..=b'9' => usize::from(value - b'0') + 52,
        b'-' => 62,
        b'_' => 63,
        _ => return Err(Error::InvalidDate),
    })
}
fn pattern(data: LunisolarData<'_>, index: usize) -> Result<u32, Error> {
    let bytes = data
        .years
        .as_bytes()
        .get(index.checked_mul(2).ok_or(Error::OutOfRange)?..)
        .ok_or(Error::OutOfRange)?;
    if bytes.len() < 2 {
        return Err(Error::OutOfRange);
    }
    data.dictionary
        .get(digit(bytes[0])? * 64 + digit(bytes[1])?)
        .copied()
        .ok_or(Error::InvalidDate)
}
fn year_length(packed: u32) -> i64 {
    (if packed >> 13 == 0 { 12 } else { 13 }) * 29 + i64::from((packed & 8191).count_ones())
}
impl<'a> TableCalendar<'a> {
    pub fn lunisolar(id: TableCalendarId, data: LunisolarData<'a>) -> Result<Self, Error> {
        if !matches!(id, TableCalendarId::Chinese | TableCalendarId::Dangi)
            || data.years.is_empty()
            || data.years.len() % 2 != 0
            || data.dictionary.is_empty()
            || data.dictionary.len() > 4096
            || data.checkpoints.len() != (data.years.len() / 2).div_ceil(64)
            || data.month_checkpoints.len() != data.checkpoints.len()
        {
            return Err(Error::InvalidDate);
        }
        if data
            .dictionary
            .iter()
            .any(|packed| packed >> 13 > 12 || (packed >> 13 == 0 && packed & 4096 != 0))
        {
            return Err(Error::InvalidDate);
        }
        check_year(i64::from(data.first_year))?;
        check_year(
            i64::from(data.first_year)
                + i64::try_from(data.years.len() / 2).map_err(|_| Error::OutOfRange)?,
        )?;
        let mut day = data.checkpoints[0];
        let mut months = 0;
        for index in 0..data.years.len() / 2 {
            let packed = pattern(data, index)?;
            let leap = packed >> 13;
            if leap > 12 || (leap == 0 && packed & 4096 != 0) {
                return Err(Error::InvalidDate);
            }
            if index % 64 == 0
                && (data.checkpoints[index / 64] != day
                    || data.month_checkpoints[index / 64] != months)
            {
                return Err(Error::InvalidDate);
            }
            day = day
                .checked_add(year_length(packed))
                .ok_or(Error::OutOfRange)?;
            months += if leap == 0 { 12 } else { 13 };
        }
        if day != data.end_day {
            return Err(Error::InvalidDate);
        }
        Ok(Self {
            id,
            data: Data::Lunisolar(data),
        })
    }
    pub fn umm_al_qura(data: UmmAlQuraData<'a>) -> Result<Self, Error> {
        if data.month_lengths.is_empty() || data.start_days.len() != data.month_lengths.len() + 1 {
            return Err(Error::InvalidDate);
        }
        check_year(i64::from(data.first_year))?;
        check_year(
            i64::from(data.first_year)
                + i64::try_from(data.month_lengths.len()).map_err(|_| Error::OutOfRange)?,
        )?;
        for (index, packed) in data.month_lengths.iter().copied().enumerate() {
            if packed > 4095
                || data.start_days[index].checked_add(348 + i64::from(packed.count_ones()))
                    != Some(data.start_days[index + 1])
            {
                return Err(Error::InvalidDate);
            }
        }
        Ok(Self {
            id: TableCalendarId::IslamicUmmAlQura,
            data: Data::UmmAlQura(data),
        })
    }
    pub fn era(self, epoch: i64) -> Result<Option<Era>, Error> {
        let date = self.from_epoch_day(epoch)?;
        if self.id != TableCalendarId::IslamicUmmAlQura {
            return Ok(None);
        }
        Ok(Some(Era {
            name: if date.year > 0 { "ah" } else { "bh" },
            year: if date.year > 0 {
                date.year
            } else {
                1 - date.year
            },
        }))
    }
    pub fn year_from_era(self, era: &str, year: i32) -> Result<i32, Error> {
        if self.id != TableCalendarId::IslamicUmmAlQura {
            return Err(Error::InvalidEra);
        }
        Calendar::IslamicCivil.year_from_era(era, year)
    }
    pub fn id(self) -> TableCalendarId {
        self.id
    }
    fn index(self, year: i32) -> Result<usize, Error> {
        let Data::Lunisolar(data) = self.data else {
            return Err(Error::InvalidDate);
        };
        let index = usize::try_from(i64::from(year) - i64::from(data.first_year))
            .map_err(|_| Error::OutOfRange)?;
        if index >= data.years.len() / 2 {
            return Err(Error::OutOfRange);
        }
        Ok(index)
    }
    fn packed(self, year: i32) -> Result<u32, Error> {
        let Data::Lunisolar(data) = self.data else {
            return Err(Error::InvalidDate);
        };
        pattern(data, self.index(year)?)
    }
    pub fn start_of_year(self, year: i32) -> Result<i64, Error> {
        check_year(i64::from(year))?;
        match self.data {
            Data::Lunisolar(data) => {
                let offset = i64::from(year) - i64::from(data.first_year);
                if offset == data.years.len() as i64 / 2 {
                    return Ok(data.end_day);
                }
                let index = self.index(year)?;
                let block = index / 64;
                let mut day = data.checkpoints[block];
                for i in block * 64..index {
                    day += year_length(pattern(data, i)?)
                }
                Ok(day)
            }
            Data::UmmAlQura(data) => {
                let index = i64::from(year) - i64::from(data.first_year);
                if index >= 0 && index < data.start_days.len() as i64 {
                    Ok(data.start_days[index as usize])
                } else {
                    Calendar::IslamicCivil.start_of_year(year)
                }
            }
        }
    }
    pub fn months_in_year(self, year: i32) -> Result<u8, Error> {
        check_year(i64::from(year))?;
        Ok(match self.data {
            Data::Lunisolar(_) => {
                if self.packed(year)? >> 13 == 0 {
                    12
                } else {
                    13
                }
            }
            Data::UmmAlQura(_) => 12,
        })
    }
    pub fn days_in_month(self, year: i32, month: u8) -> Result<u8, Error> {
        if month == 0 || month > self.months_in_year(year)? {
            return Err(Error::InvalidDate);
        }
        let packed = match self.data {
            Data::Lunisolar(_) => self.packed(year)?,
            Data::UmmAlQura(data) => {
                let index = i64::from(year) - i64::from(data.first_year);
                if index < 0 || index >= data.month_lengths.len() as i64 {
                    return Calendar::IslamicCivil.days_in_month(year, month);
                }
                u32::from(data.month_lengths[index as usize])
            }
        };
        Ok(29 + ((packed >> (month - 1)) & 1) as u8)
    }
    pub fn month_code(self, year: i32, month: u8) -> Result<MonthCode, Error> {
        if month == 0 || month > self.months_in_year(year)? {
            return Err(Error::InvalidDate);
        }
        let leap = match self.data {
            Data::Lunisolar(_) => (self.packed(year)? >> 13) as u8,
            Data::UmmAlQura(_) => 0,
        };
        Ok(MonthCode {
            number: month - u8::from(leap > 0 && month > leap),
            leap: leap > 0 && month == leap + 1,
        })
    }
    pub fn month_from_code(
        self,
        year: i32,
        code: MonthCode,
        overflow: Overflow,
    ) -> Result<u8, Error> {
        if code.number == 0 || code.number > 12 {
            return Err(Error::InvalidMonthCode);
        }
        match self.data {
            Data::UmmAlQura(_) => {
                check_year(i64::from(year))?;
                if code.leap {
                    Err(Error::InvalidMonthCode)
                } else {
                    Ok(code.number)
                }
            }
            Data::Lunisolar(_) => {
                let leap = (self.packed(year)? >> 13) as u8;
                if code.leap && leap != code.number && overflow == Overflow::Reject {
                    return Err(Error::InvalidMonthCode);
                }
                Ok(code.number
                    + u8::from(
                        leap > 0 && (code.number > leap || (code.number == leap && code.leap)),
                    ))
            }
        }
    }
    pub fn to_epoch_day(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, Error> {
        check_day(self.to_epoch_day_raw(year, month, day, overflow)?)
    }
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
    pub fn from_epoch_day(self, epoch: i64) -> Result<Date, Error> {
        self.from_epoch_day_raw(check_day(epoch)?)
    }
    pub fn months_before_year(self, year: i32) -> Result<i64, Error> {
        match self.data {
            Data::UmmAlQura(_) => {
                check_year(i64::from(year))?;
                Ok(i64::from(year) * 12)
            }
            Data::Lunisolar(data) => {
                let index = self.index(year)?;
                let block = index / 64;
                let mut months = data.month_checkpoints[block];
                for i in block * 64..index {
                    months += if pattern(data, i)? >> 13 == 0 { 12 } else { 13 }
                }
                Ok(months)
            }
        }
    }
    pub fn add(self, epoch: i64, duration: DateDuration, overflow: Overflow) -> Result<i64, Error> {
        check_day(epoch)?;
        check_day(NumericCalendar::add_raw(self, epoch, duration, overflow)?)
    }
    pub fn until(self, one: i64, two: i64, largest: DateUnit) -> Result<DateDuration, Error> {
        check_day(one)?;
        check_day(two)?;
        self.until_raw(one, two, largest)
    }
    pub fn until_raw(self, one: i64, two: i64, largest: DateUnit) -> Result<DateDuration, Error> {
        NumericCalendar::until_raw(self, one, two, largest)
    }
}
impl NumericCalendar for TableCalendar<'_> {
    fn from_epoch_day_raw(self, epoch: i64) -> Result<Date, Error> {
        if !(-110_000_000..=110_000_000).contains(&epoch) {
            return Err(Error::OutOfRange);
        }
        let mut year = match self.data {
            Data::Lunisolar(data) => {
                if epoch < data.checkpoints[0] || epoch >= data.end_day {
                    return Err(Error::OutOfRange);
                }
                data.first_year
                    + ((data.checkpoints.partition_point(|v| *v <= epoch) - 1) * 64) as i32
            }
            Data::UmmAlQura(_) => Calendar::IslamicCivil.from_epoch_day_raw(epoch)?.year,
        };
        while self.start_of_year(year)? > epoch {
            year -= 1
        }
        while self.start_of_year(year + 1)? <= epoch {
            year += 1
        }
        let mut remaining = epoch - self.start_of_year(year)?;
        let mut month = 1;
        while remaining >= i64::from(self.days_in_month(year, month)?) {
            remaining -= i64::from(self.days_in_month(year, month)?);
            month += 1
        }
        Ok(Date {
            year,
            month,
            day: (remaining + 1) as u8,
            month_code: self.month_code(year, month)?,
        })
    }
    fn to_epoch_day_raw(
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
            epoch += i64::from(self.days_in_month(year, m)?)
        }
        Ok(epoch)
    }
    fn month_from_code(self, year: i32, code: MonthCode, overflow: Overflow) -> Result<u8, Error> {
        TableCalendar::month_from_code(self, year, code, overflow)
    }
    fn months_before_year(self, year: i32) -> Result<i64, Error> {
        TableCalendar::months_before_year(self, year)
    }
    fn year_month(self, serial: i64) -> Result<(i32, u8), Error> {
        match self.data {
            Data::UmmAlQura(_) => Ok((
                check_year(serial.div_euclid(12))? as i32,
                (serial.rem_euclid(12) + 1) as u8,
            )),
            Data::Lunisolar(data) => {
                if serial < 0 {
                    return Err(Error::OutOfRange);
                }
                let block = data.month_checkpoints.partition_point(|v| *v <= serial) - 1;
                let mut year = data.first_year + (block * 64) as i32;
                let mut remaining = serial - data.month_checkpoints[block];
                loop {
                    let count = i64::from(self.months_in_year(year)?);
                    if remaining < count {
                        return Ok((year, (remaining + 1) as u8));
                    }
                    remaining -= count;
                    year += 1
                }
            }
        }
    }
}
