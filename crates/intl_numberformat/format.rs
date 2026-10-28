use crate::{
    Error, Grouping, NumberFormat, Part,
    data::{Compact, Plurals, Unit},
    metadata,
    numeric::Numeric,
    options::digit_error,
};
use icu_properties::{
    CodePointMapData,
    props::{GeneralCategory, GeneralCategoryGroup},
};
use regex::Regex;
use std::sync::LazyLock;

static NUMBER: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"[#0](?:[.,][#0]+)*").unwrap());
static QUOTED: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"'(.)'").unwrap());
static TOKENS: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\{c:[^}]+\}|\{approximatelySign\}|\{0\}|[¤%+\-]").unwrap());
static COMPACT_LITERAL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"[^\s;+\-0-9¤]+").unwrap());
static ZEROS: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"0+").unwrap());
static UNIT_SLOT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s*\{0\}\s*").unwrap());
static CURRENCY_SLOT: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\{[01]\}").unwrap());

struct Rendered {
    rounded: Numeric,
    text: String,
    exponent: i64,
    magnitude: i64,
    sign: i8,
}
fn missing(name: &str) -> Error {
    Error::InvalidData(format!("Missing number data: {name}"))
}
fn approximate(pattern: &str, sign: i8) -> String {
    let position = if sign == 0 {
        None
    } else {
        pattern.find(if sign > 0 { '+' } else { '-' })
    };
    match position {
        Some(position) => format!(
            "{}{{approximatelySign}}{}",
            &pattern[..position],
            &pattern[position..]
        ),
        None => format!("{{approximatelySign}}{pattern}"),
    }
}
fn signed(pattern: &str, sign: i8, approximately: bool) -> String {
    let (positive, negative) = pattern
        .split_once(';')
        .map(|(a, b)| (a.to_owned(), b.split(';').next().unwrap().to_owned()))
        .unwrap_or_else(|| (pattern.to_owned(), format!("-{pattern}")));
    if sign == 0 && approximately && negative.contains('-') {
        return negative.replacen('-', "{approximatelySign}", 1);
    }
    let result = match sign {
        -1 => negative,
        1 => {
            if negative.contains('-') {
                negative.replace('-', "+")
            } else {
                format!("+{positive}")
            }
        }
        _ => positive,
    };
    if approximately {
        approximate(&result, sign)
    } else {
        result
    }
}
fn unit_forms<'a>(unit: &'a Unit, style: &str) -> &'a Plurals {
    match style {
        "long" => &unit.long,
        "narrow" => &unit.narrow,
        _ => &unit.short,
    }
}

