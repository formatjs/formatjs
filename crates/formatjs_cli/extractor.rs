use anyhow::{Context, Result};
use formatjs_icu_messageformat_parser::{
    Parser as IcuParser, ParserOptions, print_ast, try_hoist_selectors,
};
use oxc::ast_visit::{Visit, walk};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_data_structures::rope::{Rope, get_line_column};
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

/// Message descriptor extracted from source code
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MessageDescriptor {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end: Option<u32>,
}

pub struct MessageExtraction {
    pub messages: Vec<MessageDescriptor>,
    pub errors: Vec<String>,
}

/// Normalize whitespace in a string by:
/// - Replacing all whitespace sequences (newlines, tabs, multiple spaces) with single spaces
/// - Trimming leading and trailing whitespace
/// Matches TypeScript behavior: Unicode White_Space trim + collapse.
/// This intentionally differs from JavaScript \s/String#trim for U+0085 and U+FEFF.
pub(crate) fn normalize_whitespace(s: &str) -> String {
    let trimmed = s.trim_matches(char::is_whitespace);
    let mut normalized = String::with_capacity(trimmed.len());
    let mut in_whitespace = false;

    for ch in trimmed.chars() {
        if ch.is_whitespace() {
            if !in_whitespace {
                normalized.push(' ');
                in_whitespace = true;
            }
        } else {
            normalized.push(ch);
            in_whitespace = false;
        }
    }

    normalized
}

/// Convert byte offset to (line, UTF-16 column) - both 1-indexed.
fn get_line_col(source: &str, source_rope: &Rope, offset: u32) -> (usize, usize) {
    let mut offset = (offset as usize).min(source.len());
    while !source.is_char_boundary(offset) {
        offset -= 1;
    }
    let (line, col) = get_line_column(source_rope, offset as u32, source);
    (line as usize + 1, col as usize + 1)
}

/// Extract messages from a single source file
pub fn extract_messages_from_source(
    source_text: &str,
    file_path: &Path,
    source_type: SourceType,
    extract_source_location: bool,
    component_names: &[String],
    function_names: &[String],
    pragma_meta: HashMap<String, String>,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<Vec<MessageDescriptor>> {
    let extraction = extract_messages_from_source_with_diagnostics(
        source_text,
        file_path,
        source_type,
        extract_source_location,
        component_names,
        function_names,
        pragma_meta,
        preserve_whitespace,
        flatten,
        throws,
    )?;
    for error in extraction.errors {
        eprintln!("{error}");
    }
    Ok(extraction.messages)
}

#[allow(clippy::too_many_arguments)]
pub fn extract_messages_from_source_with_diagnostics(
    source_text: &str,
    file_path: &Path,
    source_type: SourceType,
    extract_source_location: bool,
    component_names: &[String],
    function_names: &[String],
    pragma_meta: HashMap<String, String>,
    preserve_whitespace: bool,
    flatten: bool,
    throws: bool,
) -> Result<MessageExtraction> {
    // Parse the file
    let allocator = Allocator::default();
    let ParserReturn {
        program,
        diagnostics,
        ..
    } = Parser::new(&allocator, source_text, source_type).parse();

    if !diagnostics.is_empty() {
        let error_messages: Vec<String> = diagnostics.iter().map(|e| format!("{:?}", e)).collect();
        anyhow::bail!("Parse errors:\n{}", error_messages.join("\n"));
    }

    // Visit the AST to extract messages
    let source_rope = Rope::from_str(source_text);
    let mut visitor = MessageExtractor::new(
        file_path,
        source_text,
        source_rope,
        extract_source_location,
        component_names,
        function_names,
        pragma_meta,
        preserve_whitespace,
    );

    visitor.visit_program(&program);
    if throws && !visitor.errors.is_empty() {
        anyhow::bail!(visitor.errors.join("\n"));
    }
    let messages = flatten_message_descriptors(visitor.messages, source_text, file_path, flatten)?;
    Ok(MessageExtraction {
        messages,
        errors: visitor.errors,
    })
}

pub(crate) fn flatten_message_descriptors(
    messages: Vec<MessageDescriptor>,
    source_text: &str,
    file_path: &Path,
    flatten: bool,
) -> Result<Vec<MessageDescriptor>> {
    if !flatten {
        return Ok(messages);
    }

    let source_rope = Rope::from_str(source_text);
    messages
        .into_iter()
        .map(|mut message| {
            if let Some(ref default_message) = message.default_message {
                let parser = IcuParser::new(
                    default_message,
                    ParserOptions {
                        ignore_tag: false,
                        ..Default::default()
                    },
                );

                if let Ok(ast) = parser.parse() {
                    match try_hoist_selectors(ast) {
                        Ok(ast) => message.default_message = Some(print_ast(&ast)),
                        Err(error) => {
                            let location = message
                                .start
                                .map(|start| {
                                    let (line, column) =
                                        get_line_col(source_text, &source_rope, start);
                                    format!(" at line {line}, column {column}")
                                })
                                .unwrap_or_default();
                            let id = message
                                .id
                                .as_ref()
                                .map(|id| format!(" with id \"{id}\""))
                                .unwrap_or_default();
                            anyhow::bail!(
                                "[formatjs] Cannot flatten message in file \"{}\"{}{}: {}\nMessage: {}",
                                file_path.display(),
                                location,
                                id,
                                error,
                                default_message
                            );
                        }
                    }
                }
            }
            Ok(message)
        })
        .collect()
}

/// Determine oxc SourceType from file extension
pub fn determine_source_type(path: &Path) -> Result<SourceType> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .context("File has no extension")?;

    let source_type: SourceType = match ext {
        "tsx" => SourceType::default().with_jsx(true).with_typescript(true),
        "jsx" => SourceType::default().with_jsx(true),
        "ts" | "mts" | "cts" => SourceType::default().with_typescript(true),
        "js" | "mjs" | "cjs" => SourceType::default().with_jsx(true),
        _ => anyhow::bail!("Unsupported file extension: {}", ext),
    };

    Ok(source_type)
}

