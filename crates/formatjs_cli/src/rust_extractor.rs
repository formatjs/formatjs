use crate::extractor::{MessageDescriptor, flatten_message_descriptors, normalize_whitespace};
use crate::id_generator::IdGenerator;
use anyhow::{Result, bail};
use proc_macro2::{LineColumn, Span};
use serde_json::Value;
use std::path::Path;
use syn::parse::{Parse, ParseStream};
use syn::spanned::Spanned;
use syn::visit::{self, Visit};
use syn::{Expr, Ident, LitStr, Macro, Token};

const RUST_ID_INTERPOLATION_PATTERN: &str = "[sha512:contenthash:base64:10]";

pub fn extract_messages_from_rust_source(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let file = syn::parse_file(source_text)?;
    let id_generator = IdGenerator::new(RUST_ID_INTERPOLATION_PATTERN)?;
    let mut extractor = RustMessageExtractor {
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        throws,
        id_generator,
        messages: Vec::new(),
        errors: Vec::new(),
    };
    extractor.visit_file(&file);
    if let Some(error) = extractor.errors.into_iter().next() {
        bail!(error);
    }
    flatten_message_descriptors(extractor.messages, source_text, file_path, flatten)
}

struct RustMessageExtractor<'a> {
    source_text: &'a str,
    file_path: &'a Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    throws: bool,
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
                self.id_generator
                    .generate(Some(&normalized_default_message), &description, None)?
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
        if self.throws {
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
}

impl<'ast> Visit<'ast> for RustMessageExtractor<'_> {
    fn visit_macro(&mut self, node: &'ast Macro) {
        let name = node.path.segments.last().map(|segment| &segment.ident);
        if name.is_some_and(|name| name == "message_descriptor" || name == "format_message") {
            let arguments = if name.is_some_and(|name| name == "format_message") {
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
                input.parse::<Expr>()?;
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
                    "id" | "default_message" | "description" => {
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
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_message_descriptors() {
        let source = r#"fn main() {
            let descriptor = message_descriptor!(
                default_message: "Hello, {name}!",
                description: "Greeting"
            );
        }"#;
        let messages = extract_messages_from_rust_source(
            source,
            Path::new("src/main.rs"),
            false,
            false,
            false,
            true,
        )
        .unwrap();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id.as_deref(), Some("EG1xJTTqQy"));
        assert_eq!(
            messages[0].default_message.as_deref(),
            Some("Hello, {name}!")
        );
        assert_eq!(
            messages[0].description,
            Some(Value::String("Greeting".to_owned()))
        );
    }

    #[test]
    fn preserves_explicit_id() {
        let messages = extract_messages_from_rust_source(
            r#"fn main() { message_descriptor!(id: "hello", default_message: "Hello"); }"#,
            Path::new("src/main.rs"),
            false,
            false,
            false,
            true,
        )
        .unwrap();
        assert_eq!(messages[0].id.as_deref(), Some("hello"));
    }

    #[test]
    fn extracts_format_message_macros() {
        let messages = extract_messages_from_rust_source(
            r#"fn render(intl: &Intl, values: &Values<String>) {
                format_message!(
                    &intl,
                    default_message: "Hello, {name}!",
                    description: "Greeting",
                    values: values,
                );
                formatjs_intl::format_message!(
                    &intl,
                    id: "approval.title",
                    default_message: "Approve to continue",
                );
            }"#,
            Path::new("src/main.rs"),
            false,
            false,
            false,
            true,
        )
        .unwrap();

        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].id.as_deref(), Some("EG1xJTTqQy"));
        assert_eq!(messages[1].id.as_deref(), Some("approval.title"));
    }

    #[test]
    fn reports_source_offsets() {
        let source = "fn main() {\n    message_descriptor!(default_message: \"Hello\");\n}\n";
        let messages = extract_messages_from_rust_source(
            source,
            Path::new("src/main.rs"),
            true,
            false,
            false,
            true,
        )
        .unwrap();
        assert_eq!(messages[0].file.as_deref(), Some("src/main.rs"));
        assert_eq!(messages[0].start, Some(16));
        assert!(messages[0].end.unwrap() > messages[0].start.unwrap());
    }
}
