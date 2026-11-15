use crate::calendar::{Calendar, Date, DateDuration, DateUnit, Era, MonthCode, Overflow};
use formatjs_intl_datetimeformat_calendars::table_calendar::{TableCalendar, TableCalendarId};

pub use formatjs_intl_datetimeformat_calendars::table_calendar;

mod sealed {
    pub trait Sealed {}
}

/// Validated arithmetic engines or immutable borrowed calendar tables.
pub trait CalendarProvider: sealed::Sealed + Copy {
    fn id(self) -> &'static str;
    fn date(self, epoch_day: i64) -> Result<Date, crate::calendar::Error>;
    fn epoch_day(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error>;
    fn month_from_code(
        self,
        year: i32,
        code: MonthCode,
        overflow: Overflow,
    ) -> Result<u8, crate::calendar::Error>;
    fn months_in_year(self, year: i32) -> Result<u8, crate::calendar::Error>;
    fn days_in_month(self, year: i32, month: u8) -> Result<u8, crate::calendar::Error>;
    fn start_of_year(self, year: i32) -> Result<i64, crate::calendar::Error>;
    fn era(self, epoch_day: i64) -> Result<Option<Era>, crate::calendar::Error>;
    fn year_from_era(self, era: &str, year: i32) -> Result<i32, crate::calendar::Error>;
    fn add(
        self,
        epoch_day: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error>;
    fn until_raw(
        self,
        one: i64,
        two: i64,
        largest: DateUnit,
    ) -> Result<DateDuration, crate::calendar::Error>;
}

macro_rules! provider {
    ($type:ty, $id:expr) => {
        impl sealed::Sealed for $type {}
        impl CalendarProvider for $type {
            fn id(self) -> &'static str {
                ($id)(self)
            }
            fn date(self, epoch: i64) -> Result<Date, crate::calendar::Error> {
                self.from_epoch_day(epoch)
            }
            fn epoch_day(
                self,
                year: i32,
                month: i32,
                day: i32,
                overflow: Overflow,
            ) -> Result<i64, crate::calendar::Error> {
                self.to_epoch_day(year, month, day, overflow)
            }
            fn month_from_code(
                self,
                year: i32,
                code: MonthCode,
                overflow: Overflow,
            ) -> Result<u8, crate::calendar::Error> {
                self.month_from_code(year, code, overflow)
            }
            fn months_in_year(self, year: i32) -> Result<u8, crate::calendar::Error> {
                self.months_in_year(year)
            }
            fn days_in_month(self, year: i32, month: u8) -> Result<u8, crate::calendar::Error> {
                self.days_in_month(year, month)
            }
            fn start_of_year(self, year: i32) -> Result<i64, crate::calendar::Error> {
                self.start_of_year(year)
            }
            fn era(self, epoch: i64) -> Result<Option<Era>, crate::calendar::Error> {
                self.era(epoch)
            }
            fn year_from_era(self, era: &str, year: i32) -> Result<i32, crate::calendar::Error> {
                self.year_from_era(era, year)
            }
            fn add(
                self,
                epoch: i64,
                duration: DateDuration,
                overflow: Overflow,
            ) -> Result<i64, crate::calendar::Error> {
                self.add(epoch, duration, overflow)
            }
            fn until_raw(
                self,
                one: i64,
                two: i64,
                largest: DateUnit,
            ) -> Result<DateDuration, crate::calendar::Error> {
                self.until_raw(one, two, largest)
            }
        }
    };
}
provider!(Calendar, Calendar::name);
provider!(
    TableCalendar<'_>,
    |value: TableCalendar<'_>| match value.id() {
        TableCalendarId::Chinese => "chinese",
        TableCalendarId::Dangi => "dangi",
        TableCalendarId::IslamicUmmAlQura => "islamic-umalqura",
    }
);

