use crate::{Error, Unit};
use serde::{Deserialize, Serialize, Serializer, ser::SerializeMap};
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Style {
    Long,
    #[default]
    Short,
    Narrow,
    Digital,
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UnitStyle {
    Long,
    Short,
    Narrow,
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
    Fractional,
}
impl UnitStyle {
    fn numeric(self) -> bool {
        matches!(self, Self::Numeric | Self::TwoDigit)
    }
    fn from_style(style: Style) -> Self {
        match style {
            Style::Long => Self::Long,
            Style::Short | Style::Digital => Self::Short,
            Style::Narrow => Self::Narrow,
        }
    }
}
#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Display {
    Always,
    Auto,
}
#[derive(Debug, Clone, Copy, Default)]
pub struct UnitInput {
    pub style: Option<UnitStyle>,
    pub display: Option<Display>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitOptions {
    pub style: UnitStyle,
    pub display: Display,
}
#[derive(Debug, Clone, Copy)]
pub struct PreparedUnit {
    unit: Unit,
    style: UnitStyle,
    display_default: Display,
}
impl PreparedUnit {
    pub fn style(&self) -> UnitStyle {
        self.style
    }
    pub fn display_default(&self) -> Display {
        self.display_default
    }
}
pub struct UnitResolver {
    base: Style,
    previous: Option<UnitStyle>,
}
impl UnitResolver {
    pub fn new(base: Style) -> Self {
        Self {
            base,
            previous: None,
        }
    }
    pub fn prepare(&self, unit: Unit, input: Option<UnitStyle>) -> Result<PreparedUnit, Error> {
        if input.is_some_and(|style| {
            style == UnitStyle::Fractional
                || (style.numeric()
                    && !unit.is_clock()
                    && !(style == UnitStyle::Numeric && unit.is_subsecond()))
        }) {
            return Err(Error::InvalidOption);
        }
        let mut display_default = Display::Always;
        let mut style = if let Some(style) = input {
            style
        } else if self.base == Style::Digital {
            if !unit.is_clock() {
                display_default = Display::Auto;
            }
            if unit.is_clock() || unit.is_subsecond() {
                UnitStyle::Numeric
            } else {
                UnitStyle::Short
            }
        } else if self
            .previous
            .is_some_and(|style| style.numeric() || style == UnitStyle::Fractional)
        {
            if !matches!(unit, Unit::Minutes | Unit::Seconds) {
                display_default = Display::Auto;
            }
            UnitStyle::Numeric
        } else {
            display_default = Display::Auto;
            UnitStyle::from_style(self.base)
        };
        if style == UnitStyle::Numeric && unit.is_subsecond() {
            style = UnitStyle::Fractional;
            display_default = Display::Auto;
        }
        Ok(PreparedUnit {
            unit,
            style,
            display_default,
        })
    }
    pub fn finish(
        &mut self,
        prepared: PreparedUnit,
        display: Option<Display>,
    ) -> Result<UnitOptions, Error> {
        let display = display.unwrap_or(prepared.display_default);
        let mut style = prepared.style;
        if (display == Display::Always && style == UnitStyle::Fractional)
            || (self.previous == Some(UnitStyle::Fractional) && style != UnitStyle::Fractional)
            || (self.previous.is_some_and(UnitStyle::numeric)
                && !style.numeric()
                && style != UnitStyle::Fractional)
        {
            return Err(Error::InvalidOption);
        }
        if matches!(prepared.unit, Unit::Minutes | Unit::Seconds)
            && self.previous.is_some_and(UnitStyle::numeric)
        {
            style = UnitStyle::TwoDigit;
        }
        if matches!(
            prepared.unit,
            Unit::Hours | Unit::Minutes | Unit::Seconds | Unit::Milliseconds | Unit::Microseconds
        ) {
            self.previous = Some(style);
        }
        Ok(UnitOptions { style, display })
    }
}
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub style: Style,
    pub years: Option<UnitStyle>,
    pub years_display: Option<Display>,
    pub months: Option<UnitStyle>,
    pub months_display: Option<Display>,
    pub weeks: Option<UnitStyle>,
    pub weeks_display: Option<Display>,
    pub days: Option<UnitStyle>,
    pub days_display: Option<Display>,
    pub hours: Option<UnitStyle>,
    pub hours_display: Option<Display>,
    pub minutes: Option<UnitStyle>,
    pub minutes_display: Option<Display>,
    pub seconds: Option<UnitStyle>,
    pub seconds_display: Option<Display>,
    pub milliseconds: Option<UnitStyle>,
    pub milliseconds_display: Option<Display>,
    pub microseconds: Option<UnitStyle>,
    pub microseconds_display: Option<Display>,
    pub nanoseconds: Option<UnitStyle>,
    pub nanoseconds_display: Option<Display>,
    pub fractional_digits: Option<f64>,
}
impl Options {
    pub fn units(&self) -> [UnitInput; 10] {
        [
            (self.years, self.years_display),
            (self.months, self.months_display),
            (self.weeks, self.weeks_display),
            (self.days, self.days_display),
            (self.hours, self.hours_display),
            (self.minutes, self.minutes_display),
            (self.seconds, self.seconds_display),
            (self.milliseconds, self.milliseconds_display),
            (self.microseconds, self.microseconds_display),
            (self.nanoseconds, self.nanoseconds_display),
        ]
        .map(|(style, display)| UnitInput { style, display })
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Configuration {
    pub style: Style,
    pub units: [UnitOptions; 10],
    pub fractional_digits: Option<u8>,
}
impl Configuration {
    pub fn new(options: &Options) -> Result<Self, Error> {
        let mut resolver = UnitResolver::new(options.style);
        let mut units = [UnitOptions {
            style: UnitStyle::Short,
            display: Display::Auto,
        }; 10];
        for ((unit, input), output) in Unit::ALL.into_iter().zip(options.units()).zip(&mut units) {
            let prepared = resolver.prepare(unit, input.style)?;
            *output = resolver.finish(prepared, input.display)?;
        }
        let fractional_digits = fractional_digits(options.fractional_digits)?;
        Ok(Self {
            style: options.style,
            units,
            fractional_digits,
        })
    }
}
pub(crate) fn fractional_digits(value: Option<f64>) -> Result<Option<u8>, Error> {
    value
        .map(|value| {
            if !value.is_finite() || !(0.0..=9.0).contains(&value) {
                return Err(Error::InvalidOption);
            }
            Ok(value.floor() as u8)
        })
        .transpose()
}
impl Serialize for Configuration {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut output =
            serializer.serialize_map(Some(21 + usize::from(self.fractional_digits.is_some())))?;
        output.serialize_entry("style", &self.style)?;
        for (unit, options) in Unit::ALL.into_iter().zip(self.units) {
            let style = if options.style == UnitStyle::Fractional {
                UnitStyle::Numeric
            } else {
                options.style
            };
            output.serialize_entry(unit.key(), &style)?;
            output.serialize_entry(unit.display_key(), &options.display)?;
        }
        if let Some(digits) = self.fractional_digits {
            output.serialize_entry("fractionalDigits", &digits)?;
        }
        output.end()
    }
}
