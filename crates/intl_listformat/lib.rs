//! ECMA-402 ListFormat with caller-loaded CLDR patterns. Strings are UTF-16
//! code units so host adapters preserve ECMAScript lone surrogates exactly.

use icu_properties::{CodePointMapData, props::Script};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::sync::Arc;

pub mod ffi;
pub mod registry;

#[derive(Debug, PartialEq, Eq)]
pub enum Error {
    InvalidData(String),
    InvalidOption(&'static str),
    MissingLocale,
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for Error {}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Type {
    #[default]
    Conjunction,
    Disjunction,
    Unit,
}
impl Type {
    fn key(self) -> &'static str {
        match self {
            Self::Conjunction => "conjunction",
            Self::Disjunction => "disjunction",
            Self::Unit => "unit",
        }
    }
}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Style {
    #[default]
    Long,
    Short,
    Narrow,
}
impl Style {
    fn key(self) -> &'static str {
        match self {
            Self::Long => "long",
            Self::Short => "short",
            Self::Narrow => "narrow",
        }
    }
}
#[derive(Clone, Debug, Default, Deserialize, Serialize)]
pub struct Options {
    #[serde(default, rename = "type")]
    pub kind: Type,
    #[serde(default)]
    pub style: Style,
}

enum Token {
    Literal(Vec<u16>),
    First,
    Second,
}
enum Context {
    SpanishAnd,
    SpanishOr,
    Hebrew,
}
impl Context {
    fn matches(&self, text: &[u16]) -> bool {
        if text.is_empty() {
            return false;
        }
        let ascii = |index| text.get(index).copied().unwrap_or(0) | 0x20;
        match self {
            Self::SpanishAnd => {
                ascii(0) == b'i' as u16
                    || (ascii(0) == b'h' as u16
                        && ascii(1) == b'i' as u16
                        && (text.len() == 2 || ![b'a' as u16, b'e' as u16].contains(&ascii(2))))
            }
            Self::SpanishOr => {
                [b'o' as u16, b'8' as u16].contains(&ascii(0))
                    || (ascii(0) == b'h' as u16 && ascii(1) == b'o' as u16)
                    || (text.starts_with(&[b'1' as u16, b'1' as u16])
                        && (text.len() == 2 || text[2] == b' ' as u16))
            }
            Self::Hebrew => !char::decode_utf16(text.iter().copied())
                .next()
                .and_then(Result::ok)
                .is_some_and(|character| {
                    CodePointMapData::<Script>::new().get(character) == Script::Hebrew
                }),
        }
    }
}
struct Pattern {
    tokens: Vec<Token>,
    alternate: Option<(Context, Vec<Token>)>,
}
impl Pattern {
    fn contextual(text: &str, language: &str) -> Result<Self, Error> {
        let mut pattern = Self::parse(text)?;
        // ICU applies these rules only to exact pair/end patterns.
        // https://github.com/unicode-org/icu/blob/release-78.1/icu4c/source/i18n/listformatter.cpp#L124-L211
        let alternate = match (language, text) {
            ("es", "{0} y {1}") => Some((Context::SpanishAnd, "{0} e {1}")),
            ("es", "{0} o {1}") => Some((Context::SpanishOr, "{0} u {1}")),
            ("he" | "iw", "{0} ו{1}") => Some((Context::Hebrew, "{0} ו-{1}")),
            _ => None,
        };
        if let Some((context, text)) = alternate {
            pattern.alternate = Some((context, Self::parse(text)?.tokens));
        }
        Ok(pattern)
    }
    fn for_next(&self, text: &[u16]) -> &[Token] {
        match &self.alternate {
            Some((context, tokens)) if context.matches(text) => tokens,
            _ => &self.tokens,
        }
    }
    fn separator(&self, next: &[u16]) -> Option<&[u16]> {
        match self.for_next(next) {
            [Token::First, Token::Second] => Some(&[]),
            [Token::First, Token::Literal(value), Token::Second] => Some(value),
            _ => None,
        }
    }
    fn parse(text: &str) -> Result<Self, Error> {
        // LocaleData requires each placeholder exactly once. Compile its
        // PartitionPattern result on load; substitution never reparses inputs.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L80-L84
        let mut tokens = Vec::new();
        let mut rest = text;
        let mut counts = [0, 0];
        while let Some(open) = rest.find('{') {
            if rest[..open].contains('}') {
                return Err(Error::InvalidData("unmatched pattern brace".into()));
            }
            if open != 0 {
                tokens.push(Token::Literal(rest[..open].encode_utf16().collect()));
            }
            let (token, index) = if rest[open..].starts_with("{0}") {
                (Token::First, 0)
            } else if rest[open..].starts_with("{1}") {
                (Token::Second, 1)
            } else {
                return Err(Error::InvalidData("invalid pattern placeholder".into()));
            };
            counts[index] += 1;
            tokens.push(token);
            rest = &rest[open + 3..];
        }
        if counts != [1, 1] || rest.contains('}') {
            return Err(Error::InvalidData("pattern needs {0} and {1} once".into()));
        }
        if !rest.is_empty() {
            tokens.push(Token::Literal(rest.encode_utf16().collect()));
        }
        Ok(Self {
            tokens,
            alternate: None,
        })
    }
}
#[derive(Deserialize)]
struct RawTemplates {
    pair: String,
    start: String,
    middle: String,
    end: String,
}
struct Templates {
    pair: Pattern,
    start: Pattern,
    middle: Pattern,
    end: Pattern,
}
impl RawTemplates {
    fn compile(self, language: &str) -> Result<Templates, Error> {
        let raw = self;
        Ok(Templates {
            pair: Pattern::contextual(&raw.pair, language)?,
            start: Pattern::parse(&raw.start)?,
            middle: Pattern::parse(&raw.middle)?,
            end: Pattern::contextual(&raw.end, language)?,
        })
    }
}
pub struct LocalePatterns {
    locale: String,
    aliases: Vec<String>,
    templates: BTreeMap<String, BTreeMap<String, Templates>>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Pack {
    format_version: u8,
    locale: String,
    #[serde(default)]
    aliases: Vec<String>,
    data: BTreeMap<String, BTreeMap<String, RawTemplates>>,
}
impl LocalePatterns {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        let pack: Pack =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        Self::from_pack(pack)
    }

