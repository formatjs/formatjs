use crate::extractor::{
    MessageDescriptor, MessageExtraction, flatten_message_descriptors, normalize_whitespace,
};
use crate::id_generator::IdGenerator;
use anyhow::{Result, bail};
use proc_macro2::{LineColumn, Span};
use serde_json::Value;
use std::path::Path;
use syn::parse::{Parse, ParseStream};
use syn::spanned::Spanned;
use syn::visit::{self, Visit};
use syn::{Expr, Ident, LitStr, Macro, Token, braced};

const RUST_ID_INTERPOLATION_PATTERN: &str = "[sha512:contenthash:base64:10]";

pub fn extract_messages_from_rust_source(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let extraction = extract_messages_from_rust_source_with_diagnostics(
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        flatten,
        throws,
    )?;
    for error in extraction.errors {
        eprintln!("{error}");
    }
    Ok(extraction.messages)
}

pub fn extract_messages_from_rust_source_with_diagnostics(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<MessageExtraction> {
    let file = syn::parse_file(source_text)?;
    let id_generator = IdGenerator::new(RUST_ID_INTERPOLATION_PATTERN)?;
    let mut extractor = RustMessageExtractor {
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        id_generator,
        messages: Vec::new(),
        errors: Vec::new(),
    };
    extractor.visit_file(&file);
    if throws && let Some(error) = extractor.errors.first() {
        bail!("{error}");
    }
    let messages =
        flatten_message_descriptors(extractor.messages, source_text, file_path, flatten)?;
    Ok(MessageExtraction {
        messages,
        errors: extractor.errors,
    })
}

struct RustMessageExtractor<'a> {
    source_text: &'a str,
    file_path: &'a Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    id_generator: IdGenerator,
    messages: Vec<MessageDescriptor>,
    errors: Vec<String>,
}

impl RustMessageExtractor<'_> {
    fn descriptor(&self, arguments: MessageArgs, span: Span) -> Result<MessageDescriptor> {
        let (start, end) = if self.extract_source_location {
            (
                Some(line_column_to_offset(self.source_text, span.start())),
                Some(line_column_to_offset(self.source_text, span.end())),
            )
        } else {
            (None, None)
        };
        let normalized_default_message = normalize_whitespace(&arguments.default_message);
        let description = arguments.description.map(Value::String);
        let id = match arguments.id {
            Some(id) => id,
            None => {
                if arguments.id_encoding.as_deref() == Some("hex") {
                    IdGenerator::new("[sha512:contenthash:hex:10]")?.generate(
                        Some(&normalized_default_message),
                        &description,
                        None,
                    )?
                } else {
                    self.id_generator.generate(
                        Some(&normalized_default_message),
                        &description,
                        None,
                    )?
                }
            }
        };
        let default_message = if self.preserve_whitespace {
            arguments.default_message
        } else {
            normalized_default_message
        };
        Ok(MessageDescriptor {
            id: Some(id),
            default_message: Some(default_message),
            description,
            file: self
                .extract_source_location
                .then(|| self.file_path.to_string_lossy().into_owned()),
            start,
            end,
        })
    }

    fn error(&mut self, span: Span, message: impl AsRef<str>) {
        let start = span.start();
        self.errors.push(format!(
            "{}:{}:{}: {}",
            self.file_path.display(),
            start.line,
            start.column + 1,
            message.as_ref()
        ));
    }
}

impl<'ast> Visit<'ast> for RustMessageExtractor<'_> {
    fn visit_macro(&mut self, node: &'ast Macro) {
        let name = node.path.segments.last().map(|segment| &segment.ident);
        let is_format =
            name.is_some_and(|name| name == "format_message" || name == "formatted_message");
        if is_format || name.is_some_and(|name| name == "message_descriptor") {
            let arguments = if is_format {
                syn::parse2::<FormatMessageArgs>(node.tokens.clone()).map(|args| args.message)
            } else {
                syn::parse2::<MessageArgs>(node.tokens.clone())
            };
            match arguments {
                Ok(arguments) => match self.descriptor(arguments, node.span()) {
                    Ok(descriptor) => self.messages.push(descriptor),
                    Err(error) => self.error(node.span(), error.to_string()),
                },
                Err(error) => self.error(node.span(), error.to_string()),
            }
        }
        visit::visit_macro(self, node);
    }
}

struct FormatMessageArgs {
    message: MessageArgs,
}

impl Parse for FormatMessageArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        input.parse::<Expr>()?;
        input.parse::<Token![,]>()?;
        let message = parse_message_args(input, true)?;
        Ok(Self { message })
    }
}

fn line_column_to_offset(source: &str, location: LineColumn) -> u32 {
    let line_offset: usize = source
        .split_inclusive('\n')
        .take(location.line.saturating_sub(1))
        .map(str::len)
        .sum();
    line_offset
        .saturating_add(location.column)
        .min(source.len()) as u32
}

struct MessageArgs {
    id: Option<String>,
    default_message: String,
    description: Option<String>,
    id_encoding: Option<String>,
}

impl Parse for MessageArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        parse_message_args(input, false)
    }
}

fn parse_message_args(input: ParseStream<'_>, allow_values: bool) -> syn::Result<MessageArgs> {
    let mut id = None;
    let mut default_message = None;
    let mut description = None;
    let mut id_encoding = None;
    let mut values = false;
    while !input.is_empty() {
        let key: Ident = input.parse()?;
        if input.peek(Token![:]) {
            input.parse::<Token![:]>()?;
        } else {
            input.parse::<Token![=]>()?;
        }
        match key.to_string().as_str() {
            "values" if allow_values && !values => {
                if input.peek(syn::token::Brace) {
                    let content;
                    braced!(content in input);
                    while !content.is_empty() {
                        content.parse::<Ident>()?;
                        content.parse::<Token![:]>()?;
                        content.parse::<Expr>()?;
                        if content.peek(Token![,]) {
                            content.parse::<Token![,]>()?;
                        } else if !content.is_empty() {
                            return Err(content.error("expected comma"));
                        }
                    }
                } else {
                    input.parse::<Expr>()?;
                }
                values = true;
            }
            "values" if allow_values => {
                return Err(syn::Error::new(key.span(), "duplicate message field"));
            }
            "values" => return Err(syn::Error::new(key.span(), "unknown message field")),
            field => {
                let value: LitStr = input.parse()?;
                match field {
                    "id" if id.is_none() => id = Some(value.value()),
                    "default_message" if default_message.is_none() => {
                        default_message = Some(value.value())
                    }
                    "description" if description.is_none() => description = Some(value.value()),
                    "id_encoding" if id_encoding.is_none() => {
                        if !matches!(value.value().as_str(), "base64" | "hex") {
                            return Err(syn::Error::new(
                                value.span(),
                                "id_encoding must be base64 or hex",
                            ));
                        }
                        id_encoding = Some(value.value());
                    }
                    "id" | "default_message" | "description" | "id_encoding" => {
                        return Err(syn::Error::new(key.span(), "duplicate message field"));
                    }
                    _ => return Err(syn::Error::new(key.span(), "unknown message field")),
                }
            }
        }
        if input.peek(Token![,]) {
            input.parse::<Token![,]>()?;
        } else if !input.is_empty() {
            return Err(input.error("expected comma"));
        }
    }

    Ok(MessageArgs {
        id,
        default_message: default_message
            .ok_or_else(|| syn::Error::new(Span::call_site(), "default_message is required"))?,
        description,
        id_encoding,
    })
}
