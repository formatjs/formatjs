use crate::xcstrings::VerificationIssue;
use anyhow::{Context, Result, bail, ensure};
use formatjs_apple_printf_parser::{Amount, ArgumentReference, parse_specifier};
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, Default)]
pub struct VerificationOptions {
    pub missing_keys: bool,
    pub extra_keys: bool,
    pub structural_equality: bool,
}

#[derive(Default)]
struct NativeCatalog {
    strings: BTreeMap<String, Value>,
    locales: BTreeSet<String>,
}

#[derive(Debug, PartialEq, Eq)]
pub struct Entry {
    pub value: Value,
    pub description: String,
}

fn decode(data: &[u8]) -> Result<String> {
    if data.starts_with(&[0xff, 0xfe]) || data.starts_with(&[0xfe, 0xff]) {
        ensure!(data.len().is_multiple_of(2), "Truncated UTF-16 resource");
        let little_endian = data.starts_with(&[0xff, 0xfe]);
        let units: Vec<_> = data[2..]
            .chunks_exact(2)
            .map(|pair| {
                if little_endian {
                    u16::from_le_bytes([pair[0], pair[1]])
                } else {
                    u16::from_be_bytes([pair[0], pair[1]])
                }
            })
            .collect();
        return String::from_utf16(&units).context("Invalid UTF-16 resource");
    }
    Ok(std::str::from_utf8(data)?
        .trim_start_matches('\u{feff}')
        .to_owned())
}

struct Strings<'a> {
    text: &'a str,
    offset: usize,
}

impl Strings<'_> {
    fn remaining(&self) -> &str {
        &self.text[self.offset..]
    }

    fn skip(&mut self) -> Result<String> {
        let mut comments = Vec::new();
        loop {
            self.offset += self.remaining().len() - self.remaining().trim_start().len();
            if self.remaining().starts_with("/*") {
                let end = self.remaining()[2..]
                    .find("*/")
                    .context("Unterminated comment")?
                    + 2;
                comments.push(self.remaining()[2..end].trim().to_owned());
                self.offset += end + 2;
            } else if self.remaining().starts_with("//") {
                let end = self
                    .remaining()
                    .find(['\r', '\n'])
                    .unwrap_or(self.remaining().len());
                comments.push(self.remaining()[2..end].trim().to_owned());
                self.offset += end;
            } else {
                return Ok(comments.join("\n\n"));
            }
        }
    }

    fn take(&mut self) -> Result<char> {
        let character = self
            .remaining()
            .chars()
            .next()
            .context("Unexpected end of .strings file")?;
        self.offset += character.len_utf8();
        Ok(character)
    }

    fn string(&mut self) -> Result<String> {
        if !self.remaining().starts_with('"') {
            let length = self
                .remaining()
                .find(|c: char| !c.is_ascii_alphanumeric() && !"_$/:.-".contains(c))
                .unwrap_or(self.remaining().len());
            ensure!(length > 0, "Expected .strings key or value");
            let result = self.remaining()[..length].to_owned();
            self.offset += length;
            return Ok(result);
        }
        self.take()?;
        let mut units = Vec::new();
        loop {
            let mut character = self.take()?;
            if character == '"' {
                break;
            }
            if character == '\\' {
                character = self.take()?;
                character = match character {
                    'n' => '\n',
                    'r' => '\r',
                    't' => '\t',
                    'b' => '\u{8}',
                    'f' => '\u{c}',
                    'v' => '\u{b}',
                    'a' => '\u{7}',
                    '"' => '"',
                    '\'' => '\'',
                    '\\' => '\\',
                    '\n' => continue,
                    'u' | 'U' => {
                        let mut value = 0u16;
                        for _ in 0..4 {
                            value = value * 16
                                + self
                                    .take()?
                                    .to_digit(16)
                                    .context("Invalid Unicode escape")?
                                    as u16;
                        }
                        units.push(value);
                        continue;
                    }
                    '0'..='7' => {
                        let mut value = character.to_digit(8).unwrap();
                        for _ in 0..2 {
                            let Some(digit) =
                                self.remaining().chars().next().and_then(|c| c.to_digit(8))
                            else {
                                break;
                            };
                            self.take()?;
                            value = value * 8 + digit;
                        }
                        char::from_u32(value).context("Invalid octal escape")?
                    }
                    _ => bail!("Unsupported .strings escape: \\{character}"),
                };
            }
            units.extend(character.encode_utf16(&mut [0; 2]).iter().copied());
        }
        String::from_utf16(&units).context("Unpaired Unicode surrogate in .strings value")
    }

    fn punctuation(&mut self, expected: char) -> Result<()> {
        self.skip()?;
        ensure!(
            self.take()? == expected,
            "Expected '{expected}' in .strings entry"
        );
        Ok(())
    }
}

