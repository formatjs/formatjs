use anyhow::{Context, Result};
use formatjs_java_printf_parser::{Conversion, Element, parse};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashMap};

pub use crate::printf_validation::VerificationIssue;

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

/// Compares Java argument requirements without formatting runtime values.
pub fn verify_catalogs(
    locales: &HashMap<String, Value>,
    source_locale: &str,
) -> Result<Vec<VerificationIssue>> {
    crate::printf_validation::verify_catalogs(locales, source_locale, "Java printf", signature)
}