/// AST visitor to extract message descriptors
struct MessageExtractor<'a> {
    file_path: &'a Path,
    source_text: &'a str,
    source_rope: Rope,
    extract_source_location: bool,
    component_names: &'a [String],
    function_names: &'a [String],
    _pragma_meta: HashMap<String, String>,
    preserve_whitespace: bool,
    messages: Vec<MessageDescriptor>,
    errors: Vec<String>,
}

impl<'a> MessageExtractor<'a> {
    fn new(
        file_path: &'a Path,
        source_text: &'a str,
        source_rope: Rope,
        extract_source_location: bool,
        component_names: &'a [String],
        function_names: &'a [String],
        pragma_meta: HashMap<String, String>,
        preserve_whitespace: bool,
    ) -> Self {
        Self {
            file_path,
            source_text,
            source_rope,
            extract_source_location,
            component_names,
            function_names,
            _pragma_meta: pragma_meta,
            preserve_whitespace,
            messages: Vec::new(),
            errors: Vec::new(),
        }
    }

    /// Format a source location string like "file.tsx:line:col"
    fn format_location(&self, offset: u32) -> String {
        let (line, col) = get_line_col(self.source_text, &self.source_rope, offset);
        format!("{}:{}:{}", self.file_path.display(), line, col)
    }

    fn extract_string_literal(
        &self,
        expr: &Expression,
        preserve_whitespace: Option<bool>,
    ) -> Option<String> {
        let expr = self.unwrap_transparent_ts_expression(expr);
        match expr {
            Expression::StringLiteral(lit) => {
                let value = lit.value.as_str()?.to_owned();
                if preserve_whitespace.unwrap_or(self.preserve_whitespace) {
                    Some(value)
                } else {
                    Some(normalize_whitespace(&value))
                }
            }
            Expression::TemplateLiteral(tpl) => {
                self.extract_template_literal(tpl, preserve_whitespace)
            }
            // The tag is ignored: dedent`...` extracts as its raw template, like ts-transformer.
            Expression::TaggedTemplateExpression(tagged) => {
                self.extract_template_literal(&tagged.quasi, preserve_whitespace)
            }
            // Handle string concatenation (e.g., 'Hello' + ' ' + 'World')
            Expression::BinaryExpression(bin) if bin.operator == BinaryOperator::Addition => {
                let left = self.extract_string_literal(&bin.left, Some(true))?;
                let right = self.extract_string_literal(&bin.right, Some(true))?;
                Some(format!("{}{}", left, right))
            }
            _ => None,
        }
    }