fn parse_strings(text: &str) -> Result<BTreeMap<String, Entry>> {
    let mut parser = Strings { text, offset: 0 };
    let mut result = BTreeMap::new();
    loop {
        let description = parser.skip()?;
        if parser.remaining().is_empty() {
            return Ok(result);
        }
        let key = parser.string()?;
        parser.punctuation('=')?;
        parser.skip()?;
        let value = parser.string()?;
        parser.punctuation(';')?;
        ensure!(
            result
                .insert(
                    key.clone(),
                    Entry {
                        value: Value::String(value),
                        description
                    }
                )
                .is_none(),
            "Duplicate .strings key: {key}"
        );
    }
}

fn plist_dictionary(
    node: roxmltree::Node<'_, '_>,
    depth: usize,
) -> Result<BTreeMap<String, Entry>> {
    ensure!(depth <= 2, "Unsupported nested stringsdict dictionary");
    ensure!(node.has_tag_name("dict"), "Expected plist dictionary");
    let mut result = BTreeMap::new();
    let mut comments = Vec::new();
    let mut key: Option<String> = None;
    for child in node.children() {
        if child.is_comment() {
            comments.push(child.text().unwrap_or("").trim().to_owned());
        } else if child.is_text() {
            ensure!(
                child.text().unwrap_or("").trim().is_empty(),
                "Unexpected plist dictionary text"
            );
        } else if child.is_element() {
            if let Some(name) = key.take() {
                let value = if child.has_tag_name("string") {
                    ensure!(
                        !child.children().any(|n| n.is_element()),
                        "Nested element in plist string"
                    );
                    Value::String(
                        child
                            .children()
                            .filter(|n| n.is_text())
                            .filter_map(|n| n.text())
                            .collect(),
                    )
                } else {
                    Value::Object(
                        plist_dictionary(child, depth + 1)?
                            .into_iter()
                            .map(|(key, entry)| (key, entry.value))
                            .collect(),
                    )
                };
                ensure!(
                    result
                        .insert(
                            name.clone(),
                            Entry {
                                value,
                                description: comments.join("\n\n")
                            }
                        )
                        .is_none(),
                    "Duplicate plist key: {name}"
                );
                comments.clear();
            } else {
                ensure!(
                    child.has_tag_name("key") && !child.children().any(|n| n.is_element()),
                    "Expected plist key"
                );
                key = Some(
                    child
                        .children()
                        .filter(|n| n.is_text())
                        .filter_map(|n| n.text())
                        .collect::<String>(),
                );
            }
        }
    }
    ensure!(key.is_none(), "Plist key has no value");
    Ok(result)
}

pub fn parse_resource(path: &Path, data: &[u8]) -> Result<BTreeMap<String, Entry>> {
    let text = decode(data)?;
    match path.extension().and_then(|value| value.to_str()) {
        Some("strings") => parse_strings(&text),
        Some("stringsdict") => {
            let document = roxmltree::Document::parse_with_options(
                &text,
                roxmltree::ParsingOptions {
                    allow_dtd: true,
                    nodes_limit: 1_000_000,
                    ..Default::default()
                },
            )?;
            let root = document.root_element();
            ensure!(root.has_tag_name("plist"), "Expected plist root");
            let children: Vec<_> = root.children().filter(|n| n.is_element()).collect();
            ensure!(children.len() == 1, "Expected one plist dictionary");
            let entries = plist_dictionary(children[0], 0)?;
            ensure!(
                entries.values().all(|entry| entry.value.is_object()),
                "stringsdict entries must be dictionaries"
            );
            Ok(entries)
        }
        _ => bail!(
            "Expected .strings or .stringsdict resource: {}",
            path.display()
        ),
    }
}

