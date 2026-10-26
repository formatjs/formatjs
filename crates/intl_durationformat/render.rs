use crate::{Configuration, Display, Duration, Style, Unit, UnitStyle};
use formatjs_intl_listformat as list;
use formatjs_intl_numberformat as number;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug)]
pub enum RenderError {
    Number(number::Error),
    List(list::Error),
    InvalidParts,
}
impl From<number::Error> for RenderError {
    fn from(error: number::Error) -> Self {
        Self::Number(error)
    }
}
impl From<list::Error> for RenderError {
    fn from(error: list::Error) -> Self {
        Self::List(error)
    }
}
impl std::fmt::Display for RenderError {
    fn fmt(&self, output: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(output, "{self:?}")
    }
}
impl std::error::Error for RenderError {}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Part {
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<&'static str>,
}
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
enum Width {
    Long,
    Short,
    Narrow,
}
impl Width {
    fn name(self) -> &'static str {
        match self {
            Self::Long => "long",
            Self::Short => "short",
            Self::Narrow => "narrow",
        }
    }
    fn list_style(self) -> list::Style {
        match self {
            Self::Long => list::Style::Long,
            Self::Short => list::Style::Short,
            Self::Narrow => list::Style::Narrow,
        }
    }
}
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
enum Presentation {
    Decimal(bool),
    Unit(Unit, Width),
}
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
enum Fraction {
    Default,
    Flexible,
    Fixed(u8),
}
#[derive(PartialEq, Eq, Hash)]
struct NumberKey {
    locale: String,
    numbering_system: String,
    presentation: Presentation,
    fraction: Fraction,
    sign_never: bool,
}
impl NumberKey {
    fn options(&self) -> number::Options {
        let mut options = number::Options {
            numbering_system: Some(self.numbering_system.clone()),
            sign_display: self.sign_never.then(|| "never".into()),
            ..Default::default()
        };
        match self.presentation {
            Presentation::Decimal(two_digit) => {
                options.use_grouping = Some(number::GroupingInput::Boolean(false));
                options.digits.minimum_integer_digits = two_digit.then_some(2.0);
            }
            Presentation::Unit(unit, width) => {
                options.style = Some("unit".into());
                options.unit = Some(unit.singular().into());
                options.unit_display = Some(width.name().into());
            }
        }
        match self.fraction {
            Fraction::Default => {}
            Fraction::Flexible => {
                options.digits.minimum_fraction_digits = Some(0.0);
                options.digits.maximum_fraction_digits = Some(9.0);
                options.digits.rounding_mode = Some("trunc".into());
            }
            Fraction::Fixed(digits) => {
                options.digits.minimum_fraction_digits = Some(f64::from(digits));
                options.digits.maximum_fraction_digits = Some(f64::from(digits));
                options.digits.rounding_mode = Some("trunc".into());
            }
        }
        options
    }
}

/// One dependency context per installation. Locale packs are caller selected;
/// memoized formatters retain their data when later packs replace registry entries.
#[derive(Default)]
pub struct Renderer {
    numbers: number::registry::Registry,
    lists: list::registry::Registry,
    number_cache: HashMap<NumberKey, number::NumberFormat>,
    list_cache: HashMap<(String, Width), list::ListFormat>,
}
impl Renderer {
    pub fn add_number_data(&mut self, json: &str) -> Result<(), RenderError> {
        Ok(self.numbers.add_locale_data(json)?)
    }
    pub fn add_number_unit_data(&mut self, locale: &str, json: &str) -> Result<(), RenderError> {
        Ok(self.numbers.add_unit_data(locale, json)?)
    }
    pub fn add_list_data(&mut self, json: &str) -> Result<(), RenderError> {
        Ok(self.lists.add_locale_data(json)?)
    }
    fn number(&mut self, key: NumberKey) -> Result<&number::NumberFormat, RenderError> {
        use std::collections::hash_map::Entry;
        Ok(match self.number_cache.entry(key) {
            Entry::Occupied(entry) => entry.into_mut(),
            Entry::Vacant(entry) => {
                let key = entry.key();
                let formatter = self
                    .numbers
                    .create(std::slice::from_ref(&key.locale), &key.options())?;
                entry.insert(formatter)
            }
        })
    }

