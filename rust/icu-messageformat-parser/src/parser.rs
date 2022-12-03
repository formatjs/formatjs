use crate::ast::{self, *};
use crate::intl::date_time_format_options::JsIntlDateTimeFormatOptions;
use crate::intl::number_format_options::JsIntlNumberFormatOptions;
use crate::intl::options::{
    CompactDisplay, DateTimeDisplayFormat, DateTimeMonthDisplayFormat, HourCycle, Notation,
    NumberFormatOptionsCurrencyDisplay, NumberFormatOptionsCurrencySign,
    NumberFormatOptionsRoundingPriority, NumberFormatOptionsSignDisplay, NumberFormatOptionsStyle,
    NumberFormatOptionsTrailingZeroDisplay, TimeZoneNameFormat, UnitDisplay,
};
use crate::pattern_syntax::is_pattern_syntax;
use langtag::LanguageTag;
use once_cell::sync::Lazy;
use regex::Regex as Regexp;
use serde::{Deserialize, Serialize};
use std::cell::Cell;
use std::cmp;
use std::collections::HashSet;
use std::result;
#[cfg(feature = "utf16")]
use widestring::{Utf16Str, Utf16String};

type Result<T> = result::Result<T, ast::Error>;

pub static FRACTION_PRECISION_REGEX: Lazy<Regexp> =
    Lazy::new(|| Regexp::new(r"^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$").unwrap());
pub static SIGNIFICANT_PRECISION_REGEX: Lazy<Regexp> =
    Lazy::new(|| Regexp::new(r"^(@+)?(\+|#+)?[rs]?$").unwrap());
pub static INTEGER_WIDTH_REGEX: Lazy<Regexp> =
    Lazy::new(|| Regexp::new(r"(\*)(0+)|(#+)(0+)|(0+)").unwrap());
pub static CONCISE_INTEGER_WIDTH_REGEX: Lazy<Regexp> =
    Lazy::new(|| Regexp::new(r"^(0+)$").unwrap());

/// https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
/// Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
/// with some tweaks
/// TODO: This is incomplete
pub static DATE_TIME_REGEX: Lazy<Regexp> = Lazy::new(|| {
    Regexp::new(r"(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})").unwrap()
});

#[derive(Clone, Debug)]
pub struct Parser<'s> {
    position: Cell<Position>,
    message: &'s str,
    options: ParserOptions,
    #[cfg(feature = "utf16")]
    message_utf16: Utf16String,
}

#[derive(Default, Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserOptions {
    /// Whether to treat HTML/XML tags as string literal
    /// instead of parsing them as tag token.
    /// When this is false we only allow simple tags without
    /// any attributes
    #[serde(default)]
    pub ignore_tag: bool,

    /// Should `select`, `selectordinal`, and `plural` arguments always include
    /// the `other` case clause.
    #[serde(default)]
    pub requires_other_clause: bool,

    /// Whether to parse number/datetime skeleton
    /// into Intl.NumberFormatOptions and Intl.DateTimeFormatOptions, respectively
    #[serde(default)]
    pub should_parse_skeletons: bool,

    /// Capture location info in AST
    /// Default is false
    #[serde(default)]
    pub capture_location: bool,

    /// Instance of Intl.Locale to resolve locale-dependent skeleton
    #[serde(default)]
    pub locale: Option<String>,
}

impl ParserOptions {
    pub fn new(
        ignore_tag: bool,
        requires_other_clause: bool,
        should_parse_skeletons: bool,
        capture_location: bool,
        locale: Option<String>,
    ) -> Self {
        ParserOptions {
            ignore_tag,
            requires_other_clause,
            should_parse_skeletons,
            capture_location,
            locale,
        }
    }
}

fn is_whitespace(ch: char) -> bool {
    ch.is_whitespace() || ch == '\u{200e}' || ch == '\u{200f}'
}

fn is_alpha(ch: Option<char>) -> bool {
    if let Some(ch) = ch {
        matches!(ch, 'a'..='z' | 'A'..='Z')
    } else {
        false
    }
}

fn get_default_hour_symbol_from_locale(locale: &str) -> char {
    let language_tag = LanguageTag::parse(locale).expect("Should able to parse locale tag");

    // There's no built in Intl.Locale, manually read through extensions for the values we need to read
    for extension in language_tag.extensions() {
        //TODO: locale.hourCycles support is missing

        let hour_cycle = if extension.singleton() as char == 'u' {
            let mut ret = None;
            let mut ext_iter = extension.iter();
            loop {
                let ext = ext_iter.next();

                if let Some(ext) = ext {
                    if ext == "hc" {
                        let hour_cycle = ext_iter.next().expect("Should have hour cycle");
                        ret = match hour_cycle.as_str() {
                            "h11" => Some(HourCycle::H11),
                            "h12" => Some(HourCycle::H12),
                            "h23" => Some(HourCycle::H23),
                            "h24" => Some(HourCycle::H24),
                            _ => None,
                        };
                    }
                } else {
                    break;
                }
            }
            ret
        } else {
            None
        };

        if let Some(hour_cycle) = hour_cycle {
            return match hour_cycle {
                HourCycle::H11 => 'K',
                HourCycle::H12 => 'h',
                HourCycle::H23 => 'H',
                HourCycle::H24 => 'k',
            };
        }

        //TODO: locale.language data generation
    }

    panic!("Should have hour cycle");
}

fn get_best_pattern(skeleton: &str, locale: &str) -> String {
    let mut ret = "".to_string();

    let skeleton_chars: Vec<_> = skeleton.chars().collect();
    let skeleton_char_len = skeleton_chars.len();
    let mut extra_len = 0;

    for (pattern_pos, pattern_char) in skeleton.chars().enumerate() {
        if pattern_char == 'j' {
            if pattern_pos + 1 < skeleton_char_len
                && skeleton_chars[pattern_pos + 1] == pattern_char
            {
                extra_len += 1;
                continue;
            } else {
                let mut hour_len = 1 + (extra_len & 1);
                let mut day_period_len = if extra_len < 2 {
                    1
                } else {
                    3 + (extra_len >> 1)
                };
                let day_period_char = 'a';
                let hour_char = get_default_hour_symbol_from_locale(locale);

                if hour_char == 'H' || hour_char == 'k' {
                    day_period_len = 0;
                }

                while day_period_len > 0 {
                    ret = format!("{}{}", ret, day_period_char);
                    day_period_len -= 1;
                }

                while hour_len > 0 {
                    ret = format!("{}{}", hour_char, ret);
                    hour_len -= 1;
                }
            }
        } else if pattern_char == 'J' {
            ret = format!("{}H", ret);
        } else {
            ret = format!("{}{}", ret, pattern_char);
        }
    }

    ret
}

