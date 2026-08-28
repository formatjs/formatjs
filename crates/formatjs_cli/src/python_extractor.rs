use crate::extractor::{
    MessageDescriptor, MessageExtraction, flatten_message_descriptors, normalize_whitespace,
};
use anyhow::{Result, bail};
use ruff_python_ast::visitor::{Visitor, walk_expr};
use ruff_python_ast::{self as ast, Expr};
use ruff_python_parser::parse_module;
use ruff_text_size::Ranged;
use serde_json::Value;
use std::path::Path;

const DEFINE_MESSAGE: &str = "define_message";

pub fn extract_messages_from_python_source(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let extraction = extract_messages_from_python_source_with_diagnostics(
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

pub fn extract_messages_from_python_source_with_diagnostics(
    source_text: &str,
    file_path: &Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<MessageExtraction> {
    let parsed = parse_module(source_text)
        .map_err(|error| anyhow::anyhow!("Parse error in {}: {error}", file_path.display()))?;
    let mut extractor = PythonMessageExtractor {
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        messages: Vec::new(),
        errors: Vec::new(),
    };
    extractor.visit_body(&parsed.syntax().body);
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

struct PythonMessageExtractor<'a> {
    source_text: &'a str,
    file_path: &'a Path,
    extract_source_location: bool,
    preserve_whitespace: bool,
    messages: Vec<MessageDescriptor>,
    errors: Vec<String>,
}

impl PythonMessageExtractor<'_> {
    fn descriptor(&self, call: &ast::ExprCall) -> Result<MessageDescriptor> {
        if !call.arguments.args.is_empty() {
            bail!("define_message accepts keyword arguments only");
        }

        let mut id = None;
        let mut default_message = None;
        let mut description = None;
        for keyword in &call.arguments.keywords {
            let Some(name) = keyword.arg.as_ref().map(|argument| argument.as_str()) else {
                bail!("define_message does not accept **kwargs");
            };
            let value = string_literal(&keyword.value)
                .ok_or_else(|| anyhow::anyhow!("define_message {name} must be a string literal"))?;
            match name {
                "id" if id.is_none() => id = Some(value),
                "default_message" if default_message.is_none() => default_message = Some(value),
                "description" if description.is_none() => description = Some(value),
                "id" | "default_message" | "description" => {
                    bail!("duplicate define_message field: {name}")
                }
                _ => bail!("unknown define_message field: {name}"),
            }
        }

        let id = id.ok_or_else(|| anyhow::anyhow!("define_message id is required"))?;
        let default_message = default_message
            .ok_or_else(|| anyhow::anyhow!("define_message default_message is required"))?;
        let default_message = if self.preserve_whitespace {
            default_message
        } else {
            normalize_whitespace(&default_message)
        };
        let (start, end, file) = if self.extract_source_location {
            (
                Some(u32::from(call.start())),
                Some(u32::from(call.end())),
                Some(self.file_path.to_string_lossy().into_owned()),
            )
        } else {
            (None, None, None)
        };

        Ok(MessageDescriptor {
            id: Some(id),
            default_message: Some(default_message),
            description: description.map(Value::String),
            file,
            start,
            end,
        })
    }

    fn error(&mut self, call: &ast::ExprCall, message: impl AsRef<str>) {
        let (line, column) = line_column(self.source_text, usize::from(call.start()));
        self.errors.push(format!(
            "{}:{line}:{column}: {}",
            self.file_path.display(),
            message.as_ref()
        ));
    }
}

impl<'ast> Visitor<'ast> for PythonMessageExtractor<'_> {
    fn visit_expr(&mut self, expr: &'ast Expr) {
        if let Expr::Call(call) = expr
            && is_define_message_call(&call.func)
        {
            match self.descriptor(call) {
                Ok(descriptor) => self.messages.push(descriptor),
                Err(error) => self.error(call, error.to_string()),
            }
        }
        walk_expr(self, expr);
    }
}

fn is_define_message_call(function: &Expr) -> bool {
    match function {
        Expr::Name(name) => name.id.as_str() == DEFINE_MESSAGE,
        Expr::Attribute(attribute) => attribute.attr.as_str() == DEFINE_MESSAGE,
        _ => false,
    }
}

fn string_literal(expression: &Expr) -> Option<String> {
    match expression {
        Expr::StringLiteral(literal) => Some(literal.value.to_str().to_owned()),
        _ => None,
    }
}

fn line_column(source: &str, offset: usize) -> (usize, usize) {
    let prefix = &source[..offset.min(source.len())];
    let line = prefix.bytes().filter(|byte| *byte == b'\n').count() + 1;
    let column = prefix
        .rsplit_once('\n')
        .map_or(prefix, |(_, current_line)| current_line)
        .chars()
        .count()
        + 1;
    (line, column)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_literal_message_descriptors() {
        let source = r#"
from my_app.i18n import define_message

GREETING = define_message(
    id="greeting",
    default_message="Hello, " "{name}!",
    description="Greeting shown on the home page",
)

def nested():
    return i18n.define_message(
        id="tasks",
        default_message="{count, plural, one {# task} other {# tasks}}",
    )

defineMessage(id="ignored", default_message="Not Python's API")
"#;
        let messages = extract_messages_from_python_source(
            source,
            Path::new("messages.py"),
            false,
            false,
            false,
            true,
        )
        .unwrap();

        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].id.as_deref(), Some("greeting"));
        assert_eq!(
            messages[0].default_message.as_deref(),
            Some("Hello, {name}!")
        );
        assert_eq!(
            messages[0].description,
            Some(Value::String("Greeting shown on the home page".to_owned()))
        );
        assert_eq!(messages[1].id.as_deref(), Some("tasks"));
    }

    #[test]
    fn normalizes_whitespace_and_reports_source_offsets() {
        let source = r#"MESSAGE = define_message(
    id="message",
    default_message="  Hello,\n    world!  ",
)
"#;
        let messages = extract_messages_from_python_source(
            source,
            Path::new("messages.py"),
            true,
            false,
            false,
            true,
        )
        .unwrap();

        assert_eq!(
            messages[0].default_message.as_deref(),
            Some("Hello, world!")
        );
        assert_eq!(messages[0].file.as_deref(), Some("messages.py"));
        assert_eq!(messages[0].start, Some(10));
        assert_eq!(messages[0].end, Some(source.len() as u32 - 1));
    }

    #[test]
    fn rejects_non_literal_and_invalid_arguments() {
        let source = r#"
define_message(id=MESSAGE_ID, default_message="Dynamic ID")
define_message("positional", default_message="Positional")
define_message(id="missing")
define_message(id="unknown", default_message="Unknown", context="Nope")
define_message(id="kwargs", default_message="Kwargs", **fields)
define_message(id="f-string", default_message=f"Hello {name}")
"#;
        let extraction = extract_messages_from_python_source_with_diagnostics(
            source,
            Path::new("invalid.py"),
            false,
            false,
            false,
            false,
        )
        .unwrap();

        assert!(extraction.messages.is_empty());
        assert_eq!(extraction.errors.len(), 6);
        assert!(extraction.errors[0].contains("id must be a string literal"));
        assert!(extraction.errors[1].contains("keyword arguments only"));
        assert!(extraction.errors[2].contains("default_message is required"));
        assert!(extraction.errors[3].contains("unknown define_message field: context"));
        assert!(extraction.errors[4].contains("does not accept **kwargs"));
        assert!(extraction.errors[5].contains("default_message must be a string literal"));
    }

    #[test]
    fn throws_on_message_errors_when_requested() {
        let error = extract_messages_from_python_source(
            "define_message(id=message_id, default_message=\"Hello\")",
            Path::new("invalid.py"),
            false,
            false,
            false,
            true,
        )
        .unwrap_err();

        assert!(error.to_string().contains("id must be a string literal"));
    }

    #[test]
    fn rejects_invalid_python() {
        let error = extract_messages_from_python_source(
            "define_message(",
            Path::new("invalid.py"),
            false,
            false,
            false,
            true,
        )
        .unwrap_err();

        assert!(error.to_string().contains("Parse error in invalid.py"));
    }
}