    fn from_pack(pack: Pack) -> Result<Self, Error> {
        if pack.format_version != 1 {
            return Err(Error::InvalidData("unsupported pack version".into()));
        }
        let locale = canonical(&pack.locale)?;
        let language = locale.split('-').next().unwrap();
        let mut templates = BTreeMap::new();
        // LocaleData has three types, each with all three styles.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L80-L84
        for (kind, styles) in pack.data {
            let mut compiled = BTreeMap::new();
            for (style, raw) in styles {
                compiled.insert(style, raw.compile(language)?);
            }
            for style in ["long", "short", "narrow"] {
                if !compiled.contains_key(style) {
                    return Err(Error::InvalidData(format!("missing {kind}/{style}")));
                }
            }
            templates.insert(kind, compiled);
        }
        for kind in ["conjunction", "disjunction", "unit"] {
            if !templates.contains_key(kind) {
                return Err(Error::InvalidData(format!("missing {kind}")));
            }
        }
        Ok(Self {
            locale,
            aliases: pack
                .aliases
                .iter()
                .map(|tag| canonical(tag))
                .collect::<Result<_, _>>()?,
            templates,
        })
    }
    pub fn locale(&self) -> &str {
        &self.locale
    }
}
fn canonical(tag: &str) -> Result<String, Error> {
    formatjs_intl_getcanonicallocales::canonicalize_locale(tag)
        .map_err(|error| Error::InvalidData(error.to_string()))
}