    fn extract_template_literal(
        &self,
        tpl: &TemplateLiteral,
        preserve_whitespace: Option<bool>,
    ) -> Option<String> {
        if tpl.quasis.len() != 1 || !tpl.expressions.is_empty() {
            return None;
        }
        let value = tpl.quasis[0].value.cooked.as_ref()?.as_str()?.to_owned();
        if preserve_whitespace.unwrap_or(self.preserve_whitespace) {
            Some(value)
        } else {
            Some(normalize_whitespace(&value))
        }
    }

    fn extract_description(&self, expr: &Expression) -> Option<Value> {
        // Always preserve whitespace in descriptions (do not normalize)
        if let Some(string_val) = self.extract_string_literal(expr, Some(true)) {
            return Some(Value::String(string_val));
        }

        let expr = self.unwrap_transparent_ts_expression(expr);
        // Handle object literal descriptions
        if let Expression::ObjectExpression(obj) = expr {
            let mut map = serde_json::Map::new();
            for prop in &obj.properties {
                if let ObjectPropertyKind::ObjectProperty(p) = prop {
                    if let PropertyKey::StaticIdentifier(key) = &p.key {
                        // Try to extract string value (preserve whitespace in description objects too)
                        if let Some(val) = self.extract_string_literal(&p.value, Some(true)) {
                            map.insert(key.name.to_string(), Value::String(val));
                        }
                        // Try to extract numeric value
                        else if let Expression::NumericLiteral(num) = &p.value {
                            // Convert to JSON number (from_f64 returns Option)
                            if let Some(num_val) = serde_json::Number::from_f64(num.value) {
                                map.insert(key.name.to_string(), Value::Number(num_val));
                            }
                        }
                    }
                }
            }
            if !map.is_empty() {
                return Some(Value::Object(map));
            }
        }

        None
    }

