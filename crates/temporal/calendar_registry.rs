use crate::{
    CalendarRef, Error,
    calendar::Calendar,
    table_calendar::{TableCalendar, TableCalendarId},
};

/// Arithmetic calendars plus validated caller-owned table providers.
#[derive(Clone, Copy, Debug)]
pub struct CalendarRegistry<'a> {
    tables: [Option<TableCalendar<'a>>; 3],
}
impl<'a> CalendarRegistry<'a> {
    pub const fn arithmetic() -> Self {
        Self { tables: [None; 3] }
    }
    pub fn new(tables: &[TableCalendar<'a>]) -> Result<Self, Error> {
        let mut registry = Self::arithmetic();
        for &table in tables {
            let slot = match table.id() {
                TableCalendarId::Chinese => 0,
                TableCalendarId::Dangi => 1,
                TableCalendarId::IslamicUmmAlQura => 2,
            };
            if registry.tables[slot].replace(table).is_some() {
                return Err(Error::InvalidCalendarData);
            }
        }
        Ok(registry)
    }
    pub fn resolve(&self, identifier: &str) -> Result<CalendarRef<'a>, Error> {
        let identifier = if identifier.eq_ignore_ascii_case("islamicc") {
            "islamic-civil"
        } else if identifier.eq_ignore_ascii_case("ethiopic-amete-alem") {
            "ethioaa"
        } else {
            identifier
        };
        if let Some(calendar) = Calendar::ALL
            .into_iter()
            .find(|calendar| calendar.name().eq_ignore_ascii_case(identifier))
        {
            return Ok(CalendarRef::Arithmetic(calendar));
        }
        let slot = ["chinese", "dangi", "islamic-umalqura"]
            .iter()
            .position(|id| id.eq_ignore_ascii_case(identifier))
            .ok_or(Error::InvalidCalendar)?;
        self.tables[slot]
            .map(CalendarRef::Table)
            .ok_or(Error::MissingCalendarData)
    }
    pub fn calendars(self) -> impl Iterator<Item = CalendarRef<'a>> {
        Calendar::ALL
            .into_iter()
            .map(CalendarRef::Arithmetic)
            .chain(self.tables.into_iter().flatten().map(CalendarRef::Table))
    }
    pub(crate) fn for_string(&self, value: &str) -> Result<CalendarRef<'a>, Error> {
        self.resolve(crate::parse::calendar_annotation(value).unwrap_or("iso8601"))
    }
}
impl Default for CalendarRegistry<'_> {
    fn default() -> Self {
        Self::arithmetic()
    }
}
impl CalendarRegistry<'static> {
    /// Validate compiled packs once when creating a context; reuse this registry.
    #[cfg(feature = "compiled_calendars")]
    pub fn compiled() -> Result<Self, Error> {
        Self::new(&[
            TableCalendar::lunisolar(TableCalendarId::Chinese, data::CHINESE)
                .map_err(|_| Error::InvalidCalendarData)?,
            TableCalendar::lunisolar(TableCalendarId::Dangi, data::DANGI)
                .map_err(|_| Error::InvalidCalendarData)?,
            TableCalendar::umm_al_qura(data::UMM_AL_QURA)
                .map_err(|_| Error::InvalidCalendarData)?,
        ])
    }
}
#[cfg(feature = "compiled_calendars")]
mod data {
    use crate::table_calendar::{LunisolarData, UmmAlQuraData};
    include!(env!("FORMATJS_TEMPORAL_CALENDARS"));
}
