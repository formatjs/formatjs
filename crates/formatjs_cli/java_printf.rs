use anyhow::{Context, Result, bail};
use formatjs_java_printf_parser::{Conversion, Element, parse};
use serde::Serialize;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashMap};

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationIssue {
    pub locale: String,
    pub message_id: String,
    pub error: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Requirement {
    Boolean,
    HashCode,
    String,
    Formattable,
    Character,
    Integer,
    BigInteger,
    FloatingPoint,
    BinaryFloatingPoint,
    DateTime,
}

type Signature = BTreeMap<u32, BTreeSet<Requirement>>;

fn signature(message: &str) -> Result<Signature> {
    let mut signature = Signature::new();
    for element in parse(message).context("Invalid Java printf syntax")? {
        let Element::Specifier(specifier) = element else {
            continue;
        };
        let Some(argument) = specifier.argument else {
            continue;
        };
        let requirement = match specifier.conversion {
            Conversion::Boolean => Requirement::Boolean,
            Conversion::HashCode => Requirement::HashCode,
            Conversion::String if specifier.flags.contains('#') => Requirement::Formattable,
            Conversion::String => Requirement::String,
            Conversion::Character => Requirement::Character,
            Conversion::Octal | Conversion::Hexadecimal
                if specifier
                    .flags
                    .chars()
                    .any(|flag| matches!(flag, '+' | ' ' | '(')) =>
            {
                Requirement::BigInteger
            }
            Conversion::Decimal | Conversion::Octal | Conversion::Hexadecimal => {
                Requirement::Integer
            }
            Conversion::Scientific | Conversion::GeneralFloat | Conversion::DecimalFloat => {
                Requirement::FloatingPoint
            }
            Conversion::HexFloat => Requirement::BinaryFloatingPoint,
            Conversion::DateTime(_) => Requirement::DateTime,
            Conversion::Percent | Conversion::LineSeparator => continue,
        };
        signature
            .entry(argument.index)
            .or_default()
            .insert(requirement);
    }
    Ok(signature)
}

fn compare(source: &Signature, target: &Signature) -> Option<String> {
    let mut errors = Vec::new();
    for (index, required) in source {
        match target.get(index) {
            None => errors.push(format!("Missing argument {index}")),
            Some(actual) if actual != required => errors.push(format!(
                "Incompatible argument {index}: {required:?} vs {actual:?}"
            )),
            _ => {}
        }
    }
    for index in target.keys().filter(|index| !source.contains_key(index)) {
        errors.push(format!("Unexpected argument {index}"));
    }
    if errors.is_empty() {
        None
    } else {
        Some(errors.join("; "))
    }
}

fn messages(value: &Value, parent: &str, output: &mut BTreeMap<String, String>) -> Result<()> {
    let object = value
        .as_object()
        .context("Expected a JSON object of Java printf messages")?;
    for (key, value) in object {
        let key = if parent.is_empty() {
            key.clone()
        } else {
            format!("{parent}.{key}")
        };
        match value {
            Value::Object(_) => messages(value, &key, output)?,
            Value::String(message) => {
                if output.insert(key.clone(), message.clone()).is_some() {
                    bail!("Ambiguous Java printf message ID: {key}");
                }
            }
            _ => bail!(
                "Expected a Java printf string at {key}; split plural/array items into separate messages"
            ),
        }
    }
    Ok(())
}

/// Compares argument requirements; runtime Java values and types remain caller concerns.
pub fn verify_catalogs(
    locales: &HashMap<String, Value>,
    source_locale: &str,
) -> Result<Vec<VerificationIssue>> {
    let source = locales
        .get(source_locale)
        .with_context(|| format!("Missing source {source_locale}.json file"))?;
    let mut source_messages = BTreeMap::new();
    messages(source, "", &mut source_messages)
        .with_context(|| format!("Invalid catalog for locale {source_locale}"))?;
    let mut issues = Vec::new();
    let mut source_signatures = BTreeMap::new();
    for (id, message) in source_messages {
        match signature(&message) {
            Ok(signature) => {
                source_signatures.insert(id, signature);
            }
            Err(error) => issues.push(VerificationIssue {
                locale: source_locale.to_owned(),
                message_id: id,
                error: format!("{error:#}"),
            }),
        }
    }
    for (locale, content) in locales {
        if locale == source_locale {
            continue;
        }
        let mut target_messages = BTreeMap::new();
        messages(content, "", &mut target_messages)
            .with_context(|| format!("Invalid catalog for locale {locale}"))?;
        for (id, message) in target_messages {
            let error = match signature(&message) {
                Ok(target) => source_signatures
                    .get(&id)
                    .and_then(|source| compare(source, &target)),
                Err(error) => Some(format!("{error:#}")),
            };
            if let Some(error) = error {
                issues.push(VerificationIssue {
                    locale: locale.clone(),
                    message_id: id,
                    error,
                });
            }
        }
    }
    issues.sort_by(|left, right| {
        (&left.locale, &left.message_id).cmp(&(&right.locale, &right.message_id))
    });
    Ok(issues)
}