pub fn plural_localization(entry: &Value) -> Result<Value> {
    let entry = entry.as_object().context("Expected stringsdict entry")?;
    let format = entry
        .get("NSStringLocalizedFormatKey")
        .and_then(Value::as_str)
        .context("Missing NSStringLocalizedFormatKey")?;
    let mut substitutions = Map::new();
    let mut offset = 0;
    let mut next_argument = 1;
    while let Some(relative) = format[offset..].find('%') {
        offset += relative;
        let remaining = &format[offset..];
        let digits = remaining[1..]
            .bytes()
            .take_while(u8::is_ascii_digit)
            .count();
        let (argument, named, prefix) =
            if digits > 0 && remaining.as_bytes().get(digits + 1) == Some(&b'$') {
                let position = &remaining[1..digits + 1];
                ensure!(
                    !position.starts_with('0'),
                    "Invalid stringsdict argument position"
                );
                (
                    position.parse::<u32>()?,
                    &remaining[digits + 2..],
                    digits + 2,
                )
            } else {
                (next_argument, &remaining[1..], 1)
            };
        if let Some(reference) = named.strip_prefix("#@") {
            let end = reference
                .find('@')
                .context("Unterminated stringsdict variable")?;
            let name = &reference[..end];
            ensure!(!name.is_empty(), "Empty stringsdict variable");
            ensure!(
                (1..=127).contains(&argument),
                "Invalid stringsdict argument position"
            );
            let rule = entry
                .get(name)
                .and_then(Value::as_object)
                .context("Unknown stringsdict variable")?;
            ensure!(
                rule.get("NSStringFormatSpecTypeKey")
                    .and_then(Value::as_str)
                    == Some("NSStringPluralRuleType"),
                "Unsupported stringsdict rule"
            );
            let specifier = rule
                .get("NSStringFormatValueTypeKey")
                .and_then(Value::as_str)
                .context("Missing stringsdict argument type")?;
            let mut variants = Map::new();
            for (category, value) in rule {
                if ["NSStringFormatSpecTypeKey", "NSStringFormatValueTypeKey"]
                    .contains(&category.as_str())
                {
                    continue;
                }
                ensure!(
                    ["zero", "one", "two", "few", "many", "other"].contains(&category.as_str()),
                    "Unsupported stringsdict plural category: {category}"
                );
                ensure!(value.is_string(), "Plural branch must be text");
                variants.insert(category.clone(), json!({"stringUnit":{"value":value}}));
            }
            ensure!(
                variants.contains_key("other"),
                "stringsdict plural requires other"
            );
            let substitution = json!({"argNum":argument,"formatSpecifier":specifier,"variations":{"plural":variants}});
            if let Some(previous) = substitutions.insert(name.into(), substitution.clone()) {
                ensure!(
                    previous == substitution,
                    "Conflicting stringsdict argument positions"
                );
            }
            next_argument = argument + 1;
            offset += prefix + 2 + end + 1;
        } else {
            let token = parse_specifier(remaining, next_argument)?;
            for item in [token.width, token.precision]
                .into_iter()
                .flatten()
                .filter_map(|amount| match amount {
                    Amount::Argument(argument) => Some(argument),
                    _ => None,
                })
                .chain(token.argument)
            {
                if item.reference == ArgumentReference::Implicit {
                    next_argument = item.index + 1;
                }
            }
            offset += token.raw.len();
        }
    }
    ensure!(
        !substitutions.is_empty() && entry.len() == substitutions.len() + 1,
        "Unreferenced stringsdict fields"
    );
    Ok(json!({"stringUnit":{"value":format},"substitutions":substitutions}))
}

