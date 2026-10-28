use formatjs_intl_datetimeformat::{Error, calendar::CalendarFields, civil::CivilDateTime};

#[derive(Debug, Clone, Copy)]
pub enum Calendar {
    Buddhist,
    Coptic,
    Ethiopic,
    Ethioaa,
    Roc,
    Japanese,
    Indian,
    IslamicCivil,
    IslamicTabular,
    Persian,
    Hebrew,
}
impl Calendar {
    pub fn name(self) -> &'static str {
        match self {
            Self::Buddhist => "buddhist",
            Self::Coptic => "coptic",
            Self::Ethiopic => "ethiopic",
            Self::Ethioaa => "ethioaa",
            Self::Roc => "roc",
            Self::Japanese => "japanese",
            Self::Indian => "indian",
            Self::IslamicCivil => "islamic-civil",
            Self::IslamicTabular => "islamic-tbla",
            Self::Persian => "persian",
            Self::Hebrew => "hebrew",
        }
    }
    pub fn from_name(name: &str) -> Option<Self> {
        Some(match name {
            "buddhist" => Self::Buddhist,
            "coptic" => Self::Coptic,
            "ethiopic" => Self::Ethiopic,
            "ethioaa" => Self::Ethioaa,
            "roc" => Self::Roc,
            "japanese" => Self::Japanese,
            "indian" => Self::Indian,
            "islamic-civil" => Self::IslamicCivil,
            "islamic-tbla" => Self::IslamicTabular,
            "persian" => Self::Persian,
            "hebrew" => Self::Hebrew,
            _ => return None,
        })
    }
    pub fn date_from_time(self, milliseconds: i64) -> Result<CalendarFields, Error> {
        let epoch_day = milliseconds.div_euclid(86_400_000);
        // Temporal PlainDate permits one lower-edge day and the complete final day.
        if !(-100_000_001..=100_000_000).contains(&epoch_day) {
            return Err(Error::InvalidDate);
        }
        let civil = CivilDateTime::from_epoch_nanoseconds(i128::from(milliseconds) * 1_000_000)?;
        let year = i64::from(civil.year);
        let jd = epoch_day + 2_440_588;
        let (era, year, month, day) = match self {
            Self::Buddhist => (
                "0",
                year + 543,
                i64::from(civil.month),
                i64::from(civil.day),
            ),
            Self::Roc => {
                let year = year - 1911;
                (
                    if year < 1 { "0" } else { "1" },
                    if year < 1 { 1 - year } else { year },
                    i64::from(civil.month),
                    i64::from(civil.day),
                )
            }
            Self::Japanese => {
                let era = [
                    (18_017, "236", 2018),
                    (6947, "235", 1988),
                    (-15_713, "234", 1925),
                    (-20_974, "233", 1911),
                    (-35_428, "232", 1867),
                ]
                .into_iter()
                .find(|(start, _, _)| epoch_day >= *start);
                let (era, year) = era
                    .map(|(_, era, origin)| (era, year - origin))
                    .unwrap_or_else(|| {
                        if year > 0 {
                            ("AD", year)
                        } else {
                            ("BC", 1 - year)
                        }
                    });
                (era, year, i64::from(civil.month), i64::from(civil.day))
            }
            Self::Coptic | Self::Ethiopic | Self::Ethioaa => {
                let epoch = if matches!(self, Self::Coptic) {
                    1_824_665
                } else {
                    1_723_856
                };
                let year = (4 * (jd - epoch) + 3).div_euclid(1461);
                let start = epoch + 365 * year + year.div_euclid(4);
                let month = 1 + (jd - start).div_euclid(30);
                let day = jd + 1 - (start + 30 * (month - 1));
                if matches!(self, Self::Ethioaa) || (matches!(self, Self::Ethiopic) && year <= 0) {
                    ("0", year + 5500, month, day)
                } else {
                    ("1", year, month, day)
                }
            }
            Self::IslamicCivil | Self::IslamicTabular => {
                let epoch = if matches!(self, Self::IslamicCivil) {
                    1_948_440
                } else {
                    1_948_439
                };
                let year = (30 * (jd - epoch) + 10_646).div_euclid(10_631);
                let first = epoch + 354 * (year - 1) + (3 + 11 * year).div_euclid(30);
                let month = 12.min(ceil(2 * (jd - 29 - first), 59) + 1);
                let start = first + ceil(59 * (month - 1), 2);
                (
                    if year < 1 { "1" } else { "0" },
                    if year < 1 { 1 - year } else { year },
                    month,
                    jd - start + 1,
                )
            }
            Self::Persian => {
                let days = jd - 1_948_320;
                let year = 1 + (33 * days + 3).div_euclid(12_053);
                let day_of_year = days - (365 * (year - 1) + (8 * year + 21).div_euclid(33));
                let month = if day_of_year < 216 {
                    day_of_year.div_euclid(31)
                } else {
                    (day_of_year - 6).div_euclid(30)
                };
                let starts = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
                let start = *starts
                    .get(usize::try_from(month).map_err(|_| Error::InvalidDate)?)
                    .ok_or(Error::InvalidDate)?;
                ("0", year, month + 1, day_of_year - start + 1)
            }
            Self::Indian => {
                let mut year = year - 78;
                let offsets = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                let mut day_of_year = offsets[usize::from(civil.month - 1)] + i64::from(civil.day)
                    - 1
                    + i64::from(civil.month > 2 && leap(i64::from(civil.year)));
                let first_month = if day_of_year < 80 {
                    year -= 1;
                    let length = if leap(i64::from(civil.year) - 1) {
                        31
                    } else {
                        30
                    };
                    day_of_year += length + 255;
                    length
                } else {
                    day_of_year -= 80;
                    if leap(i64::from(civil.year)) { 31 } else { 30 }
                };
                let (month, day) = if day_of_year < first_month {
                    (1, day_of_year + 1)
                } else {
                    let remaining = day_of_year - first_month;
                    if remaining < 155 {
                        (remaining.div_euclid(31) + 2, remaining.rem_euclid(31) + 1)
                    } else {
                        let remaining = remaining - 155;
                        (remaining.div_euclid(30) + 7, remaining.rem_euclid(30) + 1)
                    }
                };
                ("0", year, month, day)
            }
            Self::Hebrew => {
                let day = jd - 347_997;
                let mut year =
                    ((25920.0 * day as f64 / 765433.0 * 19.0 + 234.0) / 235.0).floor() as i64 + 1;
                let mut day_of_year = day - hebrew_start(year);
                while day_of_year < 1 {
                    year -= 1;
                    day_of_year = day - hebrew_start(year);
                }
                let mut month = 1;
                while day_of_year > hebrew_month_days(year, month) {
                    day_of_year -= hebrew_month_days(year, month);
                    month += 1;
                }
                ("0", year, month, day_of_year)
            }
        };
        let mut fields = fields(era, year, month, day)?;
        if matches!(self, Self::Hebrew) {
            let leap = hebrew_leap(year);
            let code = month - i64::from(leap && month > 6);
            fields.month_name_index = Some(if leap && month == 6 {
                5
            } else if leap && code == 6 {
                13
            } else if code >= 6 {
                code as u8
            } else {
                (code - 1) as u8
            });
        }
        Ok(fields)
    }
}
fn ceil(value: i64, divisor: i64) -> i64 {
    -(-value).div_euclid(divisor)
}
fn leap(year: i64) -> bool {
    year.rem_euclid(4) == 0 && (year.rem_euclid(100) != 0 || year.rem_euclid(400) == 0)
}
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
fn hebrew_leap(year: i64) -> bool {
    (7 * year + 1).rem_euclid(19) < 7
}
fn hebrew_delay(year: i64) -> i64 {
    let months = (235 * year - 234).div_euclid(19);
    let day = 29 * months + (12084 + 13753 * months).div_euclid(25920);
    day + i64::from((3 * (day + 1)).rem_euclid(7) < 3)
}
fn hebrew_start(year: i64) -> i64 {
    let present = hebrew_delay(year);
    present
        + if hebrew_delay(year + 1) - present == 356 {
            2
        } else if present - hebrew_delay(year - 1) == 382 {
            1
        } else {
            0
        }
}
fn hebrew_month_days(year: i64, month: i64) -> i64 {
    let month = month + i64::from(month >= 6 && !hebrew_leap(year));
    if matches!(month, 4 | 7 | 9 | 11 | 13) {
        return 29;
    }
    let length = hebrew_start(year + 1) - hebrew_start(year);
    let length = if length > 380 { length - 30 } else { length };
    match month {
        2 => {
            if length == 355 {
                30
            } else {
                29
            }
        }
        3 => {
            if length == 353 {
                29
            } else {
                30
            }
        }
        6 => {
            if hebrew_leap(year) {
                30
            } else {
                0
            }
        }
        _ => 30,
    }
}