fn parse_date_time_skeleton(skeleton: &str) -> JsIntlDateTimeFormatOptions {
    let mut ret = JsIntlDateTimeFormatOptions::default();

    for caps in DATE_TIME_REGEX.captures_iter(skeleton) {
        let match_str = caps.get(0).map(|m| m.as_str()).unwrap_or_default();
        let match_len = match_str.len();

        match &match_str.chars().next().unwrap_or_default() {
            // Era
            'G' => {
                if match_len == 4 {
                    ret.era = Some(UnitDisplay::Long);
                } else if match_len == 5 {
                    ret.era = Some(UnitDisplay::Narrow);
                } else {
                    ret.era = Some(UnitDisplay::Short);
                }
            }
            // Year
            'y' => {
                if match_len == 2 {
                    ret.year = Some(DateTimeDisplayFormat::TwoDigit);
                } else {
                    ret.year = Some(DateTimeDisplayFormat::Numeric);
                }
            }
            'Y' | 'u' | 'U' | 'r' => {
                panic!("`Y/u/U/r` (year) patterns are not supported, use `y` instead");
            }
            // Quarter
            'q' | 'Q' => {
                panic!("`q/Q` (quarter) patterns are not supported");
            }
            // Month
            'M' | 'L' => {
                if match_len == 1 {
                    ret.month = Some(DateTimeMonthDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.month = Some(DateTimeMonthDisplayFormat::TwoDigit);
                } else if match_len == 3 {
                    ret.month = Some(DateTimeMonthDisplayFormat::Short);
                } else if match_len == 4 {
                    ret.month = Some(DateTimeMonthDisplayFormat::Long);
                } else if match_len == 5 {
                    ret.month = Some(DateTimeMonthDisplayFormat::Narrow);
                }
            }
            // Week
            'w' | 'W' => {
                panic!("`w/W` (week) patterns are not supported");
            }
            'd' => {
                if match_len == 1 {
                    ret.day = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.day = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'D' | 'F' | 'g' => {
                panic!("`D/F/g` (day) patterns are not supported, use `d` instead");
            }
            'E' => {
                if match_len == 4 {
                    ret.weekday = Some(UnitDisplay::Short);
                } else if match_len == 5 {
                    ret.weekday = Some(UnitDisplay::Narrow);
                } else {
                    ret.weekday = Some(UnitDisplay::Short);
                }
            }
            'e' => {
                if match_len < 4 {
                    panic!("`e..eee` (weekday) patterns are not supported");
                }

                if match_len == 4 {
                    ret.weekday = Some(UnitDisplay::Short);
                } else if match_len == 5 {
                    ret.weekday = Some(UnitDisplay::Long);
                } else if match_len == 6 {
                    ret.weekday = Some(UnitDisplay::Narrow);
                } else if match_len == 7 {
                    ret.weekday = Some(UnitDisplay::Short);
                }
            }
            'c' => {
                if match_len < 4 {
                    panic!("`c..ccc` (weekday) patterns are not supported");
                }

                if match_len == 4 {
                    ret.weekday = Some(UnitDisplay::Short);
                } else if match_len == 5 {
                    ret.weekday = Some(UnitDisplay::Long);
                } else if match_len == 6 {
                    ret.weekday = Some(UnitDisplay::Narrow);
                } else if match_len == 7 {
                    ret.weekday = Some(UnitDisplay::Short);
                }
            }
            // Period
            'a' => {
                // AM, PM
                ret.hour12 = Some(true)
            }
            'b' /*  am, pm, noon, midnight*/ | 'B' /*  flexible day periods */ => {
                panic!("`b/B` (period) patterns are not supported, use `a` instead");
            }
            //Hour
            'h' => {
                ret.hour_cycle = Some(HourCycle::H12);
                if match_len == 1 {
                    ret.hour = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.hour = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'H' => {
                ret.hour_cycle = Some(HourCycle::H23);
                if match_len == 1 {
                    ret.hour = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.hour = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'K' => {
                ret.hour_cycle = Some(HourCycle::H11);
                if match_len == 1 {
                    ret.hour = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.hour = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'k' => {
                ret.hour_cycle = Some(HourCycle::H24);
                if match_len == 1 {
                    ret.hour = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.hour = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'j' | 'J' | 'C' => {
                panic!("`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead");
            }
            // Minute
            'm' => {
                if match_len == 1 {
                    ret.minute = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.minute = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            // Second
            's' => {
                if match_len == 1 {
                    ret.second = Some(DateTimeDisplayFormat::Numeric);
                } else if match_len == 2 {
                    ret.second = Some(DateTimeDisplayFormat::TwoDigit);
                }
            }
            'S' | 'A' => { panic!("`S/A` (second) patterns are not supported, use `s` instead'"); }
            // Zone
            'z' => {
                // 1..3, 4: specific non-location format
                ret.time_zone_name = if match_len < 4 { Some(TimeZoneNameFormat::Short) } else {
                    Some(TimeZoneNameFormat::Long)
                };
            }
            'Z' /* 1..3, 4, 5: The ISO8601 varios formats */ |
            'O' /* 1, 4: miliseconds in day short, long */ |
            'v' /* 1, 4: generic non-location format */ |
            'V' /* 1, 2, 3, 4: time zone ID or city */ |
            'X' /* 1, 2, 3, 4: The ISO8601 varios formats */ |
            'x' /* 1, 2, 3, 4: The ISO8601 varios formats */ => {
                panic!("`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead'");
            }
            _ => {}
        }
    }

    ret
}

fn icu_unit_to_ecma(value: &str) -> Option<String> {
    Some(
        Regexp::new(r"^(.*?)-")
            .unwrap()
            .replace(value, "")
            .to_string(),
    )
}

fn parse_significant_precision(ret: &mut JsIntlNumberFormatOptions, value: &str) {
    if let Some(l) = value.chars().last() {
        if l == 'r' {
            ret.rounding_priority = Some(NumberFormatOptionsRoundingPriority::MorePrecision);
        } else if l == 's' {
            ret.rounding_priority = Some(NumberFormatOptionsRoundingPriority::LessPrecision);
        }
    }

    let cap = SIGNIFICANT_PRECISION_REGEX.captures(value);
    if let Some(cap) = cap {
        let g1 = cap.get(1);
        let g2 = cap.get(2);

        let g1_len = g1.map(|g| g.as_str().len() as u32);
        let is_g2_non_str = g2.is_none()
            || g2
                .map(|g| g.as_str().parse::<u32>().is_ok())
                .unwrap_or(false);

        // @@@ case
        if is_g2_non_str {
            ret.minimum_significant_digits = g1_len;
            ret.maximum_significant_digits = g1_len;
        }
        // @@@+ case
        else if g2.map(|g| g.as_str() == "+").unwrap_or(false) {
            ret.minimum_significant_digits = g1_len;
        }
        // .### case
        else if g1.map(|g| g.as_str().starts_with("#")).unwrap_or(false) {
            ret.maximum_significant_digits = g1_len;
        }
        // .@@## or .@@@ case
        else {
            ret.minimum_significant_digits = g1_len;
            ret.maximum_significant_digits =
                g1_len.map(|l| l + g2.map(|g| g.as_str().len() as u32).unwrap_or(0));
        }
    }
}

fn parse_sign(ret: &mut JsIntlNumberFormatOptions, value: &str) {
    match value {
        "sign-auto" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::Auto);
        }
        "sign-accounting" | "()" => {
            ret.currency_sign = Some(NumberFormatOptionsCurrencySign::Accounting);
        }
        "sign-always" | "+!" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::Always);
        }
        "sign-accounting-always" | "()!" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::Always);
            ret.currency_sign = Some(NumberFormatOptionsCurrencySign::Accounting);
        }
        "sign-except-zero" | "+?" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::ExceptZero);
        }
        "sign-accounting-except-zero" | "()?" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::ExceptZero);
            ret.currency_sign = Some(NumberFormatOptionsCurrencySign::Accounting);
        }
        "sign-never" | "+_" => {
            ret.sign_display = Some(NumberFormatOptionsSignDisplay::Never);
        }
        _ => {}
    }
}

fn parse_concise_scientific_and_engineering_stem(ret: &mut JsIntlNumberFormatOptions, stem: &str) {
    let mut stem = stem;
    let mut has_sign = false;
    if stem.starts_with("EE") {
        ret.notation = Some(Notation::Engineering);
        stem = &stem[2..];
        has_sign = true;
    } else if stem.starts_with("E") {
        ret.notation = Some(Notation::Scientific);
        stem = &stem[1..];
        has_sign = true;
    }

    if has_sign {
        let sign_display = &stem[0..2];
        match sign_display {
            "+!" => {
                ret.sign_display = Some(NumberFormatOptionsSignDisplay::Always);
                stem = &stem[2..];
            }
            "+?" => {
                ret.sign_display = Some(NumberFormatOptionsSignDisplay::ExceptZero);
                stem = &stem[2..];
            }
            _ => {}
        }

        if !CONCISE_INTEGER_WIDTH_REGEX.is_match(stem) {
            panic!("Malformed concise eng/scientific notation");
        }

        ret.minimum_integer_digits = Some(stem.len() as u32);
    }
}

fn parse_number_skeleton(skeleton: &Vec<NumberSkeletonToken>) -> JsIntlNumberFormatOptions {
    let mut ret = JsIntlNumberFormatOptions::default();
    for token in skeleton {
        match token.stem {
            "percent" | "%" => {
                ret.style = Some(NumberFormatOptionsStyle::Percent);
                continue;
            }
            "%x100" => {
                ret.style = Some(NumberFormatOptionsStyle::Percent);
                ret.scale = Some(100.0);
                continue;
            }
            "currency" => {
                ret.style = Some(NumberFormatOptionsStyle::Currency);
                ret.currency = Some(token.options[0].to_string());
                continue;
            }
            "group-off" | ",_" => {
                ret.use_grouping = Some(false);
                continue;
            }
            "precision-integer" | "." => {
                ret.maximum_fraction_digits = Some(0);
                continue;
            }
            "measure-unit" | "unit" => {
                ret.style = Some(NumberFormatOptionsStyle::Unit);
                ret.unit = icu_unit_to_ecma(token.options[0]);
                continue;
            }
            "compact-short" | "K" => {
                ret.notation = Some(Notation::Compact);
                ret.compact_display = Some(CompactDisplay::Short);
                continue;
            }
            "compact-long" | "KK" => {
                ret.notation = Some(Notation::Compact);
                ret.compact_display = Some(CompactDisplay::Long);
                continue;
            }
            "scientific" => {
                ret.notation = Some(Notation::Scientific);
                for opt in &token.options {
                    parse_sign(&mut ret, opt);
                }
                continue;
            }
            "engineering" => {
                ret.notation = Some(Notation::Engineering);
                for opt in &token.options {
                    parse_sign(&mut ret, opt);
                }
                continue;
            }
            "notation-simple" => {
                ret.notation = Some(Notation::Standard);
                continue;
            }
            // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
            "unit-width-narrow" => {
                ret.currency_display = Some(NumberFormatOptionsCurrencyDisplay::NarrowSymbol);
                ret.unit_display = Some(UnitDisplay::Narrow);
                continue;
            }
            "unit-width-short" => {
                ret.currency_display = Some(NumberFormatOptionsCurrencyDisplay::Code);
                ret.unit_display = Some(UnitDisplay::Short);
                continue;
            }
            "unit-width-full-name" => {
                ret.currency_display = Some(NumberFormatOptionsCurrencyDisplay::Name);
                ret.unit_display = Some(UnitDisplay::Long);
                continue;
            }
            "unit-width-iso-code" => {
                ret.currency_display = Some(NumberFormatOptionsCurrencyDisplay::Symbol);
                continue;
            }
            "scale" => {
                ret.scale = token.options[0].parse().ok();
                continue;
            }
            "integer-width" => {
                let cap = INTEGER_WIDTH_REGEX.captures(token.options[0]);
                if let Some(cap) = cap {
                    if cap.get(1).is_some() {
                        ret.minimum_integer_digits = cap.get(2).map(|c| c.as_str().len() as u32);
                    } else if cap.get(3).is_some() && cap.get(4).is_some() {
                        panic!("We currently do not support maximum integer digits");
                    } else if cap.get(5).is_some() {
                        panic!("We currently do not support exact integer digits");
                    }
                }
                continue;
            }
            _ => {
                //noop
            }
        }

        // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
        if CONCISE_INTEGER_WIDTH_REGEX.is_match(token.stem) {
            ret.minimum_integer_digits = Some(token.stem.len() as u32);
            continue;
        }

        if FRACTION_PRECISION_REGEX.is_match(token.stem) {
            // Precision
            // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#fraction-precision
            // precision-integer case
            let caps = FRACTION_PRECISION_REGEX.captures(token.stem);
            if let Some(caps) = caps {
                let g1_len = caps.get(1).map(|g| g.as_str().len() as u32);
                let g2 = caps.get(2);
                let g3 = caps.get(3);
                let g4 = caps.get(4);
                let g5 = caps.get(5);

                // .000* case (before ICU67 it was .000+)
                if g2.map(|g| g.as_str() == "*").unwrap_or(false) {
                    ret.minimum_fraction_digits = g1_len;
                }
                // .### case
                else if g3.map(|g| g.as_str().starts_with("#")).unwrap_or(false) {
                    ret.maximum_fraction_digits = g3.map(|g| g.as_str().len() as u32);
                }
                // .00## case
                else if g4.is_some() && g5.is_some() {
                    ret.minimum_fraction_digits = g4.map(|g| g.as_str().len() as u32);
                    ret.maximum_fraction_digits =
                        Some(g4.unwrap().as_str().len() as u32 + g5.unwrap().as_str().len() as u32);
                } else {
                    ret.minimum_fraction_digits = g1_len;
                    ret.maximum_fraction_digits = g1_len;
                }

                let opt = token.options.get(0);
                // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#trailing-zero-display
                if let Some(opt) = opt {
                    if *opt == "w" {
                        ret.trailing_zero_display =
                            Some(NumberFormatOptionsTrailingZeroDisplay::StripIfInteger);
                    } else {
                        parse_significant_precision(&mut ret, opt);
                    }
                }
            }
            continue;
        }

        // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#significant-digits-precision
        if SIGNIFICANT_PRECISION_REGEX.is_match(token.stem) {
            parse_significant_precision(&mut ret, token.stem);
            continue;
        }

        parse_sign(&mut ret, token.stem);
        parse_concise_scientific_and_engineering_stem(&mut ret, token.stem);
    }
    ret
}

impl<'s> Parser<'s> {
    pub fn new(message: &'s str, options: &ParserOptions) -> Parser<'s> {
        Parser {
            message,
            #[cfg(feature = "utf16")]
            message_utf16: Utf16String::from(message),
            position: Cell::new(Position {
                offset: 0,
                line: 1,
                column: 1,
            }),
            options: options.clone(),
        }
    }

    pub fn parse(&mut self) -> Result<Ast> {
        assert_eq!(self.offset(), 0, "parser can only be used once");
        self.parse_message(0, "", false)
    }

    /// # Arguments
    ///
    /// * `nesting_level` - The nesting level of the message. This can be positive if the message
    ///   is nested inside the plural or select argument's selector clause.
    /// * `parent_arg_type` - If nested, this is the parent plural or selector's argument type.
    ///   Otherwise this should just be an empty string.
    /// * `expecting_close_tag` - If true, this message is directly or indirectly nested inside
    ///   between a pair of opening and closing tags. The nested message will not parse beyond
    ///   the closing tag boundary.
    fn parse_message(
        &self,
        nesting_level: usize,
        parent_arg_type: &str,
        expecting_close_tag: bool,
    ) -> Result<Ast> {
        let mut elements: Vec<AstElement> = vec![];

        while !self.is_eof() {
            elements.push(match self.char() {
                '{' => self.parse_argument(nesting_level, expecting_close_tag)?,
                '}' if nesting_level > 0 => break,
                '#' if matches!(parent_arg_type, "plural" | "selectordinal") => {
                    let position = self.position();
                    self.bump();
                    AstElement::Pound(Span::new(position, self.position()))
                }
                '<' if !self.options.ignore_tag && self.peek() == Some('/') => {
                    if expecting_close_tag {
                        break;
                    } else {
                        return Err(self.error(
                            ErrorKind::UnmatchedClosingTag,
                            Span::new(self.position(), self.position()),
                        ));
                    }
                }
                '<' if !self.options.ignore_tag && is_alpha(self.peek()) => {
                    self.parse_tag(nesting_level, parent_arg_type)?
                }
                _ => self.parse_literal(nesting_level, parent_arg_type)?,
            })
        }

        Ok(elements)
    }

    fn position(&self) -> Position {
        self.position.get()
    }

    /// A tag name must start with an ASCII lower case letter. The grammar is based on the
    /// [custom element name][] except that a dash is NOT always mandatory and uppercase letters
    /// are accepted:
    ///
    /// ```ignore
    /// tag ::= "<" tagName (whitespace)* "/>" | "<" tagName (whitespace)* ">" message "</" tagName (whitespace)* ">"
    /// tagName ::= [a-z] (PENChar)*
    /// PENChar ::=
    ///     "-" | "." | [0-9] | "_" | [a-z] | [A-Z] | #xB7 | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x37D] |
    ///     [#x37F-#x1FFF] | [#x200C-#x200D] | [#x203F-#x2040] | [#x2070-#x218F] | [#x2C00-#x2FEF] |
    ///     [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
    /// ```
    ///
    /// [custom element name]: https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
    fn parse_tag(&self, nesting_level: usize, parent_arg_type: &str) -> Result<AstElement> {
        let start_position = self.position();
        self.bump(); // '<'

        let tag_name = self.parse_tag_name();
        self.bump_space();

        if self.bump_if("/>") {
            // Self closing tag
            Ok(AstElement::Literal {
                value: format!("<{}/>", tag_name),
                span: if self.options.capture_location {
                    Some(Span::new(start_position, self.position()))
                } else {
                    None
                },
            })
        } else if self.bump_if(">") {
            let children = self.parse_message(nesting_level + 1, parent_arg_type, true)?;

            // Expecting a close tag
            let end_tag_start_position = self.position();

            if self.bump_if("</") {
                if self.is_eof() || !is_alpha(Some(self.char())) {
                    return Err(self.error(
                        ErrorKind::InvalidTag,
                        Span::new(end_tag_start_position, self.position()),
                    ));
                }

                let closing_tag_name_start_position = self.position();
                let closing_tag_name = self.parse_tag_name();
                if tag_name != closing_tag_name {
                    return Err(self.error(
                        ErrorKind::UnmatchedClosingTag,
                        Span::new(closing_tag_name_start_position, self.position()),
                    ));
                }

                self.bump_space();
                if !self.bump_if(">") {
                    let span = Span::new(end_tag_start_position, self.position());
                    return Err(self.error(ErrorKind::InvalidTag, span));
                }

                Ok(AstElement::Tag {
                    value: tag_name,
                    span: if self.options.capture_location {
                        Some(Span::new(start_position, self.position()))
                    } else {
                        None
                    },
                    children: Box::new(children),
                })
            } else {
                Err(self.error(
                    ErrorKind::UnclosedTag,
                    Span::new(start_position, self.position()),
                ))
            }
        } else {
            Err(self.error(
                ErrorKind::InvalidTag,
                Span::new(start_position, self.position()),
            ))
        }
    }

    fn parse_tag_name(&self) -> &str {
        let start_offset = self.offset();

        self.bump(); // the first tag name character
        while !self.is_eof() && is_potential_element_name_char(self.char()) {
            self.bump();
        }

        &self.message[start_offset..self.offset()]
    }

    fn parse_literal(&self, nesting_level: usize, parent_arg_type: &str) -> Result<AstElement> {
        let start = self.position();

        let mut value = String::new();
        loop {
            if self.bump_if("''") {
                value.push('\'');
            } else if let Some(fragment) = self.try_parse_quote(parent_arg_type) {
                value.push_str(&fragment);
            } else if let Some(fragment) = self.try_parse_unquoted(nesting_level, parent_arg_type) {
                value.push(fragment);
            } else if let Some(fragment) = self.try_parse_left_angle_bracket() {
                value.push(fragment);
            } else {
                break;
            }
        }

        let span = Span::new(start, self.position());
        Ok(AstElement::Literal {
            span: if self.options.capture_location {
                Some(span)
            } else {
                None
            },
            value,
        })
    }

    /// Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
    /// a character that requires quoting (that is, "only where needed"), and works the same in
    /// nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
    fn try_parse_quote(&self, parent_arg_type: &str) -> Option<String> {
        if self.is_eof() || self.char() != '\'' {
            return None;
        }

        // Parse escaped char following the apostrophe, or early return if there is no escaped char.
        // Check if is valid escaped character
        match self.peek() {
            Some('{') | Some('<') | Some('>') | Some('}') => (),
            Some('#') if matches!(parent_arg_type, "plural" | "selectordinal") => (),
            _ => {
                return None;
            }
        }

        self.bump(); // apostrophe
        let mut value = self.char().to_string(); // escaped char
        self.bump();

        // read chars until the optional closing apostrophe is found
        loop {
            if self.is_eof() {
                break;
            }
            match self.char() {
                '\'' if self.peek() == Some('\'') => {
                    value.push('\'');
                    // Bump one more time because we need to skip 2 characters.
                    self.bump();
                }
                '\'' => {
                    // Optional closing apostrophe.
                    self.bump();
                    break;
                }
                c => value.push(c),
            }
            self.bump();
        }

        Some(value)
    }

    fn try_parse_unquoted(&self, nesting_level: usize, parent_arg_type: &str) -> Option<char> {
        if self.is_eof() {
            return None;
        }
        match self.char() {
            '<' | '{' => None,
            '#' if parent_arg_type == "plural" || parent_arg_type == "selectordinal" => None,
            '}' if nesting_level > 0 => None,
            c => {
                self.bump();
                Some(c)
            }
        }
    }

    fn try_parse_left_angle_bracket(&self) -> Option<char> {
        if !self.is_eof()
            && self.char() == '<'
            && (self.options.ignore_tag
                // If at the opening tag or closing tag position, bail.
                || !(matches!(self.peek(), Some(c) if is_alpha(Some(c)) || c == '/')))
        {
            self.bump(); // `<`
            Some('<')
        } else {
            None
        }
    }

    fn parse_argument(
        &self,
        nesting_level: usize,
        expecting_close_tag: bool,
    ) -> Result<AstElement> {
        let opening_brace_position = self.position();
        self.bump(); // `{`

        self.bump_space();

        if self.is_eof() {
            return Err(self.error(
                ErrorKind::ExpectArgumentClosingBrace,
                Span::new(opening_brace_position, self.position()),
            ));
        }

        if self.char() == '}' {
            self.bump();
            return Err(self.error(
                ErrorKind::EmptyArgument,
                Span::new(opening_brace_position, self.position()),
            ));
        }

        // argument name
        let value = self.parse_identifier_if_possible().0.to_string();
        if value.is_empty() {
            return Err(self.error(
                ErrorKind::MalformedArgument,
                Span::new(opening_brace_position, self.position()),
            ));
        }

        self.bump_space();

        if self.is_eof() {
            return Err(self.error(
                ErrorKind::ExpectArgumentClosingBrace,
                Span::new(opening_brace_position, self.position()),
            ));
        }

        match self.char() {
            // Simple argument: `{name}`
            '}' => {
                self.bump(); // `}`

                Ok(AstElement::Argument {
                    // value does not include the opening and closing braces.
                    value,
                    span: if self.options.capture_location {
                        Some(Span::new(opening_brace_position, self.position()))
                    } else {
                        None
                    },
                })
            }

            // Argument with options: `{name, format, ...}`
            ',' => {
                self.bump(); // ','
                self.bump_space();

                if self.is_eof() {
                    return Err(self.error(
                        ErrorKind::ExpectArgumentClosingBrace,
                        Span::new(opening_brace_position, self.position()),
                    ));
                }

                self.parse_argument_options(
                    nesting_level,
                    expecting_close_tag,
                    value,
                    opening_brace_position,
                )
            }

            _ => Err(self.error(
                ErrorKind::MalformedArgument,
                Span::new(opening_brace_position, self.position()),
            )),
        }
    }

    fn parse_argument_options(
        &'s self,
        nesting_level: usize,
        expecting_close_tag: bool,
        value: String,
        opening_brace_position: Position,
    ) -> Result<AstElement> {
        // Parse this range:
        // {name, type, style}
        //        ^---^
        let type_starting_position = self.position();
        #[cfg(feature = "utf16")]
        let arg_type_utf16 = self.parse_identifier_if_possible().0;
        #[cfg(feature = "utf16")]
        let arg_type = arg_type_utf16.to_string();
        #[cfg(feature = "utf16")]
        let arg_type = arg_type.as_str();

        #[cfg(not(feature = "utf16"))]
        let arg_type = self.parse_identifier_if_possible().0;
        let type_end_position = self.position();

        match arg_type {
            "" => {
                // Expecting a style string number, date, time, plural, selectordinal, or select.
                Err(self.error(
                    ErrorKind::ExpectArgumentType,
                    Span::new(type_starting_position, type_end_position),
                ))
            }

            "number" | "date" | "time" => {
                // Parse this range:
                // {name, number, style}
                //              ^-------^
                self.bump_space();

                let style_and_span = if self.bump_if(",") {
                    self.bump_space();

                    let style_start_position = self.position();
                    let style = self.parse_simple_arg_style_if_possible()?.trim_end();
                    if style.is_empty() {
                        return Err(self.error(
                            ErrorKind::ExpectArgumentStyle,
                            Span::new(self.position(), self.position()),
                        ));
                    }

                    let style_span = Span::new(style_start_position, self.position());
                    Some((style, style_span))
                } else {
                    None
                };

                self.try_parse_argument_close(opening_brace_position)?;
                let span = Span::new(opening_brace_position, self.position());

                // Extract style or skeleton
                if let Some((style, style_span)) = style_and_span {
                    if style.starts_with("::") {
                        // Skeleton starts with `::`.
                        let skeleton = style[2..].trim_start();

                        Ok(match arg_type {
                            "number" => {
                                let skeleton = parse_number_skeleton_from_string(
                                    skeleton,
                                    style_span,
                                    self.options.should_parse_skeletons,
                                    self.options.capture_location,
                                )
                                .map_err(|kind| self.error(kind, style_span))?;

                                AstElement::Number {
                                    value,
                                    span: if self.options.capture_location {
                                        Some(span)
                                    } else {
                                        None
                                    },
                                    style: Some(NumberArgStyle::Skeleton(skeleton)),
                                }
                            }
                            _ => {
                                if skeleton.is_empty() {
                                    return Err(self.error(ErrorKind::ExpectDateTimeSkeleton, span));
                                }

                                let pattern = if let Some(locale) = &self.options.locale {
                                    get_best_pattern(skeleton, &locale)
                                } else {
                                    skeleton.to_string()
                                };

                                let parsed_options = if self.options.should_parse_skeletons {
                                    parse_date_time_skeleton(&pattern)
                                } else {
                                    Default::default()
                                };

                                let style = Some(DateTimeArgStyle::Skeleton(DateTimeSkeleton {
                                    skeleton_type: SkeletonType::DateTime,
                                    pattern,
                                    location: if self.options.capture_location {
                                        Some(style_span)
                                    } else {
                                        None
                                    },
                                    parsed_options,
                                }));
                                if arg_type == "date" {
                                    AstElement::Date {
                                        value,
                                        span: if self.options.capture_location {
                                            Some(span)
                                        } else {
                                            None
                                        },
                                        style,
                                    }
                                } else {
                                    AstElement::Time {
                                        value,
                                        span: if self.options.capture_location {
                                            Some(span)
                                        } else {
                                            None
                                        },
                                        style,
                                    }
                                }
                            }
                        })
                    } else {
                        // Regular style
                        Ok(match arg_type {
                            "number" => AstElement::Number {
                                value,
                                span: if self.options.capture_location {
                                    Some(span)
                                } else {
                                    None
                                },
                                style: Some(NumberArgStyle::Style(style)),
                            },
                            "date" => AstElement::Date {
                                value,
                                span: if self.options.capture_location {
                                    Some(span)
                                } else {
                                    None
                                },
                                style: Some(DateTimeArgStyle::Style(style)),
                            },
                            _ => AstElement::Time {
                                value,
                                span: if self.options.capture_location {
                                    Some(span)
                                } else {
                                    None
                                },
                                style: Some(DateTimeArgStyle::Style(style)),
                            },
                        })
                    }
                } else {
                    // No style
                    Ok(match arg_type {
                        "number" => AstElement::Number {
                            value,
                            span: if self.options.capture_location {
                                Some(span)
                            } else {
                                None
                            },
                            style: None,
                        },
                        "date" => AstElement::Date {
                            value,
                            span: if self.options.capture_location {
                                Some(span)
                            } else {
                                None
                            },
                            style: None,
                        },
                        _ => AstElement::Time {
                            value,
                            span: if self.options.capture_location {
                                Some(span)
                            } else {
                                None
                            },
                            style: None,
                        },
                    })
                }
            }

            "plural" | "selectordinal" | "select" => {
                // Parse this range:
                // {name, plural, options}
                //              ^---------^
                let type_end_position = self.position();

                self.bump_space();
                if !self.bump_if(",") {
                    return Err(self.error(
                        ErrorKind::ExpectSelectArgumentOptions,
                        Span::new(type_end_position, type_end_position),
                    ));
                }
                self.bump_space();

                // Parse offset:
                // {name, plural, offset:1, options}
                //                ^-----^
                //
                // or the first option:
                //
                // {name, plural, one {...} other {...}}
                //                ^--^
                let mut identifier_and_span = self.parse_identifier_if_possible();

                let plural_offset = if arg_type != "select" && identifier_and_span.0 == "offset" {
                    if !self.bump_if(":") {
                        return Err(self.error(
                            ErrorKind::ExpectPluralArgumentOffsetValue,
                            Span::new(self.position(), self.position()),
                        ));
                    }
                    self.bump_space();
                    let offset = self.try_parse_decimal_integer(
                        ErrorKind::ExpectPluralArgumentOffsetValue,
                        ErrorKind::InvalidPluralArgumentOffsetValue,
                    )?;

                    // Parse another identifier for option parsing
                    self.bump_space();
                    identifier_and_span = self.parse_identifier_if_possible();

                    offset
                } else {
                    0
                };

                #[cfg(feature = "utf16")]
                let options = self.try_parse_plural_or_select_options(
                    nesting_level,
                    arg_type_utf16,
                    expecting_close_tag,
                    identifier_and_span,
                )?;
                #[cfg(not(feature = "utf16"))]
                let options = self.try_parse_plural_or_select_options(
                    nesting_level,
                    arg_type,
                    expecting_close_tag,
                    identifier_and_span,
                )?;
                self.try_parse_argument_close(opening_brace_position)?;

                let span = Span::new(opening_brace_position, self.position());
                match arg_type {
                    "select" => Ok(AstElement::Select {
                        value,
                        span: if self.options.capture_location {
                            Some(span)
                        } else {
                            None
                        },
                        options,
                    }),
                    _ => Ok(AstElement::Plural {
                        value,
                        span: if self.options.capture_location {
                            Some(span)
                        } else {
                            None
                        },
                        options,
                        offset: plural_offset,
                        plural_type: if arg_type == "plural" {
                            PluralType::Cardinal
                        } else {
                            PluralType::Ordinal
                        },
                    }),
                }
            }

            _ => Err(self.error(
                ErrorKind::InvalidArgumentType,
                Span::new(type_starting_position, type_end_position),
            )),
        }
    }

    /// * `nesting_level` - the current nesting level of messages.
    ///   This can be positive when parsing message fragment in select or plural argument options.
    /// * `parent_arg_type` - the parent argument's type.
    /// * `parsed_first_identifier` - if provided, this is the first identifier-like selector of the
    ///   argument. It is a by-product of a previous parsing attempt.
    /// * `expecting_close_tag` - If true, this message is directly or indirectly nested inside
    ///   between a pair of opening and closing tags. The nested message will not parse beyond
    ///   the closing tag boundary.    ///
    fn try_parse_plural_or_select_options(
        &'s self,
        nesting_level: usize,
        #[cfg(feature = "utf16")] parent_arg_type: &'s Utf16Str,
        #[cfg(not(feature = "utf16"))] parent_arg_type: &'s str,
        expecting_close_tag: bool,
        #[cfg(feature = "utf16")] parsed_first_identifier: (&'s Utf16Str, Span),
        #[cfg(not(feature = "utf16"))] parsed_first_identifier: (&'s str, Span),
    ) -> Result<PluralOrSelectOptions> {
        let mut has_other_clause = false;

        let mut options = vec![];
        let mut selectors_parsed = HashSet::new();
        let (mut selector, mut selector_span) = parsed_first_identifier;
        // Parse:
        // one {one apple}
        // ^--^
        loop {
            if selector.is_empty() {
                let start_position = self.position();
                if parent_arg_type != "select" && self.bump_if("=") {
                    // Try parse `={number}` selector
                    self.try_parse_decimal_integer(
                        ErrorKind::ExpectPluralArgumentSelector,
                        ErrorKind::InvalidPluralArgumentSelector,
                    )?;
                    selector_span = Span::new(start_position, self.position());
                    #[cfg(feature = "utf16")]
                    {
                        selector = &self.message_utf16[start_position.offset..self.offset()];
                    }
                    #[cfg(not(feature = "utf16"))]
                    {
                        selector = &self.message[start_position.offset..self.offset()];
                    }
                } else {
                    // TODO: check to make sure that the plural category is valid.
                    break;
                }
            }

            // Duplicate selector clauses
            if selectors_parsed.contains(selector) {
                return Err(self.error(
                    if parent_arg_type == "select" {
                        ErrorKind::DuplicateSelectArgumentSelector
                    } else {
                        ErrorKind::DuplicatePluralArgumentSelector
                    },
                    selector_span,
                ));
            }

            if selector == "other" {
                has_other_clause = true;
            }

            // Parse:
            // one {one apple}
            //     ^----------^
            self.bump_space();
            let opening_brace_position = self.position();
            if !self.bump_if("{") {
                return Err(self.error(
                    if parent_arg_type == "select" {
                        ErrorKind::ExpectSelectArgumentSelectorFragment
                    } else {
                        ErrorKind::ExpectPluralArgumentSelectorFragment
                    },
                    Span::new(self.position(), self.position()),
                ));
            }

            let fragment = self.parse_message(
                nesting_level + 1,
                parent_arg_type.to_string().as_str(),
                expecting_close_tag,
            )?;
            self.try_parse_argument_close(opening_brace_position)?;

            options.push((
                selector,
                PluralOrSelectOption {
                    value: fragment,
                    location: if self.options.capture_location {
                        Some(Span::new(opening_brace_position, self.position()))
                    } else {
                        None
                    },
                },
            ));
            // Keep track of the existing selectors
            selectors_parsed.insert(selector);

            // Prep next selector clause.
            self.bump_space();
            // 🤷‍♂️ Destructure assignment is NOT yet supported by Rust.
            let _identifier_and_span = self.parse_identifier_if_possible();
            selector = _identifier_and_span.0;
            selector_span = _identifier_and_span.1;
        }

        if options.is_empty() {
            return Err(self.error(
                match parent_arg_type.to_string().as_str() {
                    "select" => ErrorKind::ExpectSelectArgumentSelector,
                    _ => ErrorKind::ExpectPluralArgumentSelector,
                },
                Span::new(self.position(), self.position()),
            ));
        }

        if self.options.requires_other_clause && !has_other_clause {
            return Err(self.error(
                ErrorKind::MissingOtherClause,
                Span::new(self.position(), self.position()),
            ));
        }

        Ok(PluralOrSelectOptions(options))
    }

    fn try_parse_decimal_integer(
        &self,
        expect_number_error: ErrorKind,
        invalid_number_error: ErrorKind,
    ) -> Result<i64> {
        let mut sign = 1;
        let start_position = self.position();

        if self.bump_if("+") {
        } else if self.bump_if("-") {
            sign = -1;
        }

        let mut digits = String::new();
        while !self.is_eof() && self.char().is_digit(10) {
            digits.push(self.char());
            self.bump();
        }

        let span = Span::new(start_position, self.position());

        if self.is_eof() {
            return Err(self.error(expect_number_error, span));
        }

        digits
            .parse::<i64>()
            .map(|x| x * sign)
            .map_err(|_| self.error(invalid_number_error, span))
    }

    /// See: https://github.com/unicode-org/icu/blob/af7ed1f6d2298013dc303628438ec4abe1f16479/icu4c/source/common/messagepattern.cpp#L659
    fn parse_simple_arg_style_if_possible(&self) -> Result<&str> {
        let mut nested_braces = 0;

        let start_position = self.position();
        while !self.is_eof() {
            match self.char() {
                '\'' => {
                    // Treat apostrophe as quoting but include it in the style part.
                    // Find the end of the quoted literal text.
                    self.bump();
                    let apostrophe_position = self.position();
                    if !self.bump_until('\'') {
                        return Err(self.error(
                            ErrorKind::UnclosedQuoteInArgumentStyle,
                            Span::new(apostrophe_position, self.position()),
                        ));
                    }
                    self.bump();
                }
                '{' => {
                    nested_braces += 1;
                    self.bump();
                }
                '}' => {
                    if nested_braces > 0 {
                        nested_braces -= 1;
                    } else {
                        break;
                    }
                }
                _ => {
                    self.bump();
                }
            }
        }

        Ok(&self.message[start_position.offset..self.offset()])
    }

    fn try_parse_argument_close(&self, opening_brace_position: Position) -> Result<()> {
        // Parse: {value, number, ::currency/GBP }
        //                                       ^^
        if self.is_eof() {
            return Err(self.error(
                ErrorKind::ExpectArgumentClosingBrace,
                Span::new(opening_brace_position, self.position()),
            ));
        }

        if self.char() != '}' {
            return Err(self.error(
                ErrorKind::ExpectArgumentClosingBrace,
                Span::new(opening_brace_position, self.position()),
            ));
        }
        self.bump(); // `}`

        Ok(())
    }

    fn parse_identifier_if_possible_inner(&self) -> Span {
        let starting_position = self.position();

        while !self.is_eof() && !is_whitespace(self.char()) && !is_pattern_syntax(self.char()) {
            self.bump();
        }

        let end_position = self.position();
        Span::new(starting_position, end_position)
    }

    /// Advance the parser until the end of the identifier, if it is currently on
    /// an identifier character. Return an empty string otherwise.
    #[cfg(feature = "utf16")]
    fn parse_identifier_if_possible(&self) -> (&Utf16Str, Span) {
        let span = self.parse_identifier_if_possible_inner();
        (
            &self.message_utf16[span.start.offset..span.end.offset],
            span,
        )
    }

    #[cfg(not(feature = "utf16"))]
    fn parse_identifier_if_possible(&self) -> (&str, Span) {
        let span = self.parse_identifier_if_possible_inner();
        (&self.message[span.start.offset..span.end.offset], span)
    }

    fn error(&self, kind: ErrorKind, span: Span) -> ast::Error {
        ast::Error {
            kind,
            message: self.message.to_string(),
            location: if self.options.capture_location {
                Some(span)
            } else {
                None
            },
        }
    }

    fn offset(&self) -> usize {
        self.position().offset
    }

    /// Return the character at the current position of the parser.
    ///
    /// This panics if the current position does not point to a valid char.
    fn char(&self) -> char {
        self.char_at(self.offset())
    }

    /// Return the character at the given position.
    ///
    /// This panics if the given position does not point to a valid char.
    fn char_at(&self, i: usize) -> char {
        #[cfg(feature = "utf16")]
        let message = &self.message_utf16[i..].to_string();
        #[cfg(feature = "utf16")]
        let message = message.as_str();

        #[cfg(not(feature = "utf16"))]
        let message = &self.message[i..];

        message
            .chars()
            .next()
            .unwrap_or_else(|| panic!("expected char at offset {}", i))
    }

    /// Bump the parser to the next Unicode scalar value.
    fn bump(&self) {
        if self.is_eof() {
            return;
        }
        let Position {
            mut offset,
            mut line,
            mut column,
        } = self.position();
        let ch = self.char();
        if ch == '\n' {
            line = line.checked_add(1).unwrap();
            column = 1;
        } else {
            column = column.checked_add(1).unwrap();
        }

        #[cfg(feature = "utf16")]
        {
            offset += ch.len_utf16();
        }
        #[cfg(not(feature = "utf16"))]
        {
            offset += ch.len_utf8();
        }
        self.position.set(Position {
            offset,
            line,
            column,
        });
    }

    /// Bump the parser to the target offset.
    ///
    /// If target offset is beyond the end of the input, bump the parser to the end of the input.
    fn bump_to(&self, target_offset: usize) {
        assert!(
            self.offset() <= target_offset,
            "target_offset {} must be greater than the current offset {})",
            target_offset,
            self.offset()
        );

        let target_offset = cmp::min(target_offset, self.message.len());
        loop {
            let offset = self.offset();

            if self.offset() == target_offset {
                break;
            }
            assert!(
                offset < target_offset,
                "target_offset is at invalid unicode byte boundary: {}",
                target_offset
            );

            self.bump();
            if self.is_eof() {
                break;
            }
        }
    }

    /// If the substring starting at the current position of the parser has
    /// the given prefix, then bump the parser to the character immediately
    /// following the prefix and return true. Otherwise, don't bump the parser
    /// and return false.
    fn bump_if(&self, prefix: &str) -> bool {
        #[cfg(feature = "utf16")]
        let message = &self.message_utf16[self.offset()..].to_string();
        #[cfg(feature = "utf16")]
        let message = message.as_str();

        #[cfg(not(feature = "utf16"))]
        let message = &self.message[self.offset()..];

        if message.starts_with(prefix) {
            for _ in 0..prefix.chars().count() {
                self.bump();
            }
            true
        } else {
            false
        }
    }

    /// Bump the parser until the pattern character is found and return `true`.
    /// Otherwise bump to the end of the file and return `false`.
    fn bump_until(&self, pattern: char) -> bool {
        let current_offset = self.offset();
        if let Some(delta) = self.message[current_offset..].find(pattern) {
            self.bump_to(current_offset + delta);
            true
        } else {
            self.bump_to(self.message.len());
            false
        }
    }

    /// advance the parser through all whitespace to the next non-whitespace byte.
    fn bump_space(&self) {
        while !self.is_eof() && is_whitespace(self.char()) {
            self.bump();
        }
    }

    /// Peek at the *next* character in the input without advancing the parser.
    ///
    /// If the input has been exhausted, then this returns `None`.
    fn peek(&self) -> Option<char> {
        if self.is_eof() {
            return None;
        }
        self.message[self.offset() + self.char().len_utf8()..]
            .chars()
            .next()
    }

    /// Returns true if the next call to `bump` would return false.
    fn is_eof(&self) -> bool {
        #[cfg(feature = "utf16")]
        return self.offset() == self.message_utf16.len();

        #[cfg(not(feature = "utf16"))]
        return self.offset() == self.message.len();
    }
}

fn parse_number_skeleton_from_string(
    skeleton: &str,
    span: Span,
    should_parse_skeleton: bool,
    should_capture_location: bool,
) -> std::result::Result<NumberSkeleton, ErrorKind> {
    if skeleton.is_empty() {
        return Err(ErrorKind::InvalidNumberSkeleton);
    }
    // Parse the skeleton
    let tokens: std::result::Result<Vec<_>, _> = skeleton
        .split(char::is_whitespace)
        .filter(|x| !x.is_empty())
        .map(|token| {
            let mut stem_and_options = token.split('/');
            if let Some(stem) = stem_and_options.next() {
                let options: std::result::Result<Vec<_>, _> = stem_and_options
                    .map(|option| {
                        // Token option cannot be empty
                        if option.is_empty() {
                            Err(ErrorKind::InvalidNumberSkeleton)
                        } else {
                            Ok(option)
                        }
                    })
                    .collect();
                Ok(NumberSkeletonToken {
                    stem,
                    options: options?,
                })
            } else {
                Err(ErrorKind::InvalidNumberSkeleton)
            }
        })
        .collect();

    let tokens = tokens?;
    let parsed_options = if should_parse_skeleton {
        parse_number_skeleton(&tokens)
    } else {
        Default::default()
    };

    Ok(NumberSkeleton {
        skeleton_type: SkeletonType::Number,
        tokens,
        // TODO: use trimmed end position
        location: if should_capture_location {
            Some(span)
        } else {
            None
        },
        parsed_options,
    })
}

fn is_potential_element_name_char(ch: char) -> bool {
    matches!(ch, '-'
        | '.'
        | '0'..='9'
        | '_'
        | 'a'..='z'
        | 'A'..='Z'
        | '\u{B7}'
        | '\u{C0}'..='\u{D6}'
        | '\u{D8}'..='\u{F6}'
        | '\u{F8}'..='\u{37D}'
        | '\u{37F}'..='\u{1FFF}'
        | '\u{200C}'..='\u{200D}'
        | '\u{203F}'..='\u{2040}'
        | '\u{2070}'..='\u{218F}'
        | '\u{2C00}'..='\u{2FEF}'
        | '\u{3001}'..='\u{D7FF}'
        | '\u{F900}'..='\u{FDCF}'
        | '\u{FDF0}'..='\u{FFFD}'
        | '\u{10000}'..='\u{EFFFF}')
}
