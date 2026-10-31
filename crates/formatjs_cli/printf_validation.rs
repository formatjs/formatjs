use anyhow::{Context, Result, bail};
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

type Signature<R> = BTreeMap<u32, BTreeSet<R>>;

pub(crate) fn compare<R: Ord + std::fmt::Debug>(
    source: &Signature<R>,
    target: &Signature<R>,
) -> Option<String> {
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

fn messages(
    value: &Value,
    parent: &str,
    output: &mut BTreeMap<String, String>,
    dialect: &str,
) -> Result<()> {
    let object = value
        .as_object()
        .with_context(|| format!("Expected a JSON object of {dialect} messages"))?;
    for (key, value) in object {
        let key = if parent.is_empty() {
            key.clone()
        } else {
            format!("{parent}.{key}")
        };
        match value {
            Value::Object(_) => messages(value, &key, output, dialect)?,
            Value::String(message) => {
                if output.insert(key.clone(), message.clone()).is_some() {
                    bail!("Ambiguous {dialect} message ID: {key}");
                }
            }
            _ => bail!(
                "Expected a {dialect} string at {key}; split plural/array items into separate messages"
            ),
        }
    }
    Ok(())
}

pub(crate) fn verify_catalogs<R: Ord + std::fmt::Debug>(
    locales: &HashMap<String, Value>,
    source_locale: &str,
    dialect: &str,
    signature: impl Fn(&str) -> Result<Signature<R>>,
) -> Result<Vec<VerificationIssue>> {
    let source = locales
        .get(source_locale)
        .with_context(|| format!("Missing source {source_locale}.json file"))?;
    let mut source_messages = BTreeMap::new();
    messages(source, "", &mut source_messages, dialect)
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
        messages(content, "", &mut target_messages, dialect)
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
