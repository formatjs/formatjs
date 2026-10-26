//! ECMA-402 ListFormat with caller-loaded CLDR patterns. Strings are UTF-16
//! code units so host adapters preserve ECMAScript lone surrogates exactly.

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
struct Pattern(Vec<Token>);
impl Pattern {
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
        Ok(Self(tokens))
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
impl TryFrom<RawTemplates> for Templates {
    type Error = Error;
    fn try_from(raw: RawTemplates) -> Result<Self, Error> {
        Ok(Self {
            pair: Pattern::parse(&raw.pair)?,
            start: Pattern::parse(&raw.start)?,
            middle: Pattern::parse(&raw.middle)?,
            end: Pattern::parse(&raw.end)?,
        })
    }
}
pub struct LocalePatterns {
    locale: String,
    aliases: Vec<String>,
    templates: BTreeMap<String, BTreeMap<String, Templates>>,
}
impl LocalePatterns {
    pub fn from_json(json: &str) -> Result<Self, Error> {
        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct Pack {
            format_version: u8,
            locale: String,
            #[serde(default)]
            aliases: Vec<String>,
            data: BTreeMap<String, BTreeMap<String, RawTemplates>>,
        }
        let pack: Pack =
            serde_json::from_str(json).map_err(|error| Error::InvalidData(error.to_string()))?;
        if pack.format_version != 1 {
            return Err(Error::InvalidData("unsupported pack version".into()));
        }
        let mut templates = BTreeMap::new();
        // LocaleData has three types, each with all three styles. This port
        // follows TS's single CLDR template set, including its context choice.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L80-L84
        for (kind, styles) in pack.data {
            let mut compiled = BTreeMap::new();
            for (style, raw) in styles {
                compiled.insert(style, raw.try_into()?);
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
            locale: canonical(&pack.locale)?,
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
    pub fn format_to_parts(&self, list: &[Vec<u16>]) -> Vec<Part> {
        // CreatePartsFromList 1–2: empty list has no parts. One empty string
        // still produces one element record (steps 4–8).
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L274-L299
        if list.is_empty() {
            return Vec::new();
        }
        let templates = &self.data.templates[self.options.kind.key()][self.options.style.key()];
        enum Node<'a> {
            Element(&'a [u16]),
            Join(&'a Pattern, usize, usize),
        }
        let mut nodes: Vec<_> = list.iter().map(|value| Node::Element(value)).collect();
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
        let mut parts = Vec::new();
        // DeconstructPattern 1–4: append literal records and substitute element
        // records/lists without merging adjacent parts or interpreting inputs.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L244-L258
        while let Some(task) = pending.pop() {
            match task {
                Task::Literal(value) => parts.push(Part {
                    kind: "literal",
                    value: value.to_vec(),
                }),
                Task::Node(index) => match &nodes[index] {
                    Node::Element(value) => parts.push(Part {
                        kind: "element",
                        value: value.to_vec(),
                    }),
                    Node::Join(pattern, first, second) => {
                        for token in pattern.0.iter().rev() {
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
        parts
    }
    pub fn format(&self, list: &[Vec<u16>]) -> Vec<u16> {
        // FormatList 1–5: concatenate all part values, including empty elements.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/listformat.html#L317-L321
        self.format_to_parts(list)
            .into_iter()
            .flat_map(|part| part.value)
            .collect()
    }
}