    fn unwrap_transparent_ts_expression<'b>(
        &self,
        mut expr: &'b Expression<'a>,
    ) -> &'b Expression<'a> {
        loop {
            match expr {
                Expression::ParenthesizedExpression(parenthesized) => {
                    expr = &parenthesized.expression
                }
                Expression::TSAsExpression(ts_as) => expr = &ts_as.expression,
                Expression::TSSatisfiesExpression(ts_satisfies) => expr = &ts_satisfies.expression,
                Expression::TSTypeAssertion(ts_type_assertion) => {
                    expr = &ts_type_assertion.expression
                }
                Expression::TSNonNullExpression(ts_non_null) => expr = &ts_non_null.expression,
                _ => return expr,
            }
        }
    }

    /// Extract function name from callee expression, handling:
    /// - Simple identifiers: formatMessage
    /// - Member expressions: intl.formatMessage
    /// - Deep chains: props.intl.formatMessage, this.props.intl.formatMessage
    /// - Optional chaining: intl.formatMessage?.(), something?.intl?.formatMessage?.()
    /// - ChainExpression wrapper
    fn extract_function_name<'b>(&self, callee: &'b Expression) -> Option<&'b str> {
        match callee {
            // Direct function call: formatMessage(...)
            Expression::Identifier(id) => Some(id.name.as_str()),

            // Member expression: something.formatMessage()
            // Matches any object — aligns with JS CLI (ts-transformer) behavior
            Expression::StaticMemberExpression(member) => Some(member.property.name.as_str()),

            // Optional chaining wrapper: something?.formatMessage()
            Expression::ChainExpression(chain) => match &chain.expression {
                ChainElement::StaticMemberExpression(member) => Some(member.property.name.as_str()),
                _ => None,
            },

            // TypeScript generic instantiation: formatMessage<T>, intl.formatMessage<HTMLElement>
            Expression::TSInstantiationExpression(instantiation) => {
                self.extract_function_name(&instantiation.expression)
            }

            _ => None,
        }
    }

    fn extract_jsx_message(&mut self, opening_element: &JSXOpeningElement) {
        // Check if this is a FormattedMessage or custom component
        let component_name = match &opening_element.name {
            JSXElementName::Identifier(id) => id.name.as_str(),
            JSXElementName::IdentifierReference(id) => id.name.as_str(),
            _ => return,
        };

        if !self.component_names.iter().any(|n| n == component_name) {
            return;
        }

        let mut descriptor = MessageDescriptor {
            id: None,
            default_message: None,
            description: None,
            file: None,
            start: None,
            end: None,
        };
        let mut extraction_error = false;

        // Extract source location if requested
        if self.extract_source_location {
            descriptor.file = Some(self.file_path.to_string_lossy().to_string());
            descriptor.start = Some(opening_element.span.start);
            descriptor.end = Some(opening_element.span.end);
        }

        // Extract attributes
        for attr in &opening_element.attributes {
            if let JSXAttributeItem::Attribute(jsx_attr) = attr {
                if let JSXAttributeName::Identifier(name) = &jsx_attr.name {
                    let attr_name = name.name.as_str();

                    if let Some(value) = &jsx_attr.value {
                        match value {
                            JSXAttributeValue::StringLiteral(lit) => {
                                let Some(val) = lit.value.as_str() else {
                                    return;
                                };
                                let val = val.to_owned();
                                match attr_name {
                                    "id" => descriptor.id = Some(val),
                                    "defaultMessage" => {
                                        // Apply whitespace normalization to defaultMessage only
                                        let normalized_val = if self.preserve_whitespace {
                                            val
                                        } else {
                                            normalize_whitespace(&val)
                                        };
                                        descriptor.default_message = Some(normalized_val);
                                    }
                                    "description" => {
                                        // Description is NOT normalized
                                        descriptor.description = Some(Value::String(val))
                                    }
                                    _ => {}
                                }
                            }
                            JSXAttributeValue::ExpressionContainer(container) => {
                                // JSXExpression contains all Expression variants directly
                                if let Some(expr) = container.expression.as_expression() {
                                    match attr_name {
                                        "id" => {
                                            descriptor.id =
                                                self.extract_string_literal(expr, Some(true));
                                            if descriptor.id.is_none() {
                                                extraction_error = true;
                                                let loc = self.format_location(jsx_attr.span.start);
                                                self.errors.push(format!(
                                                    "{} [FormatJS] `id` must be a string literal to be extracted.",
                                                    loc
                                                ));
                                            }
                                        }
                                        "defaultMessage" => {
                                            descriptor.default_message =
                                                self.extract_string_literal(expr, None);
                                            if descriptor.default_message.is_none() {
                                                extraction_error = true;
                                                let loc = self.format_location(jsx_attr.span.start);
                                                self.errors.push(format!(
                                                    "{} [FormatJS] `defaultMessage` must be a string literal to be extracted.",
                                                    loc
                                                ));
                                            }
                                        }
                                        "description" => {
                                            descriptor.description = self.extract_description(expr);
                                        }
                                        _ => {}
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                }
            }
        }

        if !extraction_error && (descriptor.id.is_some() || descriptor.default_message.is_some()) {
            self.messages.push(descriptor);
        }
    }

    fn extract_call_expression_message(&mut self, call: &CallExpression) {
        // Check if this is defineMessages, defineMessage, or formatMessage
        let function_name = self.extract_function_name(&call.callee);

        if function_name.is_none() {
            return;
        }

        let function_name = function_name.unwrap();

        if !self.function_names.iter().any(|n| n == function_name) {
            return;
        }

        // Get first argument
        if call.arguments.is_empty() {
            return;
        }

        let arg = &call.arguments[0];
        // Argument enum contains all Expression variants directly
        let mut arg_expr = match arg.as_expression() {
            Some(expr) => expr,
            None => return,
        };

        arg_expr = self.unwrap_transparent_ts_expression(arg_expr);

        // For defineMessages, the argument is an object with message descriptors
        if function_name == "defineMessages" {
            if let Expression::ObjectExpression(obj) = arg_expr {
                for prop in &obj.properties {
                    if let ObjectPropertyKind::ObjectProperty(p) = prop {
                        if let Expression::ObjectExpression(msg_obj) =
                            self.unwrap_transparent_ts_expression(&p.value)
                        {
                            if let Some(descriptor) = self.extract_object_descriptor(
                                &msg_obj,
                                call.span.start,
                                call.span.end,
                            ) {
                                self.messages.push(descriptor);
                            }
                        }
                    }
                }
            }
        } else {
            // For defineMessage and formatMessage, the argument is the descriptor
            if let Expression::ObjectExpression(obj) = arg_expr {
                if let Some(descriptor) =
                    self.extract_object_descriptor(&obj, call.span.start, call.span.end)
                {
                    self.messages.push(descriptor);
                }
            }
        }
    }

    fn extract_object_descriptor(
        &mut self,
        obj: &ObjectExpression,
        span_start: u32,
        span_end: u32,
    ) -> Option<MessageDescriptor> {
        let mut descriptor = MessageDescriptor {
            id: None,
            default_message: None,
            description: None,
            file: None,
            start: None,
            end: None,
        };
        let mut extraction_error = false;

        if self.extract_source_location {
            descriptor.file = Some(self.file_path.to_string_lossy().to_string());
            descriptor.start = Some(span_start);
            descriptor.end = Some(span_end);
        }

        for prop in &obj.properties {
            if let ObjectPropertyKind::ObjectProperty(p) = prop {
                let name = match &p.key {
                    PropertyKey::StaticIdentifier(key) => key.name.as_str(),
                    PropertyKey::StringLiteral(key) => match key.value.as_str() {
                        Some(name) => name,
                        None => continue,
                    },
                    _ => continue,
                };
                match name {
                    "id" => {
                        descriptor.id = self.extract_string_literal(&p.value, Some(true));
                        if descriptor.id.is_none() {
                            extraction_error = true;
                            let loc = self.format_location(p.span.start);
                            self.errors.push(format!(
                                "{} [FormatJS] `id` must be a string literal to be extracted.",
                                loc
                            ));
                        }
                    }
                    "defaultMessage" => {
                        descriptor.default_message = self.extract_string_literal(&p.value, None);
                        if descriptor.default_message.is_none() {
                            extraction_error = true;
                            let loc = self.format_location(p.span.start);
                            self.errors.push(format!(
                                    "{} [FormatJS] `defaultMessage` must be a string literal to be extracted.",
                                    loc
                                ));
                        }
                    }
                    "description" => {
                        descriptor.description = self.extract_description(&p.value);
                    }
                    _ => {}
                }
            }
        }

        if !extraction_error && (descriptor.id.is_some() || descriptor.default_message.is_some()) {
            Some(descriptor)
        } else {
            None
        }
    }
}

impl<'a> Visit<'a> for MessageExtractor<'a> {
    fn visit_jsx_opening_element(&mut self, it: &JSXOpeningElement<'a>) {
        self.extract_jsx_message(it);
        // Continue walking to visit nested elements
        walk::walk_jsx_opening_element(self, it);
    }

    fn visit_call_expression(&mut self, it: &CallExpression<'a>) {
        self.extract_call_expression_message(it);
        // Continue walking to visit nested expressions
        walk::walk_call_expression(self, it);
    }

    fn visit_chain_expression(&mut self, it: &oxc_ast::ast::ChainExpression<'a>) {
        // Handle optional chaining like: intl.formatMessage?.()
        // The ChainExpression wraps a ChainElement which can be a CallExpression
        match &it.expression {
            oxc_ast::ast::ChainElement::CallExpression(call) => {
                // Extract the message from this call expression
                self.extract_call_expression_message(call);
                // Walk both callee and arguments to find nested messages
                walk::walk_expression(self, &call.callee);
                for arg in &call.arguments {
                    if let Some(expr) = arg.as_expression() {
                        walk::walk_expression(self, expr);
                    }
                }
            }
            _ => {
                // For other chain elements, walk normally
                walk::walk_chain_expression(self, it);
            }
        }
    }
}
