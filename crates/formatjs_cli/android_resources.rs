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
    pub entities: BTreeMap<String, usize>,
    pub markup: Vec<Markup>,
    pub reference: Option<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct Markup {
    pub name: String,
    pub attributes: BTreeMap<String, String>,
    pub children: Vec<Markup>,
}

fn is_xliff(node: Node<'_, '_>) -> bool {
    node.tag_name()
        .namespace()
        .is_some_and(|ns| ns.starts_with("urn:oasis:names:tc:xliff:document:"))
}

fn expanded_name(namespace: Option<&str>, name: &str) -> String {
    match namespace {
        Some(namespace) => format!("{{{namespace}}}{name}"),
        None => name.to_owned(),
    }
}

fn markup(node: Node<'_, '_>) -> Vec<Markup> {
    let mut spans = Vec::new();
    for child in node.children().filter(Node::is_element) {
        let children = markup(child);
        if is_xliff(child) {
            spans.extend(children);
        } else {
            spans.push(Markup {
                name: expanded_name(child.tag_name().namespace(), child.tag_name().name()),
                attributes: child
                    .attributes()
                    .map(|attribute| {
                        (
                            expanded_name(attribute.namespace(), attribute.name()),
                            attribute.value().to_owned(),
                        )
                    })
                    .collect(),
                children,
            });
        }
    }
    // Translation may reorder siblings, but must preserve multiplicity and nesting.
    spans.sort();
    spans
}