#[derive(Debug, PartialEq, Eq, Serialize)]
pub struct Part {
    #[serde(rename = "type")]
    pub kind: &'static str,
    pub value: Vec<u16>,
}
#[derive(Serialize)]
pub struct ResolvedOptions {
    pub locale: String,
    #[serde(rename = "type")]
    pub kind: Type,
    pub style: Style,
}
pub struct ListFormat {
    data: Arc<LocalePatterns>,
    locale: String,
    options: Options,
}
impl ListFormat {
    pub fn new(data: Arc<LocalePatterns>, options: Options) -> Self {
        Self {
            locale: data.locale.clone(),
            data,
            options,
        }
    }
    pub fn resolved_options(&self) -> ResolvedOptions {
        // Return a fresh locale/type/style record in the specified order.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L119-L151
        ResolvedOptions {
            locale: self.locale.clone(),
            kind: self.options.kind,
            style: self.options.style,
        }
    }
    fn visit_parts<T: AsRef<[u16]>>(&self, list: &[T], mut visit: impl FnMut(bool, &[u16])) {
        // CreatePartsFromList 1–2: empty list has no parts. One empty string
        // still produces one element record (steps 4–8).
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L274-L299
        if list.is_empty() {
            return;
        }
        if list.len() == 1 {
            visit(true, list[0].as_ref());
            return;
        }
        let templates = &self.data.templates[self.options.kind.key()][self.options.style.key()];
        let last = list[list.len() - 1].as_ref();
        // Forward joins can stream borrowed slices without traversal storage.
        if list.len() == 2 {
            if let Some(separator) = templates.pair.separator(last) {
                visit(true, list[0].as_ref());
                if !separator.is_empty() {
                    visit(false, separator);
                }
                visit(true, last);
                return;
            }
        } else if let (Some(start), Some(middle), Some(end)) = (
            templates.start.separator(last),
            templates.middle.separator(last),
            templates.end.separator(last),
        ) {
            visit(true, list[0].as_ref());
            if !start.is_empty() {
                visit(false, start);
            }
            for value in &list[1..list.len() - 2] {
                visit(true, value.as_ref());
                if !middle.is_empty() {
                    visit(false, middle);
                }
            }
            visit(true, list[list.len() - 2].as_ref());
            if !end.is_empty() {
                visit(false, end);
            }
            visit(true, last);
            return;
        }
        enum Node<'a> {
            Element(&'a [u16]),
            Join(&'a Pattern, usize, usize),
        }
        let mut nodes: Vec<_> = list
            .iter()
            .map(|value| Node::Element(value.as_ref()))
            .collect();
        let mut tail = list.len() - 1;
        // Steps 3–8: pair uses Pair; otherwise reverse-fold End, Middle, Start.
        // An arena delays expansion, avoiding quadratic copies and recursion.
        for index in (0..list.len() - 1).rev() {
            let pattern = if list.len() == 2 {
                &templates.pair
            } else if index == 0 {
                &templates.start
            } else if index < list.len() - 2 {
                &templates.middle
            } else {
                &templates.end
            };
            nodes.push(Node::Join(pattern, index, tail));
            tail = nodes.len() - 1;
        }
        enum Task<'a> {
            Node(usize),
            Literal(&'a [u16]),
        }
        let mut pending = vec![Task::Node(tail)];
        // DeconstructPattern 1–4: append literal records and substitute element
        // records/lists without merging adjacent parts or interpreting inputs.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L244-L258
        while let Some(task) = pending.pop() {
            match task {
                Task::Literal(value) => visit(false, value),
                Task::Node(index) => match &nodes[index] {
                    Node::Element(value) => visit(true, value),
                    Node::Join(pattern, first, second) => {
                        for token in pattern.for_next(list[list.len() - 1].as_ref()).iter().rev() {
                            pending.push(match token {
                                Token::Literal(value) => Task::Literal(value),
                                Token::First => Task::Node(*first),
                                Token::Second => Task::Node(*second),
                            });
                        }
                    }
                },
            }
        }
    }
    fn parts_with<T: AsRef<[u16]>>(&self, list: &[T]) -> Vec<Part> {
        let mut parts = Vec::new();
        self.visit_parts(list, |element, value| {
            parts.push(Part {
                kind: if element { "element" } else { "literal" },
                value: value.to_vec(),
            });
        });
        parts
    }
    pub fn format_to_parts(&self, list: &[Vec<u16>]) -> Vec<Part> {
        self.parts_with(list)
    }
    pub(crate) fn format_to_parts_borrowed(&self, list: &[&[u16]]) -> Vec<Part> {
        self.parts_with(list)
    }
    fn format_with<T: AsRef<[u16]>>(&self, list: &[T]) -> Vec<u16> {
        // FormatList 1–5: concatenate all part values, including empty elements.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L317-L321
        // Every input appears once; literals only add to this lower bound.
        let capacity = list.iter().map(|value| value.as_ref().len()).sum();
        let mut result = Vec::with_capacity(capacity);
        self.visit_parts(list, |_, value| result.extend_from_slice(value));
        result
    }
    pub fn format(&self, list: &[Vec<u16>]) -> Vec<u16> {
        self.format_with(list)
    }
    pub(crate) fn format_borrowed(&self, list: &[&[u16]]) -> Vec<u16> {
        self.format_with(list)
    }
}

impl<'de> serde::Deserialize<'de> for LocalePatterns {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let pack = Pack::deserialize(deserializer)?;
        Self::from_pack(pack).map_err(serde::de::Error::custom)
    }
}

#[cfg(feature = "compiled_data")]
mod compiled_data {
    include!(env!("FORMATJS_COMPILED_LOCALES"));
}
