use crate::{Error, civil::CivilDateTime};
use serde::Serialize;
use std::{collections::BTreeMap, sync::Arc};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarFields {
    pub era: String,
    pub year: i32,
    pub month: u8,
    pub day: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month_name_index: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month_number: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub leap_month: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub related_year: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year_name: Option<u8>,
}

pub trait CalendarProvider {
    fn date_from_time(&self, local_milliseconds: i64) -> Result<CalendarFields, Error>;
}

impl<F> CalendarProvider for F
where
    F: Fn(i64) -> Result<CalendarFields, Error>,
{
    fn date_from_time(&self, local_milliseconds: i64) -> Result<CalendarFields, Error> {
        self(local_milliseconds)
    }
}

#[derive(Clone)]
pub struct CalendarRegistry {
    providers: BTreeMap<String, Arc<dyn CalendarProvider>>,
    builtin: Arc<dyn CalendarProvider>,
}

impl Default for CalendarRegistry {
    fn default() -> Self {
        Self {
            providers: BTreeMap::new(),
            builtin: Arc::new(gregorian),
        }
    }
}
fn gregorian(local_milliseconds: i64) -> Result<CalendarFields, Error> {
    let civil = CivilDateTime::from_epoch_nanoseconds(i128::from(local_milliseconds) * 1_000_000)?;
    let (era, year) = civil.era_year();
    Ok(CalendarFields {
        era: era.into(),
        year: year as i32,
        month: civil.month - 1,
        day: civil.day,
        month_name_index: None,
        month_number: None,
        leap_month: None,
        related_year: None,
        year_name: None,
    })
}

impl CalendarRegistry {
    pub fn register(&mut self, calendar: String, provider: Arc<dyn CalendarProvider>) {
        self.providers.insert(calendar, provider);
    }

    pub fn contains(&self, calendar: &str) -> bool {
        matches!(calendar, "gregory" | "iso8601") || self.providers.contains_key(calendar)
    }

    pub fn provider(&self, calendar: &str) -> Result<Arc<dyn CalendarProvider>, Error> {
        if matches!(calendar, "gregory" | "iso8601") {
            Ok(self.builtin.clone())
        } else {
            self.providers
                .get(calendar)
                .cloned()
                .ok_or(Error::MissingCalendar)
        }
    }
    pub fn date_from_time(
        &self,
        calendar: &str,
        local_milliseconds: i64,
    ) -> Result<CalendarFields, Error> {
        self.provider(calendar)?.date_from_time(local_milliseconds)
    }
}