fn reference(node: Node<'_, '_>, spans: &[Markup]) -> Option<String> {
    // AAPT tries references on XML-decoded text before Android unescaping, and
    // treats styled strings as text even when their contents look like aliases.
    if !spans.is_empty() {
        return None;
    }
    let raw: String = node
        .descendants()
        .filter(Node::is_text)
        .filter_map(|text| text.text())
        .collect();
    let raw = raw.trim();
    if raw == "@null" || raw == "@empty" {
        return Some(raw.to_owned());
    }
    let (kind, name) = raw.split_at_checked(1)?;
    if !matches!(kind, "@" | "?")
        || name.is_empty()
        || name
            .chars()
            .any(|c| c.is_whitespace() || matches!(c, '"' | '\\' | '\''))
    {
        return None;
    }
    let (marker, name) = if kind == "@" && (name.starts_with('+') || name.starts_with('*')) {
        name.split_at(1)
    } else {
        ("", name)
    };
    let (package, name) = name
        .split_once(':')
        .map_or((None, name), |(package, name)| (Some(package), name));
    if name.contains(':') || package.is_some_and(str::is_empty) {
        return None;
    }
    let (resource_type, entry) = name.split_once('/').unwrap_or(("", name));
    if entry.is_empty() || entry.contains('/') {
        return None;
    }
    let resource_type = if kind == "?" {
        if !matches!(resource_type, "" | "attr") {
            return None;
        }
        "attr"
    } else {
        if resource_type.is_empty() || (marker == "+" && resource_type != "id") {
            return None;
        }
        resource_type
    };
    // AAPT resolves package prefixes through Android resource namespaces.
    let package = package
        .map(|package| match node.lookup_namespace_uri(Some(package)) {
            Some("http://schemas.android.com/apk/res-auto") => "",
            Some(namespace) => namespace
                .strip_prefix("http://schemas.android.com/apk/res/")
                .unwrap_or(package),
            None => package,
        })
        .filter(|package| !package.is_empty());
    let package = package.map_or(String::new(), |package| format!("{package}:"));
    Some(format!("{kind}{marker}{package}{resource_type}/{entry}"))
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
                let xliff = is_xliff(child);
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

// Scan reference spellings only after XML parsing. DOM text has already expanded
// entities, so it cannot distinguish &brand; from equivalent literal text.
fn entities(node: Node<'_, '_>) -> BTreeMap<String, usize> {
    let raw = &node.document().input_text()[node.range()];
    let mut references = BTreeMap::new();
    let mut remaining = raw;
    while !remaining.is_empty() {
        let opaque = [("<![CDATA[", "]]>"), ("<!--", "-->"), ("<?", "?>")]
            .into_iter()
            .find(|(start, _)| remaining.starts_with(start));
        if let Some((_, end)) = opaque {
            remaining = &remaining[remaining.find(end).unwrap() + end.len()..];
        } else if let Some(reference) = remaining.strip_prefix('&') {
            let end = reference.find(';').unwrap();
            let name = &reference[..end];
            if !name.starts_with('#') && !matches!(name, "amp" | "lt" | "gt" | "apos" | "quot") {
                *references.entry(name.to_owned()).or_default() += 1;
            }
            remaining = &reference[end + 1..];
        } else {
            remaining = &remaining[remaining.chars().next().unwrap().len_utf8()..];
        }
    }
    references
}

fn item(node: Node<'_, '_>, inherited: bool) -> Result<Item> {
    let mut text = Text::default();
    text.element(node)?;
    if text.space && text.units.last() == Some(&(b' ' as u16)) {
        text.units.pop();
    }
    let markup = markup(node);
    let reference = reference(node, &markup);
    Ok(Item {
        markup,
        reference,
        text: String::from_utf16(&text.units).context("Invalid Android UTF-16 escape")?,
        formatted: formatted(node, inherited)?,
        entities: entities(node),
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
    let language = canonical_language(language);
    Ok(if rest.is_empty() {
        language.into()
    } else {
        format!("{language}-{rest}")
    })
}

fn canonical_language(language: &str) -> &str {
    match language {
        "iw" => "he",
        "in" => "id",
        "ji" => "yi",
        other => other,
    }
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

// Android only looks up quantities the locale's plural rules select, and lint's
// UnusedQuantity flags the rest. Locales without CLDR rules are skipped, as lint does.
// Current Android lint (targetSdk 34+) checks UnusedQuantity against CLDR 42.
// CLDR added these categories later, so lint still flags them even though our
// newer data allows them.
const ANDROID_LINT_UNUSED: &[(&str, &str)] = &[("gl", "many"), ("vi", "one")];

fn unused_plural_categories(
    table: &Path,
    language: &str,
    catalog: &BTreeMap<String, Resource>,
) -> Vec<VerificationIssue> {
    let end = language.find(['-', '_']).unwrap_or(language.len());
    let base = language[..end].to_ascii_lowercase();
    let canonical = canonical_language(&base);
    let locale = format!("{canonical}{}", &language[end..]);
    let Some(categories) = crate::plural_categories::cardinal_categories(&locale) else {
        return Vec::new();
    };
    let allowed: Vec<&str> = categories
        .iter()
        .copied()
        .filter(|category| {
            !ANDROID_LINT_UNUSED
                .iter()
                .any(|(lang, unused)| *lang == canonical && unused == category)
        })
        .collect();
    catalog
        .iter()
        .filter_map(|(key, resource)| match resource {
            Resource::Plurals(plurals) => Some((key, plurals)),
            _ => None,
        })
        .flat_map(|(key, plurals)| {
            let allowed = &allowed;
            plurals
                .keys()
                .filter(move |quantity| !allowed.contains(&quantity.as_str()))
                .map(move |quantity| VerificationIssue {
                    locale: language.into(),
                    message_id: format!("{}: {key}/{quantity}", table.display()),
                    error: format!(
                        "Plural quantity {quantity} is not used by {language} in CLDR {} or Android lint; allowed: {}",
                        crate::plural_categories::CLDR_VERSION,
                        allowed.join(", ")
                    ),
                })
        })
        .collect()
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
    if options.structural_equality {
        for (table, catalogs) in &tables {
            for (language, catalog) in catalogs {
                issues.extend(unused_plural_categories(table, language, catalog));
            }
        }
    }
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
                        let item_id = format!("{message_id}/{suffix}");
                        if source_item.entities != target_item.entities {
                            issues.push(VerificationIssue {
                                locale: language.clone(),
                                message_id: item_id.clone(),
                                error: format!(
                                    "Android entity references changed: expected {:?}, found {:?}",
                                    source_item.entities, target_item.entities
                                ),
                            });
                        }
                        if source_item.markup != target_item.markup {
                            issues.push(VerificationIssue {
                                locale: language.clone(),
                                message_id: item_id.clone(),
                                error: format!(
                                    "Android markup changed: expected {:?}, found {:?}",
                                    source_item.markup, target_item.markup
                                ),
                            });
                        }
                        if source_item.reference != target_item.reference {
                            issues.push(VerificationIssue {
                                locale: language.clone(),
                                message_id: item_id.clone(),
                                error: format!(
                                    "Android resource reference changed: expected {:?}, found {:?}",
                                    source_item.reference, target_item.reference
                                ),
                            });
                        }
                        issues.extend(verify_item(source_item, target_item, language, &item_id)?);
                    }
                }
            }
        }
    }
    Ok(issues)
}
