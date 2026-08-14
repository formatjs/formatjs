use base64::Engine;
use formatjs_icu_messageformat_parser::{MessageFormatElement, Parser, ParserOptions};
use proc_macro::TokenStream;
use quote::quote;
use sha2::{Digest, Sha512};
use std::collections::{BTreeMap, BTreeSet};
use syn::parse::{Parse, ParseStream};
use syn::{Ident, LitStr, Token, parse_macro_input};

const GENERATED_ID_LENGTH: usize = 10;

#[proc_macro]
pub fn __message_descriptor(input: TokenStream) -> TokenStream {
    let arguments = parse_macro_input!(input as MessageDescriptorArgs);
    let default_message = normalize_whitespace(&arguments.default_message.value());
    let id = arguments.id.map_or_else(
        || generate_id(&default_message, arguments.description.as_ref()),
        |id| id.value(),
    );
    let description = arguments.description.map_or_else(
        || quote!(::core::option::Option::None),
        |description| quote!(::core::option::Option::Some(#description)),
    );

    quote!((#id, #default_message, #description)).into()
}

#[proc_macro]
pub fn __validate_message_values(input: TokenStream) -> TokenStream {
    let arguments = parse_macro_input!(input as ValidateMessageValuesArgs);
    match validate_message_values(&arguments) {
        Ok(()) => quote!(()).into(),
        Err(error) => error.into_compile_error().into(),
    }
}

struct ValidateMessageValuesArgs {
    default_message: LitStr,
    values: Vec<Ident>,
}

impl Parse for ValidateMessageValuesArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        let default_message = input.parse()?;
        input.parse::<Token![;]>()?;
        let mut values = Vec::new();
        while !input.is_empty() {
            values.push(input.parse()?);
            if input.peek(Token![,]) {
                input.parse::<Token![,]>()?;
            } else if !input.is_empty() {
                return Err(input.error("expected comma"));
            }
        }
        Ok(Self {
            default_message,
            values,
        })
    }
}

fn validate_message_values(arguments: &ValidateMessageValuesArgs) -> syn::Result<()> {
    let ast = Parser::new(
        arguments.default_message.value(),
        ParserOptions::default(),
    )
    .parse()
    .map_err(|error| {
        syn::Error::new(
            arguments.default_message.span(),
            format!("invalid ICU message: {error}"),
        )
    })?;
    let mut required = BTreeSet::new();
    collect_message_values(&ast, &mut required);

    let mut supplied = BTreeMap::new();
    for value in &arguments.values {
        let name = value.to_string();
        if supplied.insert(name.clone(), value.span()).is_some() {
            return Err(syn::Error::new(
                value.span(),
                format!("duplicate ICU value `{name}`"),
            ));
        }
    }

    let supplied_names = supplied.keys().cloned().collect::<BTreeSet<_>>();
    if let Some(name) = required.difference(&supplied_names).next() {
        return Err(syn::Error::new(
            arguments.default_message.span(),
            format!("missing ICU value `{name}`"),
        ));
    }
    if let Some(name) = supplied_names.difference(&required).next() {
        return Err(syn::Error::new(
            supplied[name],
            format!("unused ICU value `{name}`"),
        ));
    }
    Ok(())
}

fn collect_message_values(ast: &[MessageFormatElement], values: &mut BTreeSet<String>) {
    for element in ast {
        match element {
            MessageFormatElement::Argument(argument) => {
                values.insert(argument.value.clone());
            }
            MessageFormatElement::Number(number) => {
                values.insert(number.value.clone());
            }
            MessageFormatElement::Date(date) => {
                values.insert(date.value.clone());
            }
            MessageFormatElement::Time(time) => {
                values.insert(time.value.clone());
            }
            MessageFormatElement::Select(select) => {
                values.insert(select.value.clone());
                for option in select.options.values() {
                    collect_message_values(&option.value, values);
                }
            }
            MessageFormatElement::Plural(plural) => {
                values.insert(plural.value.clone());
                for option in plural.options.values() {
                    collect_message_values(&option.value, values);
                }
            }
            MessageFormatElement::Tag(tag) => {
                values.insert(tag.value.clone());
                collect_message_values(&tag.children, values);
            }
            MessageFormatElement::Literal(_) | MessageFormatElement::Pound(_) => {}
        }
    }
}

struct MessageDescriptorArgs {
    id: Option<LitStr>,
    default_message: LitStr,
    description: Option<LitStr>,
}

impl Parse for MessageDescriptorArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        let mut id = None;
        let mut default_message = None;
        let mut description = None;

        while !input.is_empty() {
            let key: Ident = input.parse()?;
            input.parse::<Token![:]>()?;
            let value: LitStr = input.parse()?;
            match key.to_string().as_str() {
                "id" if id.is_none() => id = Some(value),
                "default_message" if default_message.is_none() => default_message = Some(value),
                "description" if description.is_none() => description = Some(value),
                "id" | "default_message" | "description" => {
                    return Err(syn::Error::new(key.span(), "duplicate message field"));
                }
                _ => return Err(syn::Error::new(key.span(), "unknown message field")),
            }

            if input.peek(Token![,]) {
                input.parse::<Token![,]>()?;
            } else if !input.is_empty() {
                return Err(input.error("expected comma"));
            }
        }

        Ok(Self {
            id,
            default_message: default_message
                .ok_or_else(|| syn::Error::new(input.span(), "default_message is required"))?,
            description,
        })
    }
}

fn generate_id(default_message: &str, description: Option<&LitStr>) -> String {
    let mut content = default_message.as_bytes().to_vec();
    if let Some(description) = description {
        content.push(b'#');
        content.extend_from_slice(description.value().as_bytes());
    }
    base64::engine::general_purpose::STANDARD
        .encode(Sha512::digest(content))
        .chars()
        .take(GENERATED_ID_LENGTH)
        .collect()
}

fn normalize_whitespace(value: &str) -> String {
    let trimmed = value.trim_matches(char::is_whitespace);
    let mut normalized = String::with_capacity(trimmed.len());
    let mut in_whitespace = false;

    for character in trimmed.chars() {
        if character.is_whitespace() {
            if !in_whitespace {
                normalized.push(' ');
                in_whitespace = true;
            }
        } else {
            normalized.push(character);
            in_whitespace = false;
        }
    }

    normalized
}

#[cfg(test)]
mod tests {
    use super::*;

    fn validate(input: &str) -> syn::Result<()> {
        validate_message_values(&syn::parse_str(input)?)
    }

    #[test]
    fn validates_nested_icu_values() {
        validate(
            r#""{gender, select, other {{name} has {count, plural, one {one task} other {# tasks}} worth {amount, number}, due {due, date} at {time, time}. <b>Review</b>}}"; gender, name, count, amount, due, time, b"#,
        )
        .unwrap();
    }

    #[test]
    fn rejects_missing_unused_and_duplicate_values() {
        assert!(
            validate(r#""Hello, {name}";"#)
                .unwrap_err()
                .to_string()
                .contains("missing ICU value `name`")
        );
        assert!(
            validate(r#""Hello"; name"#)
                .unwrap_err()
                .to_string()
                .contains("unused ICU value `name`")
        );
        assert!(
            validate(r#""Hello, {name}"; name, name"#)
                .unwrap_err()
                .to_string()
                .contains("duplicate ICU value `name`")
        );
    }
}
