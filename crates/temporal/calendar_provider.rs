use crate::calendar::{Calendar, Date, DateDuration, DateUnit, Era, MonthCode, Overflow};
use formatjs_intl_datetimeformat_calendars::table_calendar::{TableCalendar, TableCalendarId};

pub use formatjs_intl_datetimeformat_calendars::table_calendar;

mod sealed {
    pub trait Sealed {}
}

/// Validated arithmetic engines or immutable borrowed calendar tables.
pub trait CalendarProvider: sealed::Sealed + Copy {
    fn id(self) -> &'static str;
    fn date_extended(self, epoch: i64) -> Result<Date, crate::calendar::Error>;
    fn epoch_day_extended(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error>;
    fn add_extended(
        self,
        epoch: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error>;
    fn era_extended(self, epoch: i64) -> Result<Option<Era>, crate::calendar::Error>;
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
            fn date_extended(self, epoch: i64) -> Result<Date, crate::calendar::Error> {
                self.from_epoch_day_extended(epoch)
            }
            fn epoch_day_extended(
                self,
                year: i32,
                month: i32,
                day: i32,
                overflow: Overflow,
            ) -> Result<i64, crate::calendar::Error> {
                self.to_epoch_day_extended(year, month, day, overflow)
            }
            fn add_extended(
                self,
                epoch: i64,
                duration: DateDuration,
                overflow: Overflow,
            ) -> Result<i64, crate::calendar::Error> {
                self.add_extended(epoch, duration, overflow)
            }
            fn era_extended(self, epoch: i64) -> Result<Option<Era>, crate::calendar::Error> {
                self.era_extended(epoch)
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
    // Proposal comparison §3.3.3 step 3: read the selected provider's calendar ID.
    fn id(self) -> &'static str {
        dispatch!(self, id)
    }
    // Proposal comparison §12.3.26 steps 1.b, 2: project a short-date reference day.
    fn date_extended(self, epoch: i64) -> Result<Date, crate::calendar::Error> {
        dispatch!(self, date_extended, epoch)
    }
    // Proposal comparison §12.3.13 step 3: convert fields to a year-month reference day.
    fn epoch_day_extended(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, epoch_day_extended, year, month, day, overflow)
    }
    // Proposal comparison §9.5.8 step 12: dispatch year-month addition to the provider.
    fn add_extended(
        self,
        epoch: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, add_extended, epoch, duration, overflow)
    }
    // Proposal comparison §9.3.4 and §9.3.5 step 3: project era fields at the reference day.
    fn era_extended(self, epoch: i64) -> Result<Option<Era>, crate::calendar::Error> {
        dispatch!(self, era_extended, epoch)
    }
    // Proposal comparison §12.3.26 steps 1.b, 2: convert an epoch day through its calendar.
    fn date(self, day: i64) -> Result<Date, crate::calendar::Error> {
        dispatch!(self, date, day)
    }
    // Proposal comparison §12.3.22 steps 1.b, 2: convert resolved fields to an epoch day.
    fn epoch_day(
        self,
        year: i32,
        month: i32,
        day: i32,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, epoch_day, year, month, day, overflow)
    }
    // Proposal comparison §12.3.31 steps 1.h, 2.a: resolve a month code through its calendar.
    fn month_from_code(
        self,
        year: i32,
        code: MonthCode,
        overflow: Overflow,
    ) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, month_from_code, year, code, overflow)
    }
    // Proposal comparison §3.3.17 step 3: read the provider's month count for this year.
    fn months_in_year(self, year: i32) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, months_in_year, year)
    }
    // Proposal comparison §3.3.15 step 3: read the provider's day count for this month.
    fn days_in_month(self, year: i32, month: u8) -> Result<u8, crate::calendar::Error> {
        dispatch!(self, days_in_month, year, month)
    }
    // Proposal comparison §3.3.11 step 3: supply the year start for the day-of-year count.
    fn start_of_year(self, year: i32) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, start_of_year, year)
    }
    // Proposal comparison §3.3.4 and §3.3.5 step 3: read provider era fields.
    fn era(self, day: i64) -> Result<Option<Era>, crate::calendar::Error> {
        dispatch!(self, era, day)
    }
    // Proposal comparison §12.3.31 step 2.a: resolve a non-ISO era and era year.
    fn year_from_era(self, era: &str, year: i32) -> Result<i32, crate::calendar::Error> {
        dispatch!(self, year_from_era, era, year)
    }
    // Proposal comparison §12.3.7 steps 1, 2.a: dispatch checked calendar date addition.
    fn add(
        self,
        day: i64,
        duration: DateDuration,
        overflow: Overflow,
    ) -> Result<i64, crate::calendar::Error> {
        dispatch!(self, add, day, duration, overflow)
    }
    // Proposal comparison §12.3.9 steps 3, 4: dispatch calendar date difference.
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

impl DateFields<'_> {
    // Proposal comparison §12.3.5 step 1: check whether typed date updates contain fields.
    pub(crate) fn has_fields(self, calendar: &str) -> bool {
        self.year.is_some()
            || self.month.is_some()
            || self.month_code.is_some()
            || self.day.is_some()
            || (!matches!(calendar, "iso8601" | "chinese" | "dangi")
                && (self.era.is_some() || self.era_year.is_some()))
    }
}

