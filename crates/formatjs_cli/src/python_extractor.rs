use crate::extractor::{
    MessageDescriptor, MessageExtraction, flatten_message_descriptors, normalize_whitespace,
};
use crate::id_generator::IdGenerator;
use anyhow::{Result, bail};
use ruff_python_ast::visitor::{Visitor, walk_expr};
use ruff_python_ast::{self as ast, Expr};
use ruff_python_parser::parse_module;
use ruff_text_size::Ranged;
use serde_json::Value;
use std::path::Path;

const DEFINE_MESSAGE: &str = "define_message";
const FORMAT_MESSAGE: &str = "format_message";
const PYTHON_ID_INTERPOLATION_PATTERN: &str = "[sha512:contenthash:base64:10]";

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
    let id_generator = IdGenerator::new(PYTHON_ID_INTERPOLATION_PATTERN)?;
    let mut extractor = PythonMessageExtractor {
        source_text,
        file_path,
        extract_source_location,
        preserve_whitespace,
        id_generator,
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
    id_generator: IdGenerator,
    messages: Vec<MessageDescriptor>,
    errors: Vec<String>,
}

impl PythonMessageExtractor<'_> {
    fn define_message_descriptor(&self, call: &ast::ExprCall) -> Result<MessageDescriptor> {
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

        let default_message = default_message
            .ok_or_else(|| anyhow::anyhow!("define_message default_message is required"))?;
        self.message_descriptor(call, id, Some(default_message), description)
    }

    fn format_message_descriptor(&self, call: &ast::ExprCall) -> Result<Option<MessageDescriptor>> {
        if call.arguments.args.len() > 1 {
            bail!("format_message accepts at most one positional argument");
        }

        let mut id = match call.arguments.args.first() {
            Some(argument) => match string_literal(argument) {
                Some(id) => Some(id),
                None => return Ok(None),
            },
            None => None,
        };
        let mut default_message = None;
        let mut description = None;
        let mut values = false;
        for keyword in &call.arguments.keywords {
            let Some(name) = keyword.arg.as_ref().map(|argument| argument.as_str()) else {
                bail!("format_message does not accept **kwargs");
            };
            match name {
                "id" if id.is_none() => {
                    id = Some(string_literal(&keyword.value).ok_or_else(|| {
                        anyhow::anyhow!("format_message id must be a string literal")
                    })?);
                }
                "default_message" if default_message.is_none() => {
                    default_message = Some(string_literal(&keyword.value).ok_or_else(|| {
                        anyhow::anyhow!("format_message default_message must be a string literal")
                    })?);
                }
                "description" if description.is_none() => {
                    description = Some(string_literal(&keyword.value).ok_or_else(|| {
                        anyhow::anyhow!("format_message description must be a string literal")
                    })?);
                }
                "values" if !values => values = true,
                "id" | "default_message" | "description" | "values" => {
                    bail!("duplicate format_message field: {name}")
                }
                _ => bail!("unknown format_message field: {name}"),
            }
        }

        if id.is_none() && default_message.is_none() {
            bail!("format_message default_message is required when id is omitted");
        }
        self.message_descriptor(call, id, default_message, description)
            .map(Some)
    }

    fn message_descriptor(
        &self,
        call: &ast::ExprCall,
        id: Option<String>,
        default_message: Option<String>,
        description: Option<String>,
    ) -> Result<MessageDescriptor> {
        let normalized_default_message = default_message.as_deref().map(normalize_whitespace);
        let description = description.map(Value::String);
        let id = match id {
            Some(id) => id,
            None => self.id_generator.generate(
                normalized_default_message.as_deref(),
                &description,
                None,
            )?,
        };
        let default_message = if self.preserve_whitespace {
            default_message
        } else {
            normalized_default_message
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
            default_message,
            description,
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
        if let Expr::Call(call) = expr {
            let descriptor = if is_named_call(&call.func, DEFINE_MESSAGE) {
                self.define_message_descriptor(call).map(Some)
            } else if is_named_call(&call.func, FORMAT_MESSAGE) {
                self.format_message_descriptor(call)
            } else {
                Ok(None)
            };
            match descriptor {
                Ok(Some(descriptor)) => self.messages.push(descriptor),
                Ok(None) => {}
                Err(error) => self.error(call, error.to_string()),
            }
        }
        walk_expr(self, expr);
    }
}

fn is_named_call(function: &Expr, expected_name: &str) -> bool {
    match function {
        Expr::Name(name) => name.id.as_str() == expected_name,
        Expr::Attribute(attribute) => attribute.attr.as_str() == expected_name,
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
    fn extracts_format_message_calls() {
        let source = r#"
from intl import Intl

greeting = intl.format_message(
    "greeting",
    default_message="Hello, " "{name}!",
    values={"name": user.name},
)
status = format_message(id="status", default_message="Ready")
missing = intl.format_message("missing")
welcome = intl.format_message(
    default_message="  Welcome,\n  {name}!  ",
    description="Home title",
    values={"name": user.name},
)
inline = intl.format_message(
    define_message(default_message="Nested descriptor"),
    values={"count": count},
)
formatMessage("ignored", default_message="Not Python's API")
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

        assert_eq!(messages.len(), 5);
        assert_eq!(messages[0].id.as_deref(), Some("greeting"));
        assert_eq!(
            messages[0].default_message.as_deref(),
            Some("Hello, {name}!")
        );
        assert_eq!(messages[1].id.as_deref(), Some("status"));
        assert_eq!(messages[2].id.as_deref(), Some("missing"));
        assert_eq!(messages[2].default_message, None);
        let generated_id = IdGenerator::new(PYTHON_ID_INTERPOLATION_PATTERN)
            .unwrap()
            .generate(
                Some("Welcome, {name}!"),
                &Some(Value::String("Home title".to_owned())),
                None,
            )
            .unwrap();
        assert_eq!(messages[3].id.as_deref(), Some(generated_id.as_str()));
        assert_eq!(
            messages[3].default_message.as_deref(),
            Some("Welcome, {name}!")
        );
        assert_eq!(
            messages[4].default_message.as_deref(),
            Some("Nested descriptor")
        );
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
    fn rejects_invalid_format_message_arguments() {
        let source = r#"
format_message(MESSAGE, name=name)
format_message("id", "extra")
format_message()
format_message("dynamic", default_message=message)
format_message("kwargs", **fields)
format_message("unknown", context="Nope")
format_message("duplicate", id="other")
format_message("description", description=DESCRIPTION)
format_message("values", values=dynamic_values)
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

        assert_eq!(extraction.messages.len(), 1);
        assert_eq!(extraction.messages[0].id.as_deref(), Some("values"));
        assert_eq!(extraction.errors.len(), 7);
        assert!(extraction.errors[0].contains("at most one positional argument"));
        assert!(extraction.errors[1].contains("default_message is required when id is omitted"));
        assert!(extraction.errors[2].contains("default_message must be a string literal"));
        assert!(extraction.errors[3].contains("does not accept **kwargs"));
        assert!(extraction.errors[4].contains("unknown format_message field: context"));
        assert!(extraction.errors[5].contains("duplicate format_message field: id"));
        assert!(extraction.errors[6].contains("description must be a string literal"));
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
