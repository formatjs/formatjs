pub use crate::printf_validation::VerificationIssue;
use anyhow::{Context, Result};
use formatjs_apple_printf_parser::{Amount, Conversion, Element, Length, parse};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashMap};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
enum Requirement {
    Object,
    SignedInteger(Length),
    UnsignedInteger(Length),
    Double,
    LongDouble,
    Character,
    Utf16Character,
    String,
    Utf16String,
    Pointer,
    Width,
    Precision,
}

fn signature(message: &str) -> Result<BTreeMap<u32, BTreeSet<Requirement>>> {
    let mut signature = BTreeMap::<u32, BTreeSet<Requirement>>::new();
    for element in parse(message).context("Invalid Apple printf syntax")? {
        let Element::Specifier(specifier) = element else {
            continue;
        };
        for (amount, requirement) in [
            (specifier.width, Requirement::Width),
            (specifier.precision, Requirement::Precision),
        ] {
            if let Some(Amount::Argument(argument)) = amount {
                signature
                    .entry(argument.index)
                    .or_default()
                    .insert(requirement);
            }
        }
        let Some(argument) = specifier.argument else {
            continue;
        };
        let requirement = match specifier.conversion {
            Conversion::Object => Requirement::Object,
            Conversion::SignedInteger => Requirement::SignedInteger(specifier.length),
            Conversion::UnsignedInteger | Conversion::Octal | Conversion::Hexadecimal => {
                Requirement::UnsignedInteger(specifier.length)
            }
            Conversion::FloatingPoint if specifier.length == Length::LongDouble => {
                Requirement::LongDouble
            }
            Conversion::FloatingPoint => Requirement::Double,
            Conversion::Character => Requirement::Character,
            Conversion::Utf16Character => Requirement::Utf16Character,
            Conversion::String => Requirement::String,
            Conversion::Utf16String => Requirement::Utf16String,
            Conversion::Pointer => Requirement::Pointer,
            Conversion::Percent => continue,
        };
        signature
            .entry(argument.index)
            .or_default()
            .insert(requirement);
    }
    Ok(signature)
}

/// Preserves declared types and dynamic width/precision roles across translations.
pub fn verify_catalogs(
    locales: &HashMap<String, Value>,
    source_locale: &str,
) -> Result<Vec<VerificationIssue>> {
    crate::printf_validation::verify_catalogs(locales, source_locale, "Apple printf", signature)
}
