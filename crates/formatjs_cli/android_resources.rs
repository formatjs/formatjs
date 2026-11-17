use anyhow::{Context, Result, bail, ensure};
use roxmltree::{Document, Node, ParsingOptions};
use serde_json::json;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::{Path, PathBuf};

pub use crate::printf_validation::VerificationIssue;

#[derive(Clone, Copy, Debug, Default)]
pub struct VerificationOptions {
    pub missing_keys: bool,
    pub extra_keys: bool,
    pub structural_equality: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Item {
    pub text: String,
    pub formatted: bool,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Resource {
    String(Item),
    Array(Vec<Item>),
    Plurals(BTreeMap<String, Item>),
}

// XML references have already been decoded here. Android quotes and escapes apply
// to the decoded text, including apostrophes introduced by &apos;.
#[derive(Default)]
struct Text {
    units: Vec<u16>,
    quoted: bool,
    space: bool,
}

impl Text {
    fn append(&mut self, text: &str) -> Result<()> {
        let mut chars = text.chars();
        while let Some(character) = chars.next() {
            if !self.quoted
                && matches!(
                    character,
                    ' ' | '\t' | '\n' | '\r' | '\u{000b}' | '\u{000c}'
                )
            {
                if !self.space && !self.units.is_empty() {
                    self.units.push(b' ' as u16);
                }
                self.space = true;
                continue;
            }
            self.space = false;
            let character = match character {
                '\\' => match chars.next() {
                    Some('n') => '\n',
                    Some('t') => '\t',
                    Some('u') => {
                        let mut value = 0u16;
                        for _ in 0..4 {
                            let digit = chars
                                .next()
                                .and_then(|c| c.to_digit(16))
                                .context("Invalid Android Unicode escape")?;
                            value = (value << 4) | digit as u16;
                        }
                        self.units.push(value);
                        continue;
                    }
                    Some(escaped) => escaped,
                    None => continue,
                },
                '"' => {
                    self.quoted = !self.quoted;
                    continue;
                }
                '\'' if !self.quoted => {
                    bail!("Unescaped Android apostrophe; use \\' or double-quoted text")
                }
                other => other,
            };
            self.units
                .extend(character.encode_utf16(&mut [0; 2]).iter().copied());
        }
        Ok(())
    }

    fn element(&mut self, element: Node<'_, '_>) -> Result<()> {
        for child in element.children() {
            if child.is_text() {
                self.append(child.text().unwrap_or_default())?;
            } else if child.is_element() {
                let xliff = child
                    .tag_name()
                    .namespace()
                    .is_some_and(|ns| ns.starts_with("urn:oasis:names:tc:xliff:document:"));
                // Styled spans reset AAPT's quote/space state; xliff:g is metadata.
                if !xliff {
                    self.quoted = false;
                    self.space = false;
                }
                self.element(child)?;
                if !xliff {
                    self.quoted = false;
                    self.space = false;
                }
            }
        }
        Ok(())
    }
}

fn formatted(node: Node<'_, '_>, inherited: bool) -> Result<bool> {
    match node.attribute("formatted") {
        None => Ok(inherited),
        Some("true") => Ok(true),
        Some("false") => Ok(false),
        Some(_) => bail!("formatted must be true or false"),
    }
}

fn item(node: Node<'_, '_>, inherited: bool) -> Result<Item> {
    let mut text = Text::default();
    text.element(node)?;
    if text.space && text.units.last() == Some(&(b' ' as u16)) {
        text.units.pop();
    }
    Ok(Item {
        text: String::from_utf16(&text.units).context("Invalid Android UTF-16 escape")?,
        formatted: formatted(node, inherited)?,
    })
}

pub fn parse_resource(data: &[u8]) -> Result<BTreeMap<String, Resource>> {
    let text = std::str::from_utf8(data).context("Android resources must be UTF-8 XML")?;
    let document = Document::parse_with_options(
        text,
        ParsingOptions {
            allow_dtd: true,
            nodes_limit: 100_000,
            ..ParsingOptions::default()
        },
    )
    .context("Invalid Android resource XML")?;
    let root = document.root_element();
    ensure!(
        root.has_tag_name("resources"),
        "Expected Android <resources> root"
    );
    let mut resources = BTreeMap::new();
    for node in root.children().filter(Node::is_element) {
        let kind = node.tag_name().name();
        if !matches!(kind, "string" | "string-array" | "plurals") {
            continue;
        }
        let name = node
            .attribute("name")
            .context("Missing Android resource name")?;
        ensure!(!name.is_empty(), "Empty Android resource name");
        let mode = formatted(node, true)?;
        let resource = match kind {
            "string" => Resource::String(item(node, mode)?),
            "string-array" | "plurals" => {
                let mut array = Vec::new();
                let mut plurals = BTreeMap::new();
                for child in node.children().filter(Node::is_element) {
                    ensure!(
                        child.has_tag_name("item"),
                        "Expected <item> in {kind}/{name}"
                    );
                    let value = item(child, mode)?;
                    if kind == "plurals" {
                        let quantity = child
                            .attribute("quantity")
                            .context("Missing plural quantity")?;
                        ensure!(
                            matches!(quantity, "zero" | "one" | "two" | "few" | "many" | "other"),
                            "Invalid plural quantity: {quantity}"
                        );
                        ensure!(
                            plurals.insert(quantity.into(), value).is_none(),
                            "Duplicate plural quantity: {quantity}"
                        );
                    } else {
                        array.push(value);
                    }
                }
                if kind == "plurals" {
                    ensure!(
                        plurals.contains_key("other"),
                        "Missing other plural quantity: {name}"
                    );
                    Resource::Plurals(plurals)
                } else {
                    Resource::Array(array)
                }
            }
            _ => unreachable!(),
        };
        if node.attribute("translatable") == Some("false") {
            continue;
        }
        let kind = if kind == "string-array" {
            "array"
        } else {
            kind
        };
        ensure!(
            resources
                .insert(format!("{kind}/{name}"), resource)
                .is_none(),
            "Duplicate Android resource: {kind}/{name}"
        );
    }
    Ok(resources)
}

fn locale(directory: &str, source: &str) -> Result<String> {
    if directory == "values" {
        return Ok(source.into());
    }
    let qualifier = directory
        .strip_prefix("values-")
        .context("Android resources must be in values or values-<locale> directories")?;
    let tag = if let Some(tag) = qualifier.strip_prefix("b+") {
        tag.replace('+', "-")
    } else {
        let (language, region) = qualifier.split_once("-r").unwrap_or((qualifier, ""));
        ensure!(
            (language.len() == 2 || language.len() == 3)
                && language.bytes().all(|b| b.is_ascii_lowercase()),
            "Unsupported Android locale/configuration: {qualifier}"
        );
        ensure!(
            region.is_empty()
                || (region.len() == 2 && region.bytes().all(|b| b.is_ascii_uppercase()))
                || (region.len() == 3 && region.bytes().all(|b| b.is_ascii_digit())),
            "Unsupported Android locale/configuration: {qualifier}"
        );
        if region.is_empty() {
            language.into()
        } else {
            format!("{language}-{region}")
        }
    };
    ensure!(
        !tag.is_empty()
            && tag.split('-').all(|part| (2..=8).contains(&part.len())
                && part.bytes().all(|b| b.is_ascii_alphanumeric())),
        "Invalid Android locale: {qualifier}"
    );
    let (language, rest) = tag.split_once('-').unwrap_or((&tag, ""));
    ensure!(
        (2..=3).contains(&language.len()) && language.bytes().all(|b| b.is_ascii_lowercase()),
        "Invalid Android locale: {qualifier}"
    );
    let language = match language {
        "iw" => "he",
        "in" => "id",
        "ji" => "yi",
        other => other,
    };
    Ok(if rest.is_empty() {
        language.into()
    } else {
        format!("{language}-{rest}")
    })
}

fn items(resource: &Resource) -> BTreeMap<String, &Item> {
    match resource {
        Resource::String(item) => BTreeMap::from([(String::new(), item)]),
        Resource::Array(array) => array
            .iter()
            .enumerate()
            .map(|(i, item)| (i.to_string(), item))
            .collect(),
        Resource::Plurals(plurals) => plurals
            .iter()
            .map(|(key, item)| (key.clone(), item))
            .collect(),
    }
}

fn verify_item(
    source: &Item,
    target: &Item,
    locale: &str,
    key: &str,
) -> Result<Vec<VerificationIssue>> {
    if source.formatted != target.formatted {
        return Ok(vec![VerificationIssue {
            locale: locale.into(),
            message_id: key.into(),
            error: "Android formatting mode changed".into(),
        }]);
    }
    if !source.formatted {
        return Ok(Vec::new());
    }
    let catalogs = HashMap::from([
        ("source".into(), json!({key: source.text})),
        (locale.into(), json!({key: target.text})),
    ]);
    crate::java_printf::verify_catalogs(&catalogs, "source")
}

pub fn verify_resources(
    files: &BTreeMap<PathBuf, Vec<u8>>,
    source_locale: &str,
    options: VerificationOptions,
) -> Result<Vec<VerificationIssue>> {
    ensure!(!files.is_empty(), "No Android resource files matched");
    let mut tables = BTreeMap::<PathBuf, BTreeMap<String, BTreeMap<String, Resource>>>::new();
    for (path, data) in files {
        ensure!(
            path.extension().is_some_and(|ext| ext == "xml"),
            "Android verification accepts only XML files: {}",
            path.display()
        );
        let directory = path.parent().context("Missing Android locale directory")?;
        let locale = locale(
            directory
                .file_name()
                .and_then(|s| s.to_str())
                .context("Missing Android locale directory")?,
            source_locale,
        )?;
        let table = directory.parent().unwrap_or(Path::new(""));
        let catalog = tables
            .entry(table.into())
            .or_default()
            .entry(locale)
            .or_default();
        for (key, resource) in parse_resource(data)
            .with_context(|| format!("Invalid Android resource: {}", path.display()))?
        {
            ensure!(
                catalog.insert(key.clone(), resource).is_none(),
                "Duplicate Android resource across files: {}: {key}",
                path.display()
            );
        }
    }
    let mut issues = Vec::new();
    for (table, catalogs) in tables {
        let source = catalogs.get(source_locale).with_context(|| {
            format!(
                "Missing Android source locale {source_locale}: {}",
                table.display()
            )
        })?;
        for (language, target) in &catalogs {
            for key in source.keys().chain(target.keys()).collect::<BTreeSet<_>>() {
                let message_id = format!("{}: {key}", table.display());
                let error = match (source.get(key), target.get(key)) {
                    (Some(_), None) if options.missing_keys => Some("Missing translation key"),
                    (None, Some(_)) if options.extra_keys => Some("Extra translation key"),
                    _ => None,
                };
                if let Some(error) = error {
                    issues.push(VerificationIssue {
                        locale: language.clone(),
                        message_id: message_id.clone(),
                        error: error.into(),
                    });
                }
                if !options.structural_equality {
                    continue;
                }
                if let Some(resource) = target.get(key) {
                    // Validate every present item, including unmatched targets and sources.
                    for (suffix, item) in items(resource) {
                        issues.extend(verify_item(
                            item,
                            item,
                            language,
                            &format!("{message_id}/{suffix}"),
                        )?);
                    }
                }
                let (Some(before), Some(after)) = (source.get(key), target.get(key)) else {
                    continue;
                };
                if let (Resource::Array(before), Resource::Array(after)) = (before, after) {
                    if before.len() != after.len() {
                        issues.push(VerificationIssue {
                            locale: language.clone(),
                            message_id: message_id.clone(),
                            error: "Android array length changed".into(),
                        });
                    }
                }
                let before_items = items(before);
                for (suffix, target_item) in items(after) {
                    let source_item = before_items.get(&suffix).or_else(|| {
                        if matches!(before, Resource::Plurals(_)) {
                            before_items.get("other")
                        } else {
                            None
                        }
                    });
                    if let Some(source_item) = source_item {
                        issues.extend(verify_item(
                            source_item,
                            target_item,
                            language,
                            &format!("{message_id}/{suffix}"),
                        )?);
                    }
                }
            }
        }
    }
    Ok(issues)
}
