use crate::{
    Error, Grouping, NumberFormat, Part,
    data::{Compact, Plurals, PreparedPattern, Unit},
    metadata,
    numeric::Numeric,
    options::digit_error,
};
use icu_properties::{
    CodePointMapData,
    props::{GeneralCategory, GeneralCategoryGroup},
};
use regex::Regex;
use std::{
    borrow::Cow,
    sync::{Arc, LazyLock},
};

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
fn legacy_plan(
    pattern: &str,
    sign: i8,
    approximately: bool,
    compact: bool,
) -> Result<PreparedPattern, Error> {
    let mut pattern = if compact {
        let pattern = signed(pattern, sign, false);
        let pattern = COMPACT_LITERAL.replace_all(&pattern, "{c:$0}");
        let pattern = ZEROS.replacen(&pattern, 1, "0").into_owned();
        if approximately {
            approximate(&pattern, sign)
        } else {
            pattern
        }
    } else {
        signed(pattern, sign, approximately)
    };
    let number = match NUMBER.find(&pattern) {
        Some(number) => number.as_str(),
        None if compact => "0",
        None => return Err(missing("number pattern")),
    };
    let mut groups = number.split('.').next().unwrap().rsplit(',');
    let last = groups.next().unwrap();
    let grouping = match groups.next() {
        None => [3, 3],
        Some(previous) => [
            last.len(),
            if groups.next().is_some() {
                previous.len()
            } else {
                last.len()
            },
        ],
    };
    pattern = NUMBER.replace_all(&pattern, "{0}").into_owned();
    pattern = QUOTED.replace_all(&pattern, "$1").into_owned();
    let mut parts = Vec::new();
    let mut end = 0;
    for token in TOKENS.find_iter(&pattern) {
        if token.start() > end {
            parts.push(("literal".into(), pattern[end..token.start()].into()));
        }
        let (kind, value) = match token.as_str() {
            "{0}" => ("number", ""),
            "{approximatelySign}" => ("approximatelySign", ""),
            "-" => ("minusSign", ""),
            "+" => ("plusSign", ""),
            "%" => ("percentSign", ""),
            "¤" => ("currency", ""),
            token => ("compact", &token[3..token.len() - 1]),
        };
        parts.push((kind.into(), value.into()));
        end = token.end();
    }
    if end < pattern.len() {
        parts.push(("literal".into(), pattern[end..].into()));
    }
    Ok(PreparedPattern {
        plan: grouping.into_iter().chain(0..parts.len()).collect(),
        tokens: parts,
    })
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
            let mut reusable = None;
            // Standard notation keeps exponent zero, so rounding cannot change it.
            if !number.zero() && self.resolved.notation != "standard" {
                let mut preview = number.clone();
                preview.negative = false;
                preview.shift(-exponent)?;
                let text = self
                    .resolved
                    .digits
                    .format_string(&preview.text()?)
                    .map_err(digit_error)?;
                let preview = Numeric::parse(&text)?;
                let preview_exponent = exponent;
                if !preview.zero() && preview.magnitude() != magnitude - exponent {
                    magnitude += 1;
                    exponent = self.exponent(magnitude)?;
                }
                // Negative inputs can use different directed rounding in the final pass.
                if !number.negative && exponent == preview_exponent {
                    reusable = Some((preview, text));
                }
            }
            let (mut rounded, text) = if let Some(result) = reusable {
                result
            } else {
                number.shift(-exponent)?;
                let text = self
                    .resolved
                    .digits
                    .format_string(&number.text()?)
                    .map_err(digit_error)?;
                (Numeric::parse(&text)?, text)
            };
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
    fn mapped<'a>(&self, input: &'a str) -> Result<Cow<'a, str>, Error> {
        if self.resolved.numbering_system == "latn" {
            return Ok(Cow::Borrowed(input));
        }
        let metadata = metadata::load()?;
        let Some(digits) = metadata.digits.get(&self.resolved.numbering_system) else {
            return Ok(Cow::Borrowed(input));
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
        Ok(Cow::Owned(output))
    }
    fn grouped(&self, integer_len: usize, primary: usize, compact: bool) -> bool {
        let grouping = self.resolved.use_grouping;
        let minimum = if grouping == Grouping::Min2 {
            2
        } else {
            self.data.numbers.minimum_grouping_digits
        };
        !compact
            && grouping != Grouping::Disabled
            && (grouping == Grouping::Always || integer_len >= primary.saturating_add(minimum))
    }
    fn visit_number_parts(
        &self,
        number: &Rendered,
        grouping: [usize; 2],
        compact: bool,
        mut visit: impl FnMut(&'static str, Cow<'_, str>),
    ) -> Result<(), Error> {
        if let Some(special) = number.rounded.special {
            visit(
                if special == "NaN" { "nan" } else { "infinity" },
                Cow::Borrowed(&number.text),
            );
            return Ok(());
        }
        let symbols = &self.data.numbers.symbols[&self.system];
        let (integer, fraction) = number
            .text
            .split_once('.')
            .map(|(integer, fraction)| (integer, Some(fraction)))
            .unwrap_or((&number.text, None));
        let [primary, secondary] = grouping;
        if self.grouped(integer.len(), primary, compact) {
            if primary == 0 || secondary == 0 {
                return Err(Error::InvalidData("Empty number grouping interval".into()));
            }
            let leading = integer.len().saturating_sub(primary);
            let first = if leading == 0 {
                integer.len()
            } else {
                1 + (leading - 1) % secondary
            };
            let separator = if self.resolved.style == "currency" {
                symbols.currency_group.as_ref().unwrap_or(&symbols.group)
            } else {
                &symbols.group
            };
            let mut start = 0;
            let mut end = first;
            while start < integer.len() {
                if start != 0 {
                    visit("group", Cow::Borrowed(separator));
                }
                visit("integer", self.mapped(&integer[start..end])?);
                start = end;
                let remaining = integer.len() - start;
                end += if remaining > primary {
                    secondary
                } else {
                    remaining
                };
            }
        } else {
            visit("integer", self.mapped(integer)?);
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
            visit("decimal", Cow::Borrowed(separator));
            visit("fraction", self.mapped(fraction)?);
        }
        if matches!(
            self.resolved.notation.as_str(),
            "scientific" | "engineering"
        ) {
            visit("exponentSeparator", Cow::Borrowed(&symbols.exponential));
            if number.exponent < 0 {
                visit("exponentMinusSign", Cow::Borrowed(&symbols.minus_sign));
            }
            visit(
                "exponentInteger",
                self.mapped(&number.exponent.unsigned_abs().to_string())?,
            );
        }
        Ok(())
    }
    fn number_parts(
        &self,
        number: &Rendered,
        grouping: [usize; 2],
        compact: bool,
    ) -> Result<Vec<Part>, Error> {
        let mut parts = Vec::new();
        self.visit_number_parts(number, grouping, compact, |kind, value| {
            parts.push(Part::new(kind, value));
        })?;
        Ok(parts)
    }
    pub(crate) fn partition(
        &self,
        input: &Numeric,
        approximately: bool,
    ) -> Result<Vec<Part>, Error> {
        let number = self.render(input)?;
        self.partition_rendered(&number, approximately)
    }

    /// Format standard decimal parts and select cardinal rules from the same
    /// rounded value. RelativeTimeFormat uses identical default digit options
    /// for its number and plural formatters.
    pub fn format_decimal_with_plural(
        &self,
        value: &str,
        rules: &formatjs_intl_pluralrules::LocaleRules,
    ) -> Result<(Vec<Part>, &'static str), Error> {
        let (number, category) = self.decimal_with_plural(value, rules)?;
        Ok((self.partition_rendered(&number, false)?, category))
    }

    /// Avoid owned number parts when the consumer only needs text and its plural.
    pub fn format_decimal_string_with_plural(
        &self,
        value: &str,
        rules: &formatjs_intl_pluralrules::LocaleRules,
    ) -> Result<(String, &'static str), Error> {
        let (mut number, category) = self.decimal_with_plural(value, rules)?;
        let standard = self.data.numbers.decimal[&self.system].standard == "#,##0.###";
        if standard
            && self.resolved.numbering_system == "latn"
            && number.sign == 0
            && number.rounded.special.is_none()
        {
            let integer_len = number.text.find('.').unwrap_or(number.text.len());
            // One possible group insertion; larger numbers retain linear traversal.
            if integer_len <= 6 {
                let symbols = &self.data.numbers.symbols[&self.system];
                if integer_len < number.text.len() && symbols.decimal != "." {
                    number
                        .text
                        .replace_range(integer_len..integer_len + 1, &symbols.decimal);
                }
                if integer_len > 3 && self.grouped(integer_len, 3, false) {
                    number
                        .text
                        .reserve(32usize.saturating_sub(number.text.len()));
                    number.text.insert_str(integer_len - 3, &symbols.group);
                }
                return Ok((number.text, category));
            }
        }
        let mut text = String::with_capacity(32);
        if standard {
            let symbols = &self.data.numbers.symbols[&self.system];
            if number.sign < 0 {
                text.push_str(&symbols.minus_sign);
            } else if number.sign > 0 {
                text.push_str(&symbols.plus_sign);
            }
            self.visit_number_parts(&number, [3, 3], false, |_, value| {
                text.push_str(&value);
            })?;
        } else {
            for part in self.partition_rendered(&number, false)? {
                text.push_str(&part.value);
            }
        }
        Ok((text, category))
    }

    fn decimal_with_plural(
        &self,
        value: &str,
        rules: &formatjs_intl_pluralrules::LocaleRules,
    ) -> Result<(Rendered, &'static str), Error> {
        if self.resolved.style != "decimal" || self.resolved.notation != "standard" {
            return Err(Error::Range("Expected standard decimal formatting"));
        }
        let number = self.render(&Numeric::parse(value)?)?;
        let category = rules
            .select_rounded(number.rounded.special.unwrap_or(&number.text), 0, false)
            .map_err(|error| Error::InvalidData(error.to_string()))?;
        Ok((number, category))
    }

    fn partition_rendered(
        &self,
        number: &Rendered,
        approximately: bool,
    ) -> Result<Vec<Part>, Error> {
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
            let mut parts = self.number_parts(number, [3, 3], false)?;
            if number.sign < 0 {
                parts.insert(0, Part::new("minusSign", symbols.minus_sign.clone()));
            } else if number.sign > 0 {
                parts.insert(0, Part::new("plusSign", symbols.plus_sign.clone()));
            }
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
        let pattern = compact.unwrap_or_else(|| match options.style.as_str() {
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
        });
        let index = match number.sign {
            -1 => 1,
            1 => 2,
            _ => 0,
        } + if approximately { 3 } else { 0 };
        let generated = self
            .data
            .numbers
            .pattern_plans
            .as_ref()
            .and_then(|patterns| {
                let table = if compact.is_some() {
                    &patterns.compact
                } else {
                    &patterns.standard
                };
                table
                    .get(pattern)
                    .and_then(|ids| ids.get(index))
                    .and_then(|id| patterns.plans.get(*id))
                    .map(|plan| (plan, patterns.tokens.as_slice()))
            });
        let legacy;
        let (plan, tokens) = match generated {
            Some(plan) => plan,
            None => {
                let key = (
                    pattern.to_owned(),
                    number.sign,
                    approximately,
                    compact.is_some(),
                );
                let cached = self
                    .data
                    .legacy_patterns
                    .read()
                    .map_err(|_| missing("pattern lock"))?
                    .get(&key)
                    .cloned();
                legacy = match cached {
                    Some(plan) => plan,
                    None => {
                        let plan = Arc::new(legacy_plan(
                            pattern,
                            number.sign,
                            approximately,
                            compact.is_some(),
                        )?);
                        self.data
                            .legacy_patterns
                            .write()
                            .map_err(|_| missing("pattern lock"))?
                            .entry(key)
                            .or_insert(plan)
                            .clone()
                    }
                };
                (&legacy.plan, legacy.tokens.as_slice())
            }
        };
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
        let spacing =
            if options.style == "currency" && options.currency_display.as_deref() != Some("name") {
                Some(&self.data.numbers.currency[&self.system].currency_spacing)
            } else {
                None
            };
        let symbol = |value: Option<char>| {
            value.is_some_and(|value| {
                GeneralCategoryGroup::Symbol
                    .contains(CodePointMapData::<GeneralCategory>::new().get(value))
            })
        };
        let before = spacing.filter(|spacing| {
            !spacing.before_insert_between.is_empty() && !symbol(currency_label.chars().next())
        });
        let after = spacing.filter(|spacing| {
            !spacing.after_insert_between.is_empty() && !symbol(currency_label.chars().last())
        });
        let mut inserted_before = false;
        let mut inserted_after = false;
        let mut parts = Vec::new();
        let plan_parts = &plan[2..];
        for (index, id) in plan_parts.iter().enumerate() {
            let (kind, value) = &tokens[*id];
            let part = match kind.as_str() {
                "number" => {
                    parts.extend(self.number_parts(
                        number,
                        [plan[0], plan[1]],
                        compact.is_some(),
                    )?);
                    continue;
                }
                "approximatelySign" => Part::new("approximatelySign", &symbols.approximately_sign),
                "minusSign" => Part::new("minusSign", &symbols.minus_sign),
                "plusSign" => Part::new("plusSign", &symbols.plus_sign),
                "percentSign" => Part::new("percentSign", &symbols.percent_sign),
                "currency" => {
                    if let Some(spacing) = before.filter(|_| {
                        !inserted_before && index > 0 && tokens[plan_parts[index - 1]].0 == "number"
                    }) {
                        parts.push(Part::new("literal", &spacing.before_insert_between));
                        inserted_before = true;
                    }
                    parts.push(Part::new("currency", currency_label));
                    if let Some(spacing) = after.filter(|_| {
                        !inserted_after
                            && plan_parts
                                .get(index + 1)
                                .is_some_and(|id| tokens[*id].0 == "number")
                    }) {
                        parts.push(Part::new("literal", &spacing.after_insert_between));
                        inserted_after = true;
                    }
                    continue;
                }
                "compact" => Part::new("compact", value),
                "literal" => Part::new("literal", value),
                _ => return Err(missing("pattern token")),
            };
            parts.push(part);
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
