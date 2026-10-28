//! Optional DateTimeFormat arithmetic. Locale patches and tables load independently.
mod arithmetic;
#[cfg(feature = "compiled_data")]
mod compiled;
pub mod ffi;
mod tables;
use arithmetic::Calendar;
use formatjs_intl_datetimeformat::{
    Error, Runtime,
    calendar::{CalendarFields, CalendarProvider},
};
use serde::Deserialize;
use std::sync::Arc;
use tables::{Lunisolar, LunisolarRaw, UmmAlQura, UmmRaw};

#[derive(Deserialize)]
#[serde(tag = "calendar", rename_all = "kebab-case", deny_unknown_fields)]
enum RawProvider {
    Buddhist {},
    Coptic {},
    Ethiopic {},
    Ethioaa {},
    Roc {},
    Japanese {},
    Indian {},
    IslamicCivil {},
    IslamicTbla {},
    Persian {},
    Hebrew {},
    IslamicUmalqura { data: UmmRaw },
    Chinese { data: LunisolarRaw },
    Dangi { data: LunisolarRaw },
}
enum Implementation {
    Arithmetic(Calendar),
    UmmAlQura(UmmAlQura),
    Lunisolar(Lunisolar),
}
pub struct Provider {
    name: &'static str,
    implementation: Implementation,
}
impl Provider {
    pub fn arithmetic(name: &str) -> Result<Self, Error> {
        let calendar = Calendar::from_name(name).ok_or(Error::MissingCalendar)?;
        Ok(Self {
            name: calendar.name(),
            implementation: Implementation::Arithmetic(calendar),
        })
    }
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let data: RawProvider = serde_json::from_str(json).map_err(|_| Error::InvalidLocaleData)?;
        Ok(match data {
            RawProvider::IslamicUmalqura { data } => Self {
                name: "islamic-umalqura",
                implementation: Implementation::UmmAlQura(UmmAlQura::new(data)?),
            },
            RawProvider::Chinese { data } => Self {
                name: "chinese",
                implementation: Implementation::Lunisolar(Lunisolar::new(data)?),
            },
            RawProvider::Dangi { data } => Self {
                name: "dangi",
                implementation: Implementation::Lunisolar(Lunisolar::new(data)?),
            },
            data => {
                let calendar = match data {
                    RawProvider::Buddhist {} => Calendar::Buddhist,
                    RawProvider::Coptic {} => Calendar::Coptic,
                    RawProvider::Ethiopic {} => Calendar::Ethiopic,
                    RawProvider::Ethioaa {} => Calendar::Ethioaa,
                    RawProvider::Roc {} => Calendar::Roc,
                    RawProvider::Japanese {} => Calendar::Japanese,
                    RawProvider::Indian {} => Calendar::Indian,
                    RawProvider::IslamicCivil {} => Calendar::IslamicCivil,
                    RawProvider::IslamicTbla {} => Calendar::IslamicTabular,
                    RawProvider::Persian {} => Calendar::Persian,
                    RawProvider::Hebrew {} => Calendar::Hebrew,
                    _ => unreachable!(),
                };
                Self {
                    name: calendar.name(),
                    implementation: Implementation::Arithmetic(calendar),
                }
            }
        })
    }
    pub fn name(&self) -> &str {
        self.name
    }
    pub fn register(self, runtime: &Runtime) {
        runtime.register_calendar(self.name.into(), Arc::new(self));
    }
}
impl CalendarProvider for Provider {
    fn date_from_time(&self, milliseconds: i64) -> Result<CalendarFields, Error> {
        match &self.implementation {
            Implementation::Arithmetic(calendar) => calendar.date_from_time(milliseconds),
            Implementation::UmmAlQura(data) => data.date_from_time(milliseconds),
            Implementation::Lunisolar(data) => data.date_from_time(milliseconds),
        }
    }
}