impl NumberFormat {
    fn compact_map(&self) -> Result<&Compact, Error> {
        let options = &self.resolved;
        if options.style == "currency" && options.currency_display.as_deref() != Some("name") {
            Ok(&self
                .data
                .numbers
                .currency
                .get(&self.system)
                .ok_or_else(|| missing("currency"))?
                .short)
        } else {
            let decimal = self
                .data
                .numbers
                .decimal
                .get(&self.system)
                .ok_or_else(|| missing("decimal"))?;
            Ok(if options.compact_display.as_deref() == Some("long") {
                &decimal.long
            } else {
                &decimal.short
            })
        }
    }
    fn compact_rules(&self, magnitude: i64) -> Result<Option<&Plurals>, Error> {
        if magnitude < 0 {
            return Ok(None);
        }
        let map = self.compact_map()?;
        let Some((largest, rules)) = map.last_key_value() else {
            return Ok(None);
        };
        if magnitude > largest.len() as i64 - 1 {
            return Ok(Some(rules));
        }
        Ok(map
            .iter()
            .find(|(key, _)| key.len() as i64 - 1 == magnitude)
            .map(|(_, rules)| rules))
    }
    fn exponent(&self, magnitude: i64) -> Result<i64, Error> {
        Ok(match self.resolved.notation.as_str() {
            "scientific" => magnitude,
            "engineering" => magnitude.div_euclid(3) * 3,
            "compact" => {
                let map = self.compact_map()?;
                let Some(rules) = self.compact_rules(magnitude)? else {
                    return Ok(0);
                };
                let pattern = rules.get("other").ok_or_else(|| missing("compact other"))?;
                if pattern == "0" {
                    return Ok(0);
                }
                let zeros = ZEROS
                    .find(pattern)
                    .ok_or_else(|| missing("compact zero"))?
                    .len();
                let maximum = map
                    .last_key_value()
                    .map(|(key, _)| key.len() as i64 - 1)
                    .unwrap_or(magnitude);
                magnitude.min(maximum) - zeros as i64 + 1
            }
            _ => 0,
        })
    }
    fn category(&self, value: &Numeric) -> Result<&'static str, Error> {
        if value.special.is_some() {
            return Ok("other");
        }
        // TS's internal PluralRules takes Number, even for a BigInt formatting
        // input. Keep that conversion here; decimal rounding itself stays exact.
        let number = value
            .text()?
            .parse::<f64>()
            .map_err(|_| Error::Range("value"))?;
        if !number.is_finite() {
            return Ok("other");
        }
        let rounded = self
            .plural_digits
            .format_string(&number.to_string())
            .map_err(digit_error)?;
        self.data
            .plurals
            .select_rounded(&rounded, 0, false)
            .map_err(|error| Error::InvalidData(error.to_string()))
    }
    fn select<'a>(&self, value: &Numeric, rules: &'a Plurals) -> Result<&'a str, Error> {
        rules
            .get(self.category(value)?)
            .or_else(|| rules.get("other"))
            .map(String::as_str)
            .ok_or_else(|| missing("plural other"))
    }
    fn render(&self, input: &Numeric) -> Result<Rendered, Error> {
        let symbols = self
            .data
            .numbers
            .symbols
            .get(&self.system)
            .ok_or_else(|| missing("symbols"))?;
        let (rounded, text, exponent, magnitude) = if let Some(special) = input.special {
            (
                input.clone(),
                if special == "NaN" {
                    symbols.nan.clone()
                } else {
                    symbols.infinity.clone()
                },
                0,
                0,
            )
        } else {
            let mut number = input.clone();
            if self.resolved.style == "percent" {
                number.shift(2)?;
            }
            let mut magnitude = number.magnitude();
            let mut exponent = if number.zero() {
                0
            } else {
                self.exponent(magnitude)?
            };
            if !number.zero() {
                let mut preview = number.clone();
                preview.negative = false;
                preview.shift(-exponent)?;
                let preview = Numeric::parse(
                    &self
                        .resolved
                        .digits
                        .format_string(&preview.text()?)
                        .map_err(digit_error)?,
                )?;
                if !preview.zero() && preview.magnitude() != magnitude - exponent {
                    magnitude += 1;
                    exponent = self.exponent(magnitude)?;
                }
            }
            number.shift(-exponent)?;
            let text = self
                .resolved
                .digits
                .format_string(&number.text()?)
                .map_err(digit_error)?;
            let mut rounded = Numeric::parse(&text)?;
            rounded.negative = input.negative;
            (rounded, text, exponent, magnitude)
        };
        let nan = rounded.special == Some("NaN");
        let sign = match self.resolved.sign_display.as_str() {
            "never" => 0,
            "always" => {
                if rounded.negative && !nan {
                    -1
                } else {
                    1
                }
            }
            "exceptZero" => {
                if nan || rounded.zero() {
                    0
                } else if rounded.negative {
                    -1
                } else {
                    1
                }
            }
            "negative" => {
                if rounded.negative && !rounded.zero() && !nan {
                    -1
                } else {
                    0
                }
            }
            _ => {
                if rounded.negative && !nan {
                    -1
                } else {
                    0
                }
            }
        };
        Ok(Rendered {
            rounded,
            text,
            exponent,
            magnitude,
            sign,
        })
    }
    fn mapped(&self, input: &str) -> Result<String, Error> {
        let metadata = metadata::load()?;
        let Some(digits) = metadata.digits.get(&self.resolved.numbering_system) else {
            return Ok(input.to_owned());
        };
        let mut output = String::new();
        for value in input.chars() {
            if let Some(digit) = value
                .to_digit(10)
                .and_then(|index| digits.get(index as usize))
            {
                output.push_str(digit);
            } else {
                output.push(value);
            }
        }
        Ok(output)
    }
    fn number_parts(
        &self,
        number: &Rendered,
        pattern: &str,
        compact: bool,
    ) -> Result<Vec<Part>, Error> {
        if let Some(special) = number.rounded.special {
            return Ok(vec![Part::new(
                if special == "NaN" { "nan" } else { "infinity" },
                number.text.clone(),
            )]);
        }
        let symbols = &self.data.numbers.symbols[&self.system];
        let (integer, fraction) = number
            .text
            .split_once('.')
            .map(|(integer, fraction)| (integer, Some(fraction)))
            .unwrap_or((&number.text, None));
        let groups: Vec<_> = pattern.split('.').next().unwrap().split(',').collect();
        let primary = if groups.len() > 1 {
            groups.last().unwrap().len()
        } else {
            3
        };
        let secondary = if groups.len() > 2 {
            groups[groups.len() - 2].len()
        } else {
            primary
        };
        let grouping = self.resolved.use_grouping;
        let minimum = if grouping == Grouping::Min2 {
            2
        } else {
            self.data.numbers.minimum_grouping_digits
        };
        let grouped = !compact
            && grouping != Grouping::Disabled
            && (grouping == Grouping::Always || integer.len() >= primary + minimum);
        let mut parts = Vec::new();
        if grouped {
            let mut chunks = Vec::new();
            let mut end = integer.len();
            let mut size = primary;
            while end > 0 {
                let start = end.saturating_sub(size);
                chunks.push(&integer[start..end]);
                end = start;
                size = secondary;
            }
            let separator = if self.resolved.style == "currency" {
                symbols.currency_group.as_ref().unwrap_or(&symbols.group)
            } else {
                &symbols.group
            };
            for (index, chunk) in chunks.iter().rev().enumerate() {
                if index > 0 {
                    parts.push(Part::new("group", separator.clone()));
                }
                parts.push(Part::new("integer", self.mapped(chunk)?));
            }
        } else {
            parts.push(Part::new("integer", self.mapped(integer)?));
        }
        if let Some(fraction) = fraction {
            let separator = if self.resolved.style == "currency" {
                symbols
                    .currency_decimal
                    .as_ref()
                    .unwrap_or(&symbols.decimal)
            } else {
                &symbols.decimal
            };
            parts.push(Part::new("decimal", separator.clone()));
            parts.push(Part::new("fraction", self.mapped(fraction)?));
        }
        if matches!(
            self.resolved.notation.as_str(),
            "scientific" | "engineering"
        ) {
            parts.push(Part::new("exponentSeparator", symbols.exponential.clone()));
            if number.exponent < 0 {
                parts.push(Part::new("exponentMinusSign", symbols.minus_sign.clone()));
            }
            parts.push(Part::new(
                "exponentInteger",
                self.mapped(&number.exponent.unsigned_abs().to_string())?,
            ));
        }
        Ok(parts)
    }
    pub(crate) fn partition(
        &self,
        input: &Numeric,
        approximately: bool,
    ) -> Result<Vec<Part>, Error> {
        let number = self.render(input)?;
        let options = &self.resolved;
        let symbols = &self.data.numbers.symbols[&self.system];
        let approximately = approximately && !symbols.approximately_sign.is_empty();
        // This CLDR pattern has only a number slot. Skip pattern tokenization;
        // rounding, grouping, digit mapping and sign choice still use common code.
        if !approximately
            && options.style == "decimal"
            && options.notation == "standard"
            && self.data.numbers.decimal[&self.system].standard == "#,##0.###"
        {
            let mut parts = Vec::new();
            if number.sign < 0 {
                parts.push(Part::new("minusSign", symbols.minus_sign.clone()));
            } else if number.sign > 0 {
                parts.push(Part::new("plusSign", symbols.plus_sign.clone()));
            }
            parts.extend(self.number_parts(&number, "#,##0.###", false)?);
            return Ok(parts);
        }
        let compact = if options.notation == "compact" && number.magnitude != 0 {
            self.compact_rules(number.magnitude)?
                .map(|rules| self.select(&number.rounded, rules))
                .transpose()?
                .filter(|pattern| *pattern != "0")
        } else {
            None
        };
        let mut pattern = if let Some(compact) = compact {
            let pattern = signed(compact, number.sign, false);
            let pattern = COMPACT_LITERAL.replace_all(&pattern, "{c:$0}");
            let pattern = ZEROS.replacen(&pattern, 1, "0").into_owned();
            if approximately {
                approximate(&pattern, number.sign)
            } else {
                pattern
            }
        } else {
            let pattern = match options.style.as_str() {
                "currency" if options.currency_display.as_deref() != Some("name") => {
                    let data = &self.data.numbers.currency[&self.system];
                    if options.currency_sign.as_deref() == Some("accounting") {
                        &data.accounting
                    } else {
                        &data.standard
                    }
                }
                "percent" => &self.data.numbers.percent[&self.system],
                _ => &self.data.numbers.decimal[&self.system].standard,
            };
            signed(pattern, number.sign, approximately)
        };
        let decimal_pattern = NUMBER
            .find(&pattern)
            .ok_or_else(|| missing("number pattern"))?
            .as_str()
            .to_owned();
        pattern = NUMBER.replace_all(&pattern, "{0}").into_owned();
        pattern = QUOTED.replace_all(&pattern, "$1").into_owned();
        let currency_code = options.currency.as_deref().unwrap_or("");
        let currency = self.data.currencies.get(currency_code);
        let currency_label = match options.currency_display.as_deref() {
            Some("code") => currency_code,
            Some("symbol") => currency
                .map(|value| value.symbol.as_str())
                .unwrap_or(currency_code),
            _ => currency
                .map(|value| value.narrow.as_str())
                .unwrap_or(currency_code),
        };
        if options.style == "currency" && options.currency_display.as_deref() != Some("name") {
            let spacing = &self.data.numbers.currency[&self.system].currency_spacing;
            let symbol = |value: Option<char>| {
                value.is_some_and(|value| {
                    GeneralCategoryGroup::Symbol
                        .contains(CodePointMapData::<GeneralCategory>::new().get(value))
                })
            };
            if !spacing.after_insert_between.is_empty() && !symbol(currency_label.chars().last()) {
                pattern = pattern.replacen(
                    "¤{0}",
                    &format!("¤{}{{0}}", spacing.after_insert_between),
                    1,
                );
            }
            if !spacing.before_insert_between.is_empty() && !symbol(currency_label.chars().next()) {
                pattern = pattern.replacen(
                    "{0}¤",
                    &format!("{{0}}{}¤", spacing.before_insert_between),
                    1,
                );
            }
        }
        let mut parts = Vec::new();
        let mut end = 0;
        for token in TOKENS.find_iter(&pattern) {
            if token.start() > end {
                parts.push(Part::new("literal", &pattern[end..token.start()]));
            }
            let part = match token.as_str() {
                "{0}" => {
                    parts.extend(self.number_parts(
                        &number,
                        &decimal_pattern,
                        compact.is_some(),
                    )?);
                    end = token.end();
                    continue;
                }
                "{approximatelySign}" => {
                    Part::new("approximatelySign", symbols.approximately_sign.clone())
                }
                "-" => Part::new("minusSign", symbols.minus_sign.clone()),
                "+" => Part::new("plusSign", symbols.plus_sign.clone()),
                "%" => Part::new("percentSign", symbols.percent_sign.clone()),
                "¤" => Part::new("currency", currency_label),
                token => Part::new("compact", &token[3..token.len() - 1]),
            };
            parts.push(part);
            end = token.end();
        }
        if end < pattern.len() {
            parts.push(Part::new("literal", &pattern[end..]));
        }
        let mut expanded = number.rounded.clone();
        expanded.shift(number.exponent)?;
        if options.style == "currency" && options.currency_display.as_deref() == Some("name") {
            let label = match currency {
                Some(currency) => currency
                    .display_name
                    .get(self.category(&expanded)?)
                    .or_else(|| currency.display_name.get("other"))
                    .filter(|name| !name.is_empty())
                    .map(String::as_str)
                    .unwrap_or(currency_code),
                None => currency_code,
            };
            let pattern = &self.data.numbers.currency[&self.system].unit_pattern;
            let mut output = Vec::new();
            let mut end = 0;
            for token in CURRENCY_SLOT.find_iter(pattern) {
                if token.start() > end {
                    output.push(Part::new("literal", &pattern[end..token.start()]));
                }
                if token.as_str() == "{0}" {
                    output.extend(parts.iter().cloned());
                } else {
                    output.push(Part::new("currency", label));
                }
                end = token.end();
            }
            if end < pattern.len() {
                output.push(Part::new("literal", &pattern[end..]));
            }
            return Ok(output);
        }
        if options.style == "unit" {
            let units = self.data.units.read().map_err(|_| missing("unit lock"))?;
            let unit = options.unit.as_deref().unwrap();
            let style = options.unit_display.as_deref().unwrap();
            let pattern = if let Some(unit) = units.simple.get(unit) {
                self.select(&expanded, unit_forms(unit, style))?.to_owned()
            } else {
                let (numerator, denominator) = unit
                    .split_once("-per-")
                    .ok_or_else(|| missing("compound unit"))?;
                let numerator = self.select(
                    &expanded,
                    unit_forms(
                        units
                            .simple
                            .get(numerator)
                            .ok_or_else(|| missing(numerator))?,
                        style,
                    ),
                )?;
                let denominator = units
                    .simple
                    .get(denominator)
                    .ok_or_else(|| missing(denominator))?;
                if let Some(per) = denominator.per_unit.get(style) {
                    per.replacen("{0}", numerator, 1)
                } else {
                    let per = units
                        .compound
                        .get("per")
                        .and_then(|per| per.get(style))
                        .ok_or_else(|| missing("per"))?;
                    let denominator = self
                        .select(&Numeric::parse("1")?, unit_forms(denominator, style))?
                        .replacen("{0}", "", 1);
                    per.replacen("{0}", numerator, 1)
                        .replacen("{1}", &denominator, 1)
                }
            };
            let mut output = Vec::new();
            let mut end = 0;
            for token in UNIT_SLOT.find_iter(&pattern) {
                if token.start() > end {
                    output.push(Part::new("unit", &pattern[end..token.start()]));
                }
                let slot = token.as_str();
                let index = slot.find("{0}").unwrap();
                if index > 0 {
                    output.push(Part::new("literal", &slot[..index]));
                }
                output.extend(parts.iter().cloned());
                if index + 3 < slot.len() {
                    output.push(Part::new("literal", &slot[index + 3..]));
                }
                end = token.end();
            }
            if end < pattern.len() {
                output.push(Part::new("unit", &pattern[end..]));
            }
            return Ok(output);
        }
        Ok(parts)
    }
}