    pub fn format_to_parts(
        &mut self,
        configuration: &Configuration,
        locale: &str,
        numbering_system: &str,
        separator: &str,
        duration: &Duration,
    ) -> Result<Vec<Part>, RenderError> {
        let mut groups: Vec<Vec<Part>> = Vec::new();
        let mut separated = false;
        let mut sign_displayed = false;
        for unit in Unit::ALL {
            let index = unit as usize;
            let options = configuration.units[index];
            let fold = matches!(
                unit,
                Unit::Seconds | Unit::Milliseconds | Unit::Microseconds
            ) && matches!(
                configuration.units[index + 1].style,
                UnitStyle::Numeric | UnitStyle::Fractional
            );
            let scale_digits = if fold { (9 - index) * 3 } else { 0 };
            let scale = 10_i128.pow(scale_digits as u32);
            let mut value = duration.get(unit) * scale;
            if fold {
                for next in Unit::ALL.iter().skip(index + 1) {
                    value += duration.get(*next) * 10_i128.pow(((9 - *next as usize) * 3) as u32);
                }
            }
            let minutes_between = unit == Unit::Minutes
                && separated
                && (configuration.units[Unit::Seconds as usize].display == Display::Always
                    || Unit::ALL[Unit::Seconds as usize..]
                        .iter()
                        .any(|unit| duration.get(*unit) != 0));
            if value != 0 || options.display == Display::Always || minutes_between {
                let negative_zero = !sign_displayed && value == 0 && duration.is_negative();
                let fraction = if fold {
                    configuration
                        .fractional_digits
                        .map_or(Fraction::Flexible, Fraction::Fixed)
                } else {
                    Fraction::Default
                };
                let presentation = match options.style {
                    UnitStyle::Long => Presentation::Unit(unit, Width::Long),
                    UnitStyle::Short => Presentation::Unit(unit, Width::Short),
                    UnitStyle::Narrow => Presentation::Unit(unit, Width::Narrow),
                    UnitStyle::Numeric | UnitStyle::Fractional => Presentation::Decimal(false),
                    UnitStyle::TwoDigit => Presentation::Decimal(true),
                };
                let key = NumberKey {
                    locale: locale.into(),
                    numbering_system: numbering_system.into(),
                    presentation,
                    fraction,
                    sign_never: sign_displayed,
                };
                let decimal = if negative_zero {
                    "-0".into()
                } else if scale_digits == 0 {
                    value.to_string()
                } else {
                    let magnitude = value.unsigned_abs();
                    format!(
                        "{}{}.{:0width$}",
                        if value < 0 { "-" } else { "" },
                        magnitude / scale as u128,
                        magnitude % scale as u128,
                        width = scale_digits
                    )
                };
                let parts = self.number(key)?.format_to_parts(&decimal)?;
                let new_group = !separated;
                if new_group {
                    groups.push(Vec::new());
                }
                let group = groups.last_mut().ok_or(RenderError::InvalidParts)?;
                if separated {
                    group.push(Part {
                        kind: "literal",
                        value: separator.into(),
                        unit: None,
                    });
                }
                group.extend(parts.into_iter().map(|part| Part {
                    kind: part.kind,
                    value: part.value,
                    unit: Some(unit.singular()),
                }));
                if new_group {
                    separated = matches!(options.style, UnitStyle::Numeric | UnitStyle::TwoDigit);
                }
                sign_displayed = true;
            } else {
                separated = false;
            }
            if fold {
                break;
            }
        }
        let width = match configuration.style {
            Style::Long => Width::Long,
            Style::Short | Style::Digital => Width::Short,
            Style::Narrow => Width::Narrow,
        };
        let key = (locale.to_owned(), width);
        if !self.list_cache.contains_key(&key) {
            let locale = self.lists.negotiate(&[locale.to_owned()], false)?;
            let formatter = self.lists.create(
                &locale,
                &list::Options {
                    kind: list::Type::Unit,
                    style: width.list_style(),
                },
            )?;
            self.list_cache.insert(key.clone(), formatter);
        }
        let strings: Vec<Vec<u16>> = groups
            .iter()
            .map(|parts| {
                parts
                    .iter()
                    .flat_map(|part| part.value.encode_utf16())
                    .collect()
            })
            .collect();
        let parts = self
            .list_cache
            .get(&key)
            .ok_or(RenderError::InvalidParts)?
            .format_to_parts(&strings);
        let mut groups = groups.into_iter();
        let mut output = Vec::new();
        for part in parts {
            if part.kind == "element" {
                output.extend(groups.next().ok_or(RenderError::InvalidParts)?);
            } else if part.kind == "literal" {
                output.push(Part {
                    kind: "literal",
                    value: String::from_utf16(&part.value)
                        .map_err(|_| RenderError::InvalidParts)?,
                    unit: None,
                });
            } else {
                return Err(RenderError::InvalidParts);
            }
        }
        if groups.next().is_some() {
            return Err(RenderError::InvalidParts);
        }
        Ok(output)
    }
}
