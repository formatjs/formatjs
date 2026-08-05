use crate::extractor::{MessageDescriptor, flatten_message_descriptors, normalize_whitespace};
use anyhow::{Result, bail};
use proc_macro2::{LineColumn, Span};
use serde_json::Value;
use std::path::Path;
use syn::parse::{Parse, ParseStream};
use syn::spanned::Spanned;
use syn::visit::{self, Visit};
use syn::{Ident, LitStr, Macro, Token};

pub fn extract_messages_from_rust_source(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let file = syn::parse_file(source_text)?;
    let mut extractor = RustMessageExtractor {
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        throws,
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
    messages: Vec<MessageDescriptor>,
    errors: Vec<String>,
}

impl RustMessageExtractor<'_> {
    fn descriptor(&self, arguments: MessageArgs, span: Span) -> MessageDescriptor {
        let (start, end) = if self.extract_source_location {
            (
                Some(line_column_to_offset(self.source_text, span.start())),
                Some(line_column_to_offset(self.source_text, span.end())),
            )
        } else {
            (None, None)
        };
        let default_message = if self.preserve_whitespace {
            arguments.default_message
        } else {
            normalize_whitespace(&arguments.default_message)
        };
        MessageDescriptor {
            id: Some(arguments.id),
            default_message: Some(default_message),
            description: arguments.description.map(Value::String),
            file: self
                .extract_source_location
                .then(|| self.file_path.to_string_lossy().into_owned()),
            start,
            end,
        }
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
        if name.is_some_and(|name| name == "message") {
            match syn::parse2::<MessageArgs>(node.tokens.clone()) {
                Ok(arguments) => {
                    let descriptor = self.descriptor(arguments, node.span());
                    self.messages.push(descriptor);
                }
                Err(error) => self.error(node.span(), error.to_string()),
            }
        }
        visit::visit_macro(self, node);
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
    id: String,
    default_message: String,
    description: Option<String>,
}

impl Parse for MessageArgs {
    fn parse(input: ParseStream<'_>) -> syn::Result<Self> {
        let mut id = None;
        let mut default_message = None;
        let mut description = None;
        while !input.is_empty() {
            let key: Ident = input.parse()?;
            if input.peek(Token![:]) {
                input.parse::<Token![:]>()?;
            } else {
                input.parse::<Token![=]>()?;
            }
            let value: LitStr = input.parse()?;
            match key.to_string().as_str() {
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
            if input.peek(Token![,]) {
                input.parse::<Token![,]>()?;
            } else if !input.is_empty() {
                return Err(input.error("expected comma"));
            }
        }

        Ok(Self {
            id: id.ok_or_else(|| syn::Error::new(Span::call_site(), "id is required"))?,
            default_message: default_message
                .ok_or_else(|| syn::Error::new(Span::call_site(), "default_message is required"))?,
            description,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_message_descriptors() {
        let source = r#"fn main() {
            let descriptor = message!(
                id: "hello",
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
        assert_eq!(messages[0].id.as_deref(), Some("hello"));
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
    fn requires_explicit_id() {
        let error = extract_messages_from_rust_source(
            r#"fn main() { message!(default_message: "Hello"); }"#,
            Path::new("src/main.rs"),
            false,
            false,
            false,
            true,
        )
        .unwrap_err();
        assert!(error.to_string().contains("id is required"));
    }

    #[test]
    fn reports_source_offsets() {
        let source = "fn main() {\n    message!(id: \"hello\", default_message: \"Hello\");\n}\n";
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
