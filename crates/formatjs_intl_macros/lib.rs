use base64::Engine;
use proc_macro::TokenStream;
use quote::quote;
use sha2::{Digest, Sha512};
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
