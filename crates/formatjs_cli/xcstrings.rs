use crate::apple_printf::{Requirement, add_specifier, signature};
pub use crate::printf_validation::VerificationIssue;
use anyhow::{Context, Result, bail, ensure};
use formatjs_apple_printf_parser::{ArgumentReference, parse_specifier};
use serde::Deserialize;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

type Signature = BTreeMap<u32, BTreeSet<Requirement>>;

#[derive(Debug, Clone, Copy, Default)]
pub struct VerificationOptions {
    pub missing_keys: bool,
    pub structural_equality: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Catalog {
    source_language: String,
    version: String,
    strings: BTreeMap<String, Entry>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Entry {
    #[serde(default)]
    localizations: BTreeMap<String, Localization>,
    should_translate: Option<bool>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct Localization {
    string_unit: Option<StringUnit>,
    #[serde(default)]
    variations: BTreeMap<String, BTreeMap<String, Localization>>,
    #[serde(default)]
    substitutions: BTreeMap<String, Substitution>,
}

#[derive(Deserialize)]
struct StringUnit {
    value: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Substitution {
    arg_num: u32,
    format_specifier: String,
    #[serde(flatten)]
    localization: Localization,
}

#[derive(Clone)]
struct Leaf {
    path: Vec<(String, String)>,
    signature: Signature,
    host_signature: Signature,
    substitutions: Vec<SubstitutionLeaf>,
}

#[derive(Clone)]
struct SubstitutionLeaf {
    path: String,
    variants: Vec<(String, String)>,
    argument: u32,
    declared: Signature,
    signature: Signature,
}

fn merge(into: &mut Signature, from: &Signature) {
    for (index, requirements) in from {
        into.entry(*index).or_default().extend(requirements);
    }
}

fn metadata(substitution: &Substitution) -> Result<Signature> {
    ensure!(
        (1..=127).contains(&substitution.arg_num),
        "Invalid substitution argNum: {}",
        substitution.arg_num
    );
    let input = format!("%{}", substitution.format_specifier);
    let token = parse_specifier(&input, 1).context("Invalid substitution formatSpecifier")?;
    ensure!(
        token.raw == input
            && token
                .argument
                .is_some_and(|argument| argument.reference == ArgumentReference::Implicit)
            && token.flags.is_empty()
            && token.width.is_none()
            && token.precision.is_none(),
        "Expected one argument type in substitution formatSpecifier"
    );
    let mut declared = signature(&input)?;
    let requirement = declared
        .remove(&1)
        .context("Expected an argument in substitution formatSpecifier")?;
    Ok(BTreeMap::from([(substitution.arg_num, requirement)]))
}

// Named references carry catalog argument positions, independently of printf indexing.
fn message_signature(
    input: &str,
    substitutions: &BTreeMap<String, Substitution>,
    current: Option<&Substitution>,
) -> Result<(Signature, BTreeSet<String>)> {
    let mut position = 0;
    let mut next_argument = current.map_or(1, |substitution| substitution.arg_num);
    let mut indexing = None;
    let mut used = BTreeSet::new();
    let mut output = Signature::new();
    while let Some(offset) = input[position..].find('%') {
        position += offset;
        let remaining = &input[position..];
        let after_percent = &remaining[1..];
        let digits = after_percent.bytes().take_while(u8::is_ascii_digit).count();
        let (explicit, named) = if digits > 0 && after_percent.as_bytes().get(digits) == Some(&b'$')
        {
            (Some(&after_percent[..digits]), &after_percent[digits + 1..])
        } else {
            (None, after_percent)
        };
        if named.starts_with("arg") {
            let substitution = current.context("%arg is only valid inside a substitution")?;
            if let Some(explicit) = explicit {
                ensure!(
                    !explicit.starts_with('0') && explicit.parse::<u32>()? == substitution.arg_num,
                    "%arg position differs from owning substitution argNum"
                );
            }
            merge(&mut output, &metadata(substitution)?);
            if explicit.is_none() {
                next_argument = substitution.arg_num + 1;
            }
            position += remaining.len() - named.len() + 3;
            continue;
        }
        if let Some(name_start) = named.strip_prefix("#@") {
            let end = name_start
                .find('@')
                .context("Unterminated named substitution")?;
            let name = &name_start[..end];
            ensure!(!name.is_empty(), "Empty named substitution");
            let substitution = substitutions
                .get(name)
                .with_context(|| format!("Unknown substitution: {name}"))?;
            let declared = metadata(substitution)?;
            if let Some(explicit) = explicit {
                ensure!(
                    !explicit.starts_with('0') && explicit.parse::<u32>()? == substitution.arg_num,
                    "Substitution {name} position differs from argNum"
                );
            } else {
                next_argument = substitution.arg_num + 1;
            }
            merge(&mut output, &declared);
            used.insert(name.to_owned());
            position += remaining.len() - name_start.len() + end + 1;
            continue;
        }
        let token = parse_specifier(remaining, next_argument)
            .map_err(|mut error| {
                error.span.start += position;
                error.span.end += position;
                error
            })
            .context("Invalid Apple printf syntax")?;
        for argument in [token.width, token.precision]
            .into_iter()
            .flatten()
            .filter_map(|amount| match amount {
                formatjs_apple_printf_parser::Amount::Argument(argument) => Some(argument),
                _ => None,
            })
            .chain(token.argument)
        {
            if indexing.is_some_and(|previous| previous != argument.reference) {
                bail!("MixedIndexing in Apple printf arguments");
            }
            indexing = Some(argument.reference);
            if argument.reference == ArgumentReference::Implicit {
                next_argument = argument.index + 1;
            }
        }
        add_specifier(&mut output, &token);
        position += token.raw.len();
    }
    Ok((output, used))
}

fn has_substitutions(node: &Localization) -> bool {
    !node.substitutions.is_empty()
        || node
            .variations
            .values()
            .flat_map(|cases| cases.values())
            .any(has_substitutions)
}

// Catalogs do not identify unformatted strings. Infer formats from source arguments;
// percent followed by whitespace remains ambiguous plain text (for example "50% off").
fn has_arguments(node: &Localization) -> bool {
    if has_substitutions(node) {
        return true;
    }
    if let Some(unit) = &node.string_unit {
        let mut offset = 0;
        while let Some(next) = unit.value[offset..].find('%') {
            offset += next;
            let remaining = &unit.value[offset..];
            if remaining.starts_with("%#@") {
                return true;
            }
            if let Ok(token) = parse_specifier(remaining, 1) {
                if token.argument.is_some() && remaining.as_bytes().get(1) != Some(&b' ') {
                    return true;
                }
                offset += token.raw.len();
            } else {
                offset += 1;
            }
        }
    }
    node.variations
        .values()
        .flat_map(|cases| cases.values())
        .any(has_arguments)
}

fn leaves(
    node: &Localization,
    path: &mut Vec<(String, String)>,
    current: Option<&Substitution>,
    output: &mut Vec<Leaf>,
    formatted: bool,
) -> Result<()> {
    ensure!(
        node.variations.len() <= 1,
        "Expected one variation axis per node"
    );
    ensure!(
        node.string_unit.is_some() != !node.variations.is_empty(),
        "Expected stringUnit or variations, exclusively"
    );
    if let Some(unit) = &node.string_unit {
        let (mut signature, used) = if formatted {
            message_signature(&unit.value, &node.substitutions, current)?
        } else {
            (Signature::new(), BTreeSet::new())
        };
        ensure!(
            used.len() == node.substitutions.len(),
            "Unused substitution metadata"
        );
        let host_signature = signature.clone();
        let mut branches = Vec::new();
        for (name, substitution) in &node.substitutions {
            let declared = metadata(substitution)?;
            let mut children = Vec::new();
            leaves(
                &substitution.localization,
                &mut Vec::new(),
                Some(substitution),
                &mut children,
                true,
            )?;
            for child in children {
                ensure!(
                    child.substitutions.is_empty(),
                    "Nested named substitutions are unsupported"
                );
                merge(&mut signature, &child.signature);
                branches.push(SubstitutionLeaf {
                    path: format!("substitutions.{name}.{}", path_label(&child.path)),
                    variants: child.path,
                    argument: substitution.arg_num,
                    declared: declared.clone(),
                    signature: child.signature,
                });
            }
        }
        output.push(Leaf {
            path: path.clone(),
            signature,
            host_signature,
            substitutions: branches,
        });
    } else {
        ensure!(
            node.substitutions.is_empty(),
            "Substitutions must belong to a stringUnit"
        );
        for (axis, cases) in &node.variations {
            ensure!(
                matches!(axis.as_str(), "plural" | "device"),
                "Unsupported variation axis: {axis}"
            );
            ensure!(cases.contains_key("other"), "Missing {axis}.other fallback");
            for (case, child) in cases {
                if axis == "plural" {
                    ensure!(
                        ["zero", "one", "two", "few", "many", "other"].contains(&case.as_str()),
                        "Invalid plural category: {case}"
                    );
                }
                path.push((axis.clone(), case.clone()));
                leaves(child, path, current, output, formatted)
                    .with_context(|| format!("{axis}.{case}"))?;
                path.pop();
            }
        }
    }
    Ok(())
}

fn path_label(path: &[(String, String)]) -> String {
    path.iter()
        .flat_map(|(axis, case)| [axis.as_str(), case.as_str()])
        .collect::<Vec<_>>()
        .join(".")
}

fn numeric(requirements: &BTreeSet<Requirement>) -> bool {
    requirements.iter().any(|requirement| {
        matches!(
            requirement,
            Requirement::SignedInteger(_)
                | Requirement::UnsignedInteger(_)
                | Requirement::Double
                | Requirement::LongDouble
        )
    })
}

fn preferred_case<'a>(
    target: &[(String, String)],
    mut source: impl Iterator<Item = &'a Vec<(String, String)>>,
    axis: &str,
) -> Option<String> {
    let (_, case) = target.iter().find(|(kind, _)| kind == axis)?;
    Some(
        if source.any(|path| {
            path.iter()
                .any(|(kind, value)| kind == axis && value == case)
        }) {
            case.clone()
        } else {
            "other".into()
        },
    )
}

fn matches_case(path: &[(String, String)], axis: &str, selected: Option<&str>) -> bool {
    path.iter()
        .all(|(kind, case)| kind != axis || selected.is_none_or(|selected| case == selected))
}

fn compare_leaves(source: &[Leaf], target: &[Leaf]) -> Vec<String> {
    let mut errors = BTreeSet::new();
    for target in target {
        let device = preferred_case(&target.path, source.iter().map(|leaf| &leaf.path), "device");
        let candidates: Vec<_> = source
            .iter()
            .filter(|leaf| matches_case(&leaf.path, "device", device.as_deref()))
            .collect();
        if candidates.is_empty() {
            errors.insert(format!(
                "{}: No source device fallback",
                path_label(&target.path)
            ));
            continue;
        }
        // Plural branches may omit the selector; other argument requirements must survive.
        let plural = target.path.iter().any(|(axis, _)| axis == "plural")
            || candidates
                .iter()
                .any(|leaf| leaf.path.iter().any(|(axis, _)| axis == "plural"));
        let mut contract = Signature::new();
        for candidate in &candidates {
            merge(&mut contract, &candidate.signature);
        }
        let selectors: Vec<_> = if plural {
            contract
                .iter()
                .filter(|(_, requirements)| numeric(requirements))
                .map(|(index, _)| *index)
                .collect()
        } else {
            Vec::new()
        };
        if selectors.len() > 1 {
            errors.insert(format!(
                "{}: Ambiguous plural selector; use substitution metadata",
                path_label(&target.path)
            ));
            continue;
        }
        let plural_case = preferred_case(
            &target.path,
            candidates.iter().map(|leaf| &leaf.path),
            "plural",
        );
        let mut expected = Signature::new();
        for candidate in &candidates {
            if matches_case(&candidate.path, "plural", plural_case.as_deref()) {
                merge(&mut expected, &candidate.signature);
            }
        }
        // Translations may print an argument that the corresponding source branch omits.
        for index in target.signature.keys() {
            if let Some(requirements) = contract.get(index) {
                expected.insert(*index, requirements.clone());
            }
        }
        if let Some(selector) = selectors.first() {
            if !target.signature.contains_key(selector) {
                expected.remove(selector);
            }
        }
        if let Some(error) = crate::printf_validation::compare(&expected, &target.signature) {
            let path = path_label(&target.path);
            errors.insert(if path.is_empty() {
                error
            } else {
                format!("{path}: {error}")
            });
        }
        for branch in &target.substitutions {
            if let Some(required) = contract.get(&branch.argument) {
                if !branch
                    .declared
                    .get(&branch.argument)
                    .is_some_and(|declared| declared.is_subset(required))
                {
                    errors.insert(format!(
                        "{}: Incompatible substitution argument {}",
                        branch.path, branch.argument
                    ));
                }
            }
            let source_branches: Vec<_> = candidates
                .iter()
                .flat_map(|leaf| &leaf.substitutions)
                .filter(|source| source.argument == branch.argument)
                .collect();
            let device = preferred_case(
                &branch.variants,
                source_branches.iter().map(|source| &source.variants),
                "device",
            );
            let device_branches: Vec<_> = source_branches
                .iter()
                .filter(|source| matches_case(&source.variants, "device", device.as_deref()))
                .collect();
            let plural = preferred_case(
                &branch.variants,
                device_branches.iter().map(|source| &source.variants),
                "plural",
            );
            let mut branch_contract = Signature::new();
            for source in device_branches {
                if matches_case(&source.variants, "plural", plural.as_deref()) {
                    merge(&mut branch_contract, &source.signature);
                }
            }
            if source_branches.is_empty() {
                branch_contract = contract.clone();
            }
            for index in branch_contract.keys() {
                if *index != branch.argument
                    && !target.host_signature.contains_key(index)
                    && !branch.signature.contains_key(index)
                {
                    errors.insert(format!("{}: Missing argument {index}", branch.path));
                }
            }
            for (index, requirement) in &branch.signature {
                match contract.get(index) {
                    Some(required) if required == requirement => {}
                    Some(_) => {
                        errors.insert(format!("{}: Incompatible argument {index}", branch.path));
                    }
                    None => {
                        errors.insert(format!("{}: Unexpected argument {index}", branch.path));
                    }
                }
            }
        }
    }
    errors.into_iter().collect()
}

/// Validates read-only Xcode catalogs. Paths namespace independent string tables.
pub fn verify_catalogs(
    catalogs: &BTreeMap<String, Value>,
    source_locale: Option<&str>,
    options: VerificationOptions,
) -> Result<Vec<VerificationIssue>> {
    ensure!(!catalogs.is_empty(), "No .xcstrings catalogs found");
    let mut parsed = BTreeMap::new();
    let mut locales = BTreeSet::new();
    for (file, value) in catalogs {
        ensure!(
            file.ends_with(".xcstrings"),
            "Apple verification accepts only .xcstrings files: {file}"
        );
        let catalog: Catalog = serde_json::from_value(value.clone())
            .with_context(|| format!("Invalid .xcstrings catalog: {file}"))?;
        ensure!(
            ["1.0", "1.1"].contains(&catalog.version.as_str()),
            "Unsupported .xcstrings version: {}",
            catalog.version
        );
        ensure!(
            !catalog.source_language.is_empty(),
            "Empty sourceLanguage in {file}"
        );
        if let Some(source) = source_locale {
            ensure!(
                source == catalog.source_language,
                "Source locale {source} differs from sourceLanguage {} in {file}",
                catalog.source_language
            );
        }
        for entry in catalog.strings.values() {
            locales.extend(entry.localizations.keys().cloned());
        }
        parsed.insert(file, catalog);
    }
    let mut issues = Vec::new();
    for (file, catalog) in &parsed {
        for (key, entry) in &catalog.strings {
            if entry.should_translate == Some(false) {
                continue;
            }
            let fallback = Localization {
                string_unit: Some(StringUnit { value: key.clone() }),
                ..Default::default()
            };
            let source = entry
                .localizations
                .get(&catalog.source_language)
                .unwrap_or(&fallback);
            let id = format!("{file}: {key}");
            let mut source_leaves = Vec::new();
            let formatted = has_arguments(source);
            if options.structural_equality {
                if let Err(error) =
                    leaves(source, &mut Vec::new(), None, &mut source_leaves, formatted)
                {
                    issues.push(VerificationIssue {
                        locale: catalog.source_language.clone(),
                        message_id: id.clone(),
                        error: format!("{error:#}"),
                    });
                    continue;
                }
                let indices: BTreeSet<_> = source_leaves
                    .iter()
                    .flat_map(|leaf| leaf.signature.keys().copied())
                    .collect();
                if let Some((offset, _)) = indices
                    .iter()
                    .enumerate()
                    .find(|(offset, index)| **index != *offset as u32 + 1)
                {
                    issues.push(VerificationIssue {
                        locale: catalog.source_language.clone(),
                        message_id: id.clone(),
                        error: format!("Unknown source argument type at position {}", offset + 1),
                    });
                    continue;
                }
                for error in compare_leaves(&source_leaves, &source_leaves) {
                    issues.push(VerificationIssue {
                        locale: catalog.source_language.clone(),
                        message_id: id.clone(),
                        error,
                    });
                }
            }
            for locale in &locales {
                if locale == &catalog.source_language {
                    continue;
                }
                let Some(target) = entry.localizations.get(locale) else {
                    if options.missing_keys {
                        issues.push(VerificationIssue {
                            locale: locale.clone(),
                            message_id: id.clone(),
                            error: "Missing translation key".into(),
                        });
                    }
                    continue;
                };
                if options.structural_equality {
                    let mut target_leaves = Vec::new();
                    match leaves(
                        target,
                        &mut Vec::new(),
                        None,
                        &mut target_leaves,
                        formatted || has_substitutions(target),
                    ) {
                        Err(error) => issues.push(VerificationIssue {
                            locale: locale.clone(),
                            message_id: id.clone(),
                            error: format!("{error:#}"),
                        }),
                        Ok(()) => {
                            for error in compare_leaves(&source_leaves, &target_leaves) {
                                issues.push(VerificationIssue {
                                    locale: locale.clone(),
                                    message_id: id.clone(),
                                    error,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    issues.sort_by(|left, right| {
        (&left.locale, &left.message_id, &left.error).cmp(&(
            &right.locale,
            &right.message_id,
            &right.error,
        ))
    });
    Ok(issues)
}