pub fn verify_resources(
    files: &BTreeMap<PathBuf, Vec<u8>>,
    source_locale: Option<&str>,
    options: VerificationOptions,
) -> Result<Vec<VerificationIssue>> {
    let mut catalogs = BTreeMap::new();
    let mut native = BTreeMap::<String, NativeCatalog>::new();
    for (path, data) in files {
        if path
            .extension()
            .is_some_and(|extension| extension == "xcstrings")
        {
            catalogs.insert(path.display().to_string(), serde_json::from_slice(data)?);
            continue;
        }
        ensure!(
            path.extension()
                .is_some_and(|extension| extension == "strings" || extension == "stringsdict"),
            "Apple verification accepts only .xcstrings, .strings, or .stringsdict files: {}",
            path.display()
        );
        source_locale
            .context("--source-locale is required for .strings/.stringsdict verification")?;
        let directory = path.parent().context("Missing locale directory")?;
        let locale = directory
            .file_name()
            .and_then(|s| s.to_str())
            .and_then(|s| s.strip_suffix(".lproj"))
            .context("Apple resources must be inside a locale.lproj directory")?;
        let table = directory
            .parent()
            .unwrap_or(Path::new(""))
            .join(path.file_stem().context("Missing table name")?)
            .display()
            .to_string();
        let catalog = native.entry(table).or_default();
        catalog.locales.insert(locale.into());
        for (key, entry) in parse_resource(path, data)
            .with_context(|| format!("Invalid Apple resource: {}", path.display()))?
        {
            let value = if path
                .extension()
                .is_some_and(|extension| extension == "stringsdict")
            {
                plural_localization(&entry.value)
                    .with_context(|| format!("Invalid plural in {}: {key}", path.display()))?
            } else {
                json!({"stringUnit":{"value":entry.value}})
            };
            let localizations = catalog
                .strings
                .entry(key.clone())
                .or_insert_with(|| json!({"localizations":{}}))["localizations"]
                .as_object_mut()
                .unwrap();
            // Foundation prefers stringsdict entries over their strings fallback.
            if path
                .extension()
                .is_some_and(|extension| extension == "stringsdict")
                || !localizations.contains_key(locale)
            {
                localizations.insert(locale.into(), value);
            }
        }
    }
    let mut issues = if catalogs.is_empty() {
        Vec::new()
    } else {
        crate::xcstrings::verify_catalogs(
            &catalogs,
            source_locale,
            crate::xcstrings::VerificationOptions {
                missing_keys: options.missing_keys,
                structural_equality: options.structural_equality,
            },
        )?
    };
    for (table, mut catalog) in native {
        let source = source_locale.unwrap();
        ensure!(
            catalog.locales.contains(source),
            "Missing source locale for table {table}"
        );
        catalog.strings.retain(|key, item| {
            let localizations = item["localizations"].as_object().unwrap();
            let has_source = localizations.contains_key(source);
            for locale in &catalog.locales {
                if locale == source {
                    continue;
                }
                let exists = localizations.contains_key(locale);
                let error = if options.extra_keys && !has_source && exists {
                    Some("Extra translation key")
                } else if options.missing_keys && has_source && !exists {
                    Some("Missing translation key")
                } else {
                    None
                };
                if let Some(error) = error {
                    issues.push(VerificationIssue {
                        locale: locale.clone(),
                        message_id: format!("{table}: {key}"),
                        error: error.into(),
                    });
                }
            }
            has_source
        });
        let normalized = BTreeMap::from([(
            table,
            json!({
                "sourceLanguage":source,"version":"1.0","strings":catalog.strings
            }),
        )]);
        issues.extend(crate::xcstrings::verify_normalized_catalogs(
            &normalized,
            Some(source),
            crate::xcstrings::VerificationOptions {
                missing_keys: false,
                structural_equality: options.structural_equality,
            },
        )?);
    }
    ensure!(!files.is_empty(), "No Apple resource catalogs found");
    issues.sort_by(|left, right| {
        (&left.locale, &left.message_id, &left.error).cmp(&(
            &right.locale,
            &right.message_id,
            &right.error,
        ))
    });
    Ok(issues)
}
