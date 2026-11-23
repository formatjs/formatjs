pub use crate::calendar::Calendar;
use formatjs_intl_datetimeformat::{Error, calendar::CalendarFields, civil::CivilDateTime};

impl Calendar {
    // Proposal comparison §15.6.23 step 5.a: Project local milliseconds through an arithmetic calendar.
    pub fn date_from_time(self, milliseconds: i64) -> Result<CalendarFields, Error> {
        CivilDateTime::from_epoch_nanoseconds(i128::from(milliseconds) * 1_000_000)?;
        let epoch = milliseconds.div_euclid(86_400_000);
        let date = self.from_epoch_day(epoch).map_err(|_| Error::InvalidDate)?;
        let era = self.era_of(date, epoch).ok_or(Error::MissingCalendar)?;
        let legacy = match self {
            Self::Iso8601 | Self::Gregory => return Err(Error::MissingCalendar),
            Self::Buddhist | Self::Ethioaa | Self::Hebrew | Self::Indian | Self::Persian => "0",
            Self::Coptic => "1",
            Self::Ethiopic => {
                if era.name == "am" {
                    "1"
                } else {
                    "0"
                }
            }
            Self::Roc => {
                if era.name == "roc" {
                    "1"
                } else {
                    "0"
                }
            }
            Self::IslamicCivil | Self::IslamicTabular => {
                if era.name == "ah" {
                    "0"
                } else {
                    "1"
                }
            }
            Self::Japanese => match era.name {
                "reiwa" => "236",
                "heisei" => "235",
                "showa" => "234",
                "taisho" => "233",
                "meiji" => "232",
                "ce" => "AD",
                _ => "BC",
            },
        };
        let mut result = fields(
            legacy,
            i64::from(era.year),
            i64::from(date.month),
            i64::from(date.day),
        )?;
        if self == Self::Hebrew {
            let leap = self
                .months_in_year(date.year)
                .map_err(|_| Error::InvalidDate)?
                == 13;
            let code = date.month_code.number;
            result.month_name_index = Some(if leap && date.month == 6 {
                5
            } else if leap && code == 6 {
                13
            } else if code >= 6 {
                code
            } else {
                code - 1
            });
        }
        Ok(result)
    }
}
// Proposal comparison §15.6.23 step 5.a: Package projected calendar fields for Intl rendering.
pub(crate) fn fields(era: &str, year: i64, month: i64, day: i64) -> Result<CalendarFields, Error> {
    if !(1..=13).contains(&month) || !(1..=31).contains(&day) {
        return Err(Error::InvalidDate);
    }
    Ok(CalendarFields {
        era: era.into(),
        year: i32::try_from(year).map_err(|_| Error::InvalidDate)?,
        month: (month - 1) as u8,
        day: day as u8,
        month_name_index: None,
        month_number: None,
        leap_month: None,
        related_year: None,
        year_name: None,
    })
}