/// One provider type for registries containing all sixteen calendars.
#[derive(Clone, Copy, Debug)]
pub enum CalendarRef<'a> {
    Arithmetic(Calendar),
    Table(TableCalendar<'a>),
}
impl From<Calendar> for CalendarRef<'_> {
    fn from(value: Calendar) -> Self {
        Self::Arithmetic(value)
    }
}
impl<'a> From<TableCalendar<'a>> for CalendarRef<'a> {
    fn from(value: TableCalendar<'a>) -> Self {
        Self::Table(value)
    }
}
impl sealed::Sealed for CalendarRef<'_> {}
macro_rules! dispatch {
    ($self:ident, $method:ident $(, $arg:expr)*) => {
        match $self {
            Self::Arithmetic(value) => CalendarProvider::$method(value $(, $arg)*),
            Self::Table(value) => CalendarProvider::$method(value $(, $arg)*),
        }
    };
}
impl CalendarProvider for CalendarRef<'_> {
    fn id(self) -> &'static str {
        dispatch!(self, id)
    }
    fn date(self, day: i64) -> Result<Date, crate::calendar::Error> {
        dispatch!(self, date, day)
    }
    fn epoch_day(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, epoch_day, year, month, day, overflow)
    }
    fn month_from_code(
        self,
        year: i32,
        code: MonthCode,
        overflow: Overflow,
    ) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, month_from_code, year, code, overflow)
    }
    fn months_in_year(self, year: i32) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, months_in_year, year)
    }
    fn days_in_month(self, year: i32, month: u8) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, days_in_month, year, month)
    }
    fn start_of_year(self, year: i32) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, start_of_year, year)
    }
    fn era(self, day: i64) -> Result<Option<Era>, crate::calendar::Error> {
        dispatch!(self, era, day)
    }
    fn year_from_era(self, era: &str, year: i32) -> Result<i32, crate::calendar::Error> {
        dispatch!(self, year_from_era, era, year)
    }
    fn add(
        self,
        day: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, add, day, duration, overflow)
    }
    fn until_raw(
        self,
        one: i64,
        two: i64,
        largest: DateUnit,
    ) -> Result<DateDuration, crate::calendar::Error> {
        dispatch!(self, until_raw, one, two, largest)
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct DateFields<'a> {
    pub year: Option<i32>,
    pub month: Option<i32>,
    pub month_code: Option<MonthCode>,
    pub day: Option<i32>,
    pub era: Option<&'a str>,
    pub era_year: Option<i32>,
}

pub(crate) fn error(error: crate::calendar::Error) -> crate::Error {
    match error {
        crate::calendar::Error::OutOfRange => crate::Error::OutOfRange,
        crate::calendar::Error::InvalidDuration => crate::Error::InvalidDuration,
        _ => crate::Error::InvalidDateTime,
    }
}
pub(crate) fn overflow(value: crate::Overflow) -> Overflow {
    match value {
        crate::Overflow::Constrain => Overflow::Constrain,
        crate::Overflow::Reject => Overflow::Reject,
    }
}
pub(crate) fn resolve_fields<C: CalendarProvider>(
    calendar: C,
    fields: DateFields<'_>,
    mode: crate::Overflow,
) -> Result<i64, crate::Error> {
    if fields.month.is_some_and(|value| value <= 0) || fields.day.is_some_and(|value| value <= 0) {
        return Err(crate::Error::InvalidDateTime);
    }
    let era_year = if calendar.id() == "iso8601" {
        None
    } else {
        match (fields.era, fields.era_year) {
            (Some(era), Some(year)) => Some(calendar.year_from_era(era, year).map_err(error)?),
            (None, None) => None,
            _ => return Err(crate::Error::InvalidDateTime),
        }
    };
    let year = fields
        .year
        .or(era_year)
        .ok_or(crate::Error::InvalidDateTime)?;
    if era_year.is_some_and(|value| value != year) {
        return Err(crate::Error::InvalidDateTime);
    }
    let month = if let Some(code) = fields.month_code {
        let value = calendar
            .month_from_code(year, code, overflow(mode))
            .map_err(error)?;
        if fields.month.is_some_and(|month| month != i32::from(value)) {
            return Err(crate::Error::InvalidDateTime);
        }
        i32::from(value)
    } else {
        fields.month.ok_or(crate::Error::InvalidDateTime)?
    };
    calendar
        .epoch_day(
            year,
            month,
            fields.day.ok_or(crate::Error::InvalidDateTime)?,
            overflow(mode),
        )
        .map_err(error)
}
