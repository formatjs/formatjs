//! Validated plural instances. JS coercion and locale negotiation precede this
//! layer; instances retain their selected payload when more locales are loaded.

use crate::{Error, LocaleRules, digits};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub notation: Option<String>,
    pub compact_display: Option<String>,
    #[serde(flatten)]
    pub digits: digits::Options,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedOptions<'a> {
    pub locale: &'a str,
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub notation: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compact_display: Option<&'static str>,
    #[serde(flatten)]
    pub digits: &'a digits::Digits,
    pub plural_categories: Vec<&'static str>,
}

pub struct PluralRules {
    rules: Arc<LocaleRules>,
    ordinal: bool,
    notation: &'static str,
    compact_display: &'static str,
    digits: digits::Digits,
}

fn option(
    value: Option<&str>,
    values: &[&'static str],
    name: &'static str,
) -> Result<&'static str, Error> {
    let Some(value) = value else {
        return Ok(values[0]);
    };
    values
        .iter()
        .copied()
        .find(|candidate| *candidate == value)
        .ok_or(Error::InvalidOption(name))
}

impl PluralRules {
    pub fn new(rules: Arc<LocaleRules>, options: &Options) -> Result<Self, Error> {
        // Constructor 7–14: validate type, notation, compactDisplay, then digits.
        // compactDisplay is validated even when notation is not compact.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L27-L34
        let kind = option(options.kind.as_deref(), &["cardinal", "ordinal"], "type")?;
        let notation = option(
            options.notation.as_deref(),
            &["standard", "scientific", "engineering", "compact"],
            "notation",
        )?;
        let compact_display = option(
            options.compact_display.as_deref(),
            &["short", "long"],
            "compactDisplay",
        )?;
        let digits = digits::Digits::new(&options.digits, notation == "compact")?;
        Ok(Self {
            rules,
            ordinal: kind == "ordinal",
            notation,
            compact_display,
            digits,
        })
    }

    pub fn resolved_options(&self) -> ResolvedOptions<'_> {
        // resolvedOptions 3–6: include only active slots, ordered categories.
        // The host creates a fresh ordinary object in the spec table's order.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L114-L127
        ResolvedOptions {
            locale: self.rules.locale(),
            kind: if self.ordinal { "ordinal" } else { "cardinal" },
            notation: self.notation,
            compact_display: (self.notation == "compact").then_some(self.compact_display),
            digits: &self.digits,
            plural_categories: self.rules.categories(self.ordinal),
        }
    }

    fn formatted(&self, value: &str) -> Result<String, Error> {
        // ResolvePlural 1–4: non-finite values bypass numeric rounding.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L306-L316
        if ["NaN", "Infinity", "-Infinity"].contains(&value) {
            Ok(value.to_owned())
        } else {
            Ok(self.digits.format(value)?.formatted_string)
        }
    }

    fn exponent(&self, formatted: &str) -> Result<usize, Error> {
        if self.notation == "compact" && !["NaN", "Infinity", "-Infinity"].contains(&formatted) {
            self.rules
                .compact_exponent(formatted, self.compact_display == "long")
        } else {
            Ok(0)
        }
    }

    /// Input is a ToIntlMathematicalValue result serialized as a decimal string.
    pub fn select(&self, value: &str) -> Result<&'static str, Error> {
        let formatted = self.formatted(value)?;
        self.rules
            .select_rounded(&formatted, self.exponent(&formatted)?, self.ordinal)
    }

    pub fn select_range(&self, start: &str, end: &str) -> Result<&str, Error> {
        // ResolvePluralRange 1–9: reject NaN before resolving either endpoint.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L356-L365
        if start == "NaN" || end == "NaN" {
            return Err(Error::InvalidRange);
        }
        let start = self.formatted(start)?;
        let end = self.formatted(end)?;
        self.rules.select_range_rounded(
            &start,
            &end,
            self.exponent(&start)?,
            self.exponent(&end)?,
            self.ordinal,
        )
    }
}
