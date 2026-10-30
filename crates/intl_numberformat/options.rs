use crate::{Error, metadata};
use formatjs_intl_pluralrules::digits::{Digits, Options as DigitOptions};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub enum GroupingInput {
    Boolean(bool),
    Name(String),
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    pub locale_matcher: Option<String>,
    pub numbering_system: Option<String>,
    pub style: Option<String>,
    pub currency: Option<String>,
    pub currency_display: Option<String>,
    pub currency_sign: Option<String>,
    pub unit: Option<String>,
    pub unit_display: Option<String>,
    pub notation: Option<String>,
    pub compact_display: Option<String>,
    pub use_grouping: Option<GroupingInput>,
    pub sign_display: Option<String>,
    #[serde(flatten)]
    pub digits: DigitOptions,
}

pub(crate) fn choice<'a>(
    value: Option<&'a str>,
    default: &'a str,
    choices: &[&str],
    key: &'static str,
) -> Result<&'a str, Error> {
    let value = value.unwrap_or(default);
    if choices.contains(&value) {
        Ok(value)
    } else {
        Err(Error::Range(key))
    }
}
pub(crate) fn digit_error(error: formatjs_intl_pluralrules::digits::Error) -> Error {
    match error {
        formatjs_intl_pluralrules::digits::Error::Range(key) => Error::Range(key),
        formatjs_intl_pluralrules::digits::Error::Type(key) => Error::Type(key),
        formatjs_intl_pluralrules::digits::Error::InvalidNumber => Error::Range("value"),
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Grouping {
    Disabled,
    Auto,
    Always,
    Min2,
}
impl Serialize for Grouping {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        match self {
            Self::Disabled => serializer.serialize_bool(false),
            Self::Auto => serializer.serialize_str("auto"),
            Self::Always => serializer.serialize_str("always"),
            Self::Min2 => serializer.serialize_str("min2"),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions {
    pub locale: String,
    pub numbering_system: String,
    pub style: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_display: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency_sign: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_display: Option<String>,
    #[serde(flatten)]
    pub digits: Digits,
    pub use_grouping: Grouping,
    pub notation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compact_display: Option<String>,
    pub sign_display: String,
}

pub(crate) fn resolve(
    locale: String,
    numbering_system: String,
    options: &Options,
) -> Result<ResolvedOptions, Error> {
    let metadata = metadata::load()?;
    let style = choice(
        options.style.as_deref(),
        "decimal",
        &["decimal", "percent", "currency", "unit"],
        "style",
    )?;
    if let Some(currency) = &options.currency {
        if currency.len() != 3 || !currency.bytes().all(|value| value.is_ascii_alphabetic()) {
            return Err(Error::Range("currency"));
        }
    }
    if style == "currency" && options.currency.is_none() {
        return Err(Error::Type("currency"));
    }
    let currency_display = choice(
        options.currency_display.as_deref(),
        "symbol",
        &["code", "symbol", "narrowSymbol", "name"],
        "currencyDisplay",
    )?;
    let currency_sign = choice(
        options.currency_sign.as_deref(),
        "standard",
        &["standard", "accounting"],
        "currencySign",
    )?;
    if let Some(unit) = &options.unit {
        let simple = |unit: &str| metadata.units.contains(unit);
        if !simple(unit)
            && !unit
                .split_once("-per-")
                .is_some_and(|(a, b)| simple(a) && simple(b))
        {
            return Err(Error::Range("unit"));
        }
    }
    if style == "unit" && options.unit.is_none() {
        return Err(Error::Type("unit"));
    }
    let unit_display = choice(
        options.unit_display.as_deref(),
        "short",
        &["short", "narrow", "long"],
        "unitDisplay",
    )?;
    let notation = choice(
        options.notation.as_deref(),
        "standard",
        &["standard", "scientific", "engineering", "compact"],
        "notation",
    )?;
    let currency = options.currency.as_deref().map(str::to_ascii_uppercase);
    let (minimum, maximum) = if style == "currency" && notation == "standard" {
        let digits = *metadata
            .currency_digits
            .get(currency.as_deref().unwrap())
            .unwrap_or(&2);
        (digits, digits)
    } else {
        (0, if style == "percent" { 0 } else { 3 })
    };
    let digits =
        Digits::with_fraction_defaults(&options.digits, notation == "compact", minimum, maximum)
            .map_err(digit_error)?;
    let compact_display = choice(
        options.compact_display.as_deref(),
        "short",
        &["short", "long"],
        "compactDisplay",
    )?;
    let default_grouping = if notation == "compact" {
        Grouping::Min2
    } else {
        Grouping::Auto
    };
    let use_grouping = match options.use_grouping.as_ref() {
        None => default_grouping,
        Some(GroupingInput::Boolean(false)) => Grouping::Disabled,
        Some(GroupingInput::Boolean(true)) => Grouping::Always,
        Some(GroupingInput::Name(name)) => match name.as_str() {
            "true" | "false" => default_grouping,
            "auto" => Grouping::Auto,
            "always" => Grouping::Always,
            "min2" => Grouping::Min2,
            _ => return Err(Error::Range("useGrouping")),
        },
    };
    let sign_display = choice(
        options.sign_display.as_deref(),
        "auto",
        &["auto", "always", "never", "exceptZero", "negative"],
        "signDisplay",
    )?;
    Ok(ResolvedOptions {
        locale,
        numbering_system,
        style: style.into(),
        currency: if style == "currency" { currency } else { None },
        currency_display: (style == "currency").then(|| currency_display.into()),
        currency_sign: (style == "currency").then(|| currency_sign.into()),
        unit: if style == "unit" {
            options.unit.clone()
        } else {
            None
        },
        unit_display: (style == "unit").then(|| unit_display.into()),
        digits,
        use_grouping,
        notation: notation.into(),
        compact_display: (notation == "compact").then(|| compact_display.into()),
        sign_display: sign_display.into(),
    })
}
