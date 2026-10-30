use crate::arithmetic::{Calendar, fields};
use formatjs_intl_datetimeformat::{Error, calendar::CalendarFields};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct UmmRaw {
    first_year: i32,
    start_days: Vec<i64>,
    month_lengths: Vec<u16>,
}
pub(crate) struct UmmAlQura {
    data: UmmRaw,
}
impl UmmAlQura {
    pub fn new(data: UmmRaw) -> Result<Self, Error> {
        if data.month_lengths.is_empty()
            || data.start_days.len() != data.month_lengths.len() + 1
            || i64::from(data.first_year) + data.month_lengths.len() as i64 - 1
                > i64::from(i32::MAX)
        {
            return Err(Error::InvalidLocaleData);
        }
        for (index, packed) in data.month_lengths.iter().copied().enumerate() {
            if packed > 4095
                || data.start_days[index].checked_add(348 + i64::from(packed.count_ones()))
                    != Some(data.start_days[index + 1])
            {
                return Err(Error::InvalidLocaleData);
            }
        }
        Ok(Self { data })
    }
    pub fn date_from_time(&self, milliseconds: i64) -> Result<CalendarFields, Error> {
        let epoch_day = milliseconds.div_euclid(86_400_000);
        let data = &self.data;
        if epoch_day < data.start_days[0]
            || epoch_day >= *data.start_days.last().ok_or(Error::InvalidLocaleData)?
        {
            return Calendar::IslamicCivil.date_from_time(milliseconds);
        }
        let year = data.start_days.partition_point(|start| *start <= epoch_day) - 1;
        let mut day = epoch_day - data.start_days[year];
        let packed = data.month_lengths[year];
        let mut month = 0;
        while day >= 29 + i64::from((packed >> month) & 1) {
            day -= 29 + i64::from((packed >> month) & 1);
            month += 1;
        }
        fields(
            "0",
            i64::from(data.first_year) + year as i64,
            month + 1,
            day + 1,
        )
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct LunisolarRaw {
    first_year: i32,
    end_day: i64,
    checkpoints: Vec<i64>,
    dictionary: Vec<u32>,
    years: String,
}
pub(crate) struct Lunisolar {
    first_year: i32,
    end_day: i64,
    checkpoints: Vec<i64>,
    dictionary: Vec<u32>,
    years: Vec<u16>,
}
fn year_length(packed: u32) -> i64 {
    (if packed >> 13 == 0 { 12 } else { 13 }) * 29 + i64::from((packed & 8191).count_ones())
}
fn digit(byte: u8) -> Result<u16, Error> {
    Ok(match byte {
        b'A'..=b'Z' => u16::from(byte - b'A'),
        b'a'..=b'z' => u16::from(byte - b'a') + 26,
        b'0'..=b'9' => u16::from(byte - b'0') + 52,
        b'-' => 62,
        b'_' => 63,
        _ => return Err(Error::InvalidLocaleData),
    })
}
impl Lunisolar {
    pub fn new(data: LunisolarRaw) -> Result<Self, Error> {
        if data.years.is_empty()
            || data.years.len() % 2 != 0
            || data.dictionary.is_empty()
            || data.dictionary.len() > 4096
        {
            return Err(Error::InvalidLocaleData);
        }
        for packed in &data.dictionary {
            let leap = packed >> 13;
            if leap > 12 || (leap == 0 && packed & 4096 != 0) {
                return Err(Error::InvalidLocaleData);
            }
        }
        let years = data
            .years
            .as_bytes()
            .chunks_exact(2)
            .map(|pair| {
                let index = digit(pair[0])? * 64 + digit(pair[1])?;
                if usize::from(index) >= data.dictionary.len() {
                    return Err(Error::InvalidLocaleData);
                }
                Ok(index)
            })
            .collect::<Result<Vec<_>, _>>()?;
        if data.checkpoints.len() != years.len().div_ceil(64)
            || i64::from(data.first_year) + years.len() as i64 - 1 > i64::from(i32::MAX)
        {
            return Err(Error::InvalidLocaleData);
        }
        let mut cursor = *data.checkpoints.first().ok_or(Error::InvalidLocaleData)?;
        for (year, index) in years.iter().enumerate() {
            if year % 64 == 0 && data.checkpoints[year / 64] != cursor {
                return Err(Error::InvalidLocaleData);
            }
            cursor = cursor
                .checked_add(year_length(data.dictionary[usize::from(*index)]))
                .ok_or(Error::InvalidLocaleData)?;
        }
        if cursor != data.end_day {
            return Err(Error::InvalidLocaleData);
        }
        Ok(Self {
            first_year: data.first_year,
            end_day: data.end_day,
            checkpoints: data.checkpoints,
            dictionary: data.dictionary,
            years,
        })
    }
    pub fn date_from_time(&self, milliseconds: i64) -> Result<CalendarFields, Error> {
        let epoch_day = milliseconds.div_euclid(86_400_000);
        if epoch_day < self.checkpoints[0] || epoch_day >= self.end_day {
            return Err(Error::InvalidDate);
        }
        let checkpoint = self
            .checkpoints
            .partition_point(|start| *start <= epoch_day)
            - 1;
        let mut year = checkpoint * 64;
        let mut day = epoch_day - self.checkpoints[checkpoint];
        let mut packed = self.dictionary[usize::from(self.years[year])];
        while day >= year_length(packed) {
            day -= year_length(packed);
            year += 1;
            packed = self.dictionary[usize::from(self.years[year])];
        }
        let mut month = 0;
        while day >= 29 + i64::from((packed >> month) & 1) {
            day -= 29 + i64::from((packed >> month) & 1);
            month += 1;
        }
        let leap = packed >> 13;
        let number = month - i64::from(leap != 0 && month >= i64::from(leap));
        let year = i64::from(self.first_year) + year as i64;
        let mut result = fields("", year, month + 1, day + 1)?;
        result.month_number = Some(number as u8);
        result.month_name_index = Some(number as u8);
        result.leap_month = Some(leap != 0 && month == i64::from(leap));
        result.related_year = Some(result.year);
        result.year_name = Some((year - 4).rem_euclid(60) as u8);
        Ok(result)
    }
}
