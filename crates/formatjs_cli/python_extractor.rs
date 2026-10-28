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
        let mut id_encoding = None;
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
                "id_encoding" if id_encoding.is_none() => {
                    if !matches!(value.as_str(), "base64" | "hex") {
                        bail!("id_encoding must be base64 or hex");
                    }
                    id_encoding = Some(value);
                }
                "id" | "default_message" | "description" | "id_encoding" => {
                    bail!("duplicate define_message field: {name}")
                }
                _ => bail!("unknown define_message field: {name}"),
            }
        }

        let default_message = default_message
            .ok_or_else(|| anyhow::anyhow!("define_message default_message is required"))?;
        self.message_descriptor(call, id, Some(default_message), description, id_encoding)
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
        let mut id_encoding = None;
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
                "id_encoding" if id_encoding.is_none() => {
                    let value = string_literal(&keyword.value).ok_or_else(|| {
                        anyhow::anyhow!("format_message id_encoding must be a string literal")
                    })?;
                    if !matches!(value.as_str(), "base64" | "hex") {
                        bail!("id_encoding must be base64 or hex");
                    }
                    id_encoding = Some(value);
                }
                "values" if !values => values = true,
                "id" | "default_message" | "description" | "id_encoding" | "values" => {
                    bail!("duplicate format_message field: {name}")
                }
                _ => bail!("unknown format_message field: {name}"),
            }
        }

        if id.is_none() && default_message.is_none() {
            bail!("format_message default_message is required when id is omitted");
        }
        self.message_descriptor(call, id, default_message, description, id_encoding)
            .map(Some)
    }

    fn message_descriptor(
        &self,
        call: &ast::ExprCall,
        id: Option<String>,
        default_message: Option<String>,
        description: Option<String>,
        id_encoding: Option<String>,
    ) -> Result<MessageDescriptor> {
        let normalized_default_message = default_message.as_deref().map(normalize_whitespace);
        let description = description.map(Value::String);
        let id = match id {
            Some(id) => id,
            None => {
                if id_encoding.as_deref() == Some("hex") {
                    IdGenerator::new("[sha512:contenthash:hex:10]")?.generate(
                        normalized_default_message.as_deref(),
                        &description,
                        None,
                    )?
                } else {
                    self.id_generator.generate(
                        normalized_default_message.as_deref(),
                        &description,
                        None,
                    )?
                }
            }
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