#[derive(Clone, Copy)]
pub(crate) enum DateFieldShape {
    Date,
    YearMonth,
    MonthDay,
}

// Proposal comparison §12.3.5 steps 1–6: merge typed overrides with the projected date.
pub(crate) fn merge_fields<'a, C: CalendarProvider>(
    calendar: C,
    epoch: i64,
    mut updates: DateFields<'a>,
    shape: DateFieldShape,
) -> Result<DateFields<'a>, crate::Error> {
    if matches!(shape, DateFieldShape::YearMonth) {
        updates.day = None;
    }
    // ECMA-262 preview §22.3.3.11 steps 1–2: retain era fields only for calendars that accept them.
    // https://tc39.es/ecma262/pr/3966/#sec-calendarextrafields
    if matches!(calendar.id(), "iso8601" | "chinese" | "dangi") {
        updates.era = None;
        updates.era_year = None;
    }
    if !updates.has_fields(calendar.id()) {
        return Err(crate::Error::InvalidDateTime);
    }
    // YearMonth reference days can lie outside PlainDate's range.
    let date = calendar.date_extended(epoch).map_err(error)?;
    // ECMA-262 preview §22.3.9.4 steps 3–5 limit fields by shape.
    // https://tc39.es/ecma262/pr/3966/#sec-isodatetofields
    let mut base = DateFields {
        year: (!matches!(shape, DateFieldShape::MonthDay)).then_some(date.year),
        month_code: Some(date.month_code),
        day: (!matches!(shape, DateFieldShape::YearMonth)).then_some(date.day.into()),
        ..DateFields::default()
    };
    // ECMA-262 preview §22.3.3.12 steps 1.e and 2: drop the inherited month code when month is supplied.
    // https://tc39.es/ecma262/pr/3966/#sec-calendarfieldkeystoignore
    if updates.month.is_some() {
        base.month_code = None
    }
    // §22.3.3.13: a supplied year or era field overrides the inherited year.
    // https://tc39.es/ecma262/pr/3966/#sec-nonisofieldkeystoignore
    if calendar.id() != "iso8601"
        && (updates.year.is_some() || updates.era.is_some() || updates.era_year.is_some())
    {
        base.year = None;
    }
    Ok(DateFields {
        year: updates.year.or(base.year),
        month: updates.month,
        month_code: updates.month_code.or(base.month_code),
        day: updates.day.or(base.day),
        era: updates.era,
        era_year: updates.era_year,
    })
}

// Proposal comparison §12.3.22 steps 1.b, 2: carry date conversion errors to callers.
pub(crate) fn error(error: crate::calendar::Error) -> crate::Error {
    match error {
        crate::calendar::Error::OutOfRange => crate::Error::OutOfRange,
        crate::calendar::Error::InvalidDuration => crate::Error::InvalidDuration,
        _ => crate::Error::InvalidDateTime,
    }
}
// Proposal comparison §12.3.12 step 2: pass the prepared overflow mode to date conversion.
pub(crate) fn overflow(value: crate::Overflow) -> Overflow {
    match value {
        crate::Overflow::Constrain => Overflow::Constrain,
        crate::Overflow::Reject => Overflow::Reject,
    }
}
// Proposal comparison §12.3.12 steps 1–2: resolve typed fields and convert the date.
pub(crate) fn resolve_fields<C: CalendarProvider>(
    calendar: C,
    fields: DateFields<'_>,
    mode: crate::Overflow,
) -> Result<i64, crate::Error> {
    let (year, month) = resolve_year_month(calendar, fields, mode)?;
    calendar
        .epoch_day(
            year,
            month,
            fields.day.ok_or(crate::Error::InvalidDateTime)?,
            overflow(mode),
        )
        .map_err(error)
}
// Proposal comparison §12.3.31 step 2.a: reconcile typed year and era fields.
pub(crate) fn resolve_year<C: CalendarProvider>(
    calendar: C,
    fields: DateFields<'_>,
) -> Result<Option<i32>, crate::Error> {
    let era_year = if matches!(calendar.id(), "iso8601" | "chinese" | "dangi") {
        None
    } else {
        match (fields.era, fields.era_year) {
            (Some(era), Some(year)) => Some(calendar.year_from_era(era, year).map_err(error)?),
            (None, None) => None,
            _ => return Err(crate::Error::InvalidDateTime),
        }
    };
    if let (Some(year), Some(era)) = (fields.year, era_year) {
        if year != era {
            return Err(crate::Error::InvalidDateTime);
        }
    }
    Ok(fields.year.or(era_year))
}
// Proposal comparison §12.3.31 steps 1.e, 1.g–h, 2.a: resolve typed year and month.
pub(crate) fn resolve_year_month<C: CalendarProvider>(
    calendar: C,
    fields: DateFields<'_>,
    mode: crate::Overflow,
) -> Result<(i32, i32), crate::Error> {
    if fields.month.is_some_and(|value| value <= 0) || fields.day.is_some_and(|value| value <= 0) {
        return Err(crate::Error::InvalidDateTime);
    }
    let year = resolve_year(calendar, fields)?.ok_or(crate::Error::InvalidDateTime)?;
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
    Ok((year, month))
}
