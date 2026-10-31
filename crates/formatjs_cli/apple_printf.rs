use anyhow::{Context, Result};
use formatjs_apple_printf_parser::{Amount, Conversion, Element, Length, Specifier, parse};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) enum Requirement {
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

pub(crate) fn signature(message: &str) -> Result<BTreeMap<u32, BTreeSet<Requirement>>> {
    let mut signature = BTreeMap::<u32, BTreeSet<Requirement>>::new();
    for element in parse(message).context("Invalid Apple printf syntax")? {
        let Element::Specifier(specifier) = element else {
            continue;
        };
        add_specifier(&mut signature, &specifier);
    }
    Ok(signature)
}

pub(crate) fn add_specifier(
    signature: &mut BTreeMap<u32, BTreeSet<Requirement>>,
    specifier: &Specifier<'_>,
) {
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
        return;
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
        Conversion::Percent => return,
    };
    signature
        .entry(argument.index)
        .or_default()
        .insert(requirement);
}
