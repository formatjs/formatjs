use anyhow::{Context, Result};
use formatjs_icu_messageformat_parser::{
    Parser as IcuParser, ParserOptions, print_ast, try_hoist_selectors,
};
use once_cell::sync::Lazy;
use oxc::ast_visit::{Visit, walk};
use oxc_allocator::Allocator;
use oxc_ast::ast::*;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;
use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::Path;

// Hoist regex for whitespace normalization to avoid recompilation
// Matches TypeScript behavior: /\s+/gm
// Only matches space, tab, newline, carriage return, form feed
// Does NOT match non-breaking space (U+00A0) or other Unicode whitespace
static WHITESPACE_RE: Lazy<Regex> = Lazy::new(|| Regex::new(r"[ \t\n\r\f]+").unwrap());

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

/// Normalize whitespace in a string by:
/// - Replacing all whitespace sequences (newlines, tabs, multiple spaces) with single spaces
/// - Trimming leading and trailing whitespace
/// Matches TypeScript behavior: msg.defaultMessage.trim().replace(/\s+/gm, ' ')
fn normalize_whitespace(s: &str) -> String {
    WHITESPACE_RE.replace_all(s.trim(), " ").to_string()
}

/// Convert byte offset to (line, column) - both 1-indexed
fn get_line_col(source: &str, offset: usize) -> (usize, usize) {
    let mut line = 1;
    let mut col = 1;
    for (i, ch) in source.chars().enumerate() {
        if i >= offset {
            break;
        }
        if ch == '\n' {
            line += 1;
            col = 1;
        } else {
            col += 1;
        }
    }
    (line, col)
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
    // Parse the file
    let allocator = Allocator::default();
    let ParserReturn {
        program, errors, ..
    } = Parser::new(&allocator, source_text, source_type).parse();

    if !errors.is_empty() {
        let error_messages: Vec<String> = errors.iter().map(|e| format!("{:?}", e)).collect();
        anyhow::bail!("Parse errors:\n{}", error_messages.join("\n"));
    }

    // Visit the AST to extract messages
    let mut visitor = MessageExtractor::new(
        file_path,
        extract_source_location,
        component_names,
        function_names,
        pragma_meta,
        preserve_whitespace,
        throws,
    );

    visitor.visit_program(&program);

    // Apply selector hoisting if flatten is enabled
    let messages = if flatten {
        visitor
            .messages
            .into_iter()
            .map(|mut msg| {
                if let Some(ref default_message) = msg.default_message {
                    // Parse the ICU message
                    let parser = IcuParser::new(
                        default_message,
                        ParserOptions {
                            ignore_tag: false,
                            ..Default::default()
                        },
                    );

                    match parser.parse() {
                        Ok(ast) => {
                            // Apply selector hoisting
                            match try_hoist_selectors(ast) {
                                Ok(hoisted_ast) => {
                                    // Print back to string
                                    msg.default_message = Some(print_ast(&hoisted_ast));
                                }
                                Err(e) => {
                                    // Get line and column from start position if available
                                    let location_str = if let Some(start) = msg.start {
                                        let line_col = get_line_col(source_text, start as usize);
                                        format!(" at line {}, column {}", line_col.0, line_col.1)
                                    } else {
                                        String::new()
                                    };
                                    let id_str = msg
                                        .id
                                        .as_ref()
                                        .map(|id| format!(" with id \"{}\"", id))
                                        .unwrap_or_default();
                                    anyhow::bail!(
                                        "[formatjs] Cannot flatten message in file \"{}\"{}{}: {}\nMessage: {}",
                                        file_path.display(),
                                        location_str,
                                        id_str,
                                        e,
                                        default_message
                                    );
                                }
                            }
                        }
                        Err(_) => {
                            // If parsing fails, keep the original message
                        }
                    }
                }
                Ok(msg)
            })
            .collect::<Result<Vec<_>>>()?
    } else {
        visitor.messages
    };

    Ok(messages)
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
        "js" | "mjs" | "cjs" => SourceType::default(),
        _ => anyhow::bail!("Unsupported file extension: {}", ext),
    };

    Ok(source_type)
}

/// AST visitor to extract message descriptors
struct MessageExtractor<'a> {
    file_path: &'a Path,
    extract_source_location: bool,
    component_names: &'a [String],
    function_names: &'a [String],
    _pragma_meta: HashMap<String, String>,
    preserve_whitespace: bool,
    throws: bool,
    messages: Vec<MessageDescriptor>,
}

impl<'a> MessageExtractor<'a> {
    fn new(
        file_path: &'a Path,
        extract_source_location: bool,
        component_names: &'a [String],
        function_names: &'a [String],
        pragma_meta: HashMap<String, String>,
        preserve_whitespace: bool,
        throws: bool,
    ) -> Self {
        Self {
            file_path,
            extract_source_location,
            component_names,
            function_names,
            _pragma_meta: pragma_meta,
            preserve_whitespace,
            throws,
            messages: Vec::new(),
        }
    }

    fn extract_string_literal(
        &self,
        expr: &Expression,
        preserve_whitespace: Option<bool>,
    ) -> Option<String> {
        match expr {
            Expression::StringLiteral(lit) => {
                let value = lit.value.to_string();
                if preserve_whitespace.unwrap_or(self.preserve_whitespace) {
                    Some(value)
                } else {
                    Some(normalize_whitespace(&value))
                }
            }
            Expression::TemplateLiteral(tpl)
                if tpl.quasis.len() == 1 && tpl.expressions.is_empty() =>
            {
                let value = tpl.quasis[0].value.cooked.as_ref()?.to_string();
                if preserve_whitespace.unwrap_or(self.preserve_whitespace) {
                    Some(value)
                } else {
                    Some(normalize_whitespace(&value))
                }
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

    fn extract_description(&self, expr: &Expression) -> Option<Value> {
        // Always preserve whitespace in descriptions (do not normalize)
        if let Some(string_val) = self.extract_string_literal(expr, Some(true)) {
            return Some(Value::String(string_val));
        }

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

            // Member expression: intl.formatMessage, props.intl.formatMessage
            Expression::StaticMemberExpression(member) => {
                self.extract_function_name_from_member(member)
            }

            // Optional chaining wrapper: formatMessage?.()
            Expression::ChainExpression(chain) => {
                self.extract_function_name_from_chain(&chain.expression)
            }

            // TypeScript generic instantiation: formatMessage<T>, intl.formatMessage<HTMLElement>
            Expression::TSInstantiationExpression(instantiation) => {
                // The actual expression is inside the instantiation
                self.extract_function_name(&instantiation.expression)
            }

            _ => None,
        }
    }

    /// Extract function name from ChainElement (used in optional chaining)
    fn extract_function_name_from_chain<'b>(
        &self,
        chain_elem: &'b ChainElement,
    ) -> Option<&'b str> {
        match chain_elem {
            ChainElement::CallExpression(_) => None,
            ChainElement::StaticMemberExpression(member) => {
                self.extract_function_name_from_member(member)
            }
            _ => None,
        }
    }

    /// Extract function name from member expression, checking if it's a valid intl call
    fn extract_function_name_from_member<'b>(
        &self,
        member: &'b StaticMemberExpression,
    ) -> Option<&'b str> {
        let property_name = member.property.name.as_str();

        // Check if the object is 'intl' or ends with '.intl'
        if self.is_intl_object(&member.object) {
            return Some(property_name);
        }

        None
    }

    /// Check if an expression is or ends with 'intl'
    /// Matches: intl, props.intl, this.props.intl, something?.intl
    fn is_intl_object(&self, expr: &Expression) -> bool {
        match expr {
            // Direct 'intl' identifier
            Expression::Identifier(id) => id.name.as_str() == "intl",

            // props.intl, this.props.intl
            Expression::StaticMemberExpression(member) => {
                if member.property.name.as_str() == "intl" {
                    return true;
                }
                // Recursively check parent (for this.props.intl)
                self.is_intl_object(&member.object)
            }

            // Optional chaining: something?.intl
            Expression::ChainExpression(chain) => self.is_intl_object_from_chain(&chain.expression),

            // this.props
            Expression::ThisExpression(_) => false, // 'this' alone is not intl, but this.props.intl will be caught above

            _ => false,
        }
    }

    /// Check if a ChainElement is or ends with 'intl'
    fn is_intl_object_from_chain(&self, chain_elem: &ChainElement) -> bool {
        match chain_elem {
            ChainElement::StaticMemberExpression(member) => {
                if member.property.name.as_str() == "intl" {
                    return true;
                }
                self.is_intl_object(&member.object)
            }
            _ => false,
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
                                let val = lit.value.to_string();
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
                                            descriptor.id = self.extract_string_literal(expr, None);
                                            // Validate id is static if throws is enabled
                                            if self.throws && descriptor.id.is_none() {
                                                panic!(
                                                    "defaultMessage must be a string literal to be extracted."
                                                );
                                            }
                                        }
                                        "defaultMessage" => {
                                            descriptor.default_message =
                                                self.extract_string_literal(expr, None);
                                            // Validate defaultMessage is static if throws is enabled
                                            if self.throws && descriptor.default_message.is_none() {
                                                panic!(
                                                    "defaultMessage must be a string literal to be extracted."
                                                );
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

        // Only add if we have at least a defaultMessage
        if descriptor.default_message.is_some() {
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

        // Unwrap TSAsExpression (e.g., `{...} as const`)
        while let Expression::TSAsExpression(ts_as) = arg_expr {
            arg_expr = &ts_as.expression;
        }

        // For defineMessages, the argument is an object with message descriptors
        if function_name == "defineMessages" {
            if let Expression::ObjectExpression(obj) = arg_expr {
                for prop in &obj.properties {
                    if let ObjectPropertyKind::ObjectProperty(p) = prop {
                        if let Expression::ObjectExpression(msg_obj) = &p.value {
                            if let Some(descriptor) =
                                self.extract_object_descriptor(&msg_obj, call.span.start)
                            {
                                self.messages.push(descriptor);
                            }
                        }
                    }
                }
            }
        } else {
            // For defineMessage and formatMessage, the argument is the descriptor
            if let Expression::ObjectExpression(obj) = arg_expr {
                if let Some(descriptor) = self.extract_object_descriptor(&obj, call.span.start) {
                    self.messages.push(descriptor);
                }
            }
        }
    }

    fn extract_object_descriptor(
        &self,
        obj: &ObjectExpression,
        span_start: u32,
    ) -> Option<MessageDescriptor> {
        let mut descriptor = MessageDescriptor {
            id: None,
            default_message: None,
            description: None,
            file: None,
            start: None,
            end: None,
        };

        if self.extract_source_location {
            descriptor.file = Some(self.file_path.to_string_lossy().to_string());
            descriptor.start = Some(span_start);
        }

        for prop in &obj.properties {
            if let ObjectPropertyKind::ObjectProperty(p) = prop {
                if let PropertyKey::StaticIdentifier(key) = &p.key {
                    match key.name.as_str() {
                        "id" => {
                            descriptor.id = self.extract_string_literal(&p.value, None);
                            // Validate id is static if throws is enabled
                            if self.throws && descriptor.id.is_none() {
                                panic!("defaultMessage must be a string literal to be extracted.");
                            }
                        }
                        "defaultMessage" => {
                            descriptor.default_message =
                                self.extract_string_literal(&p.value, None);
                            // Validate defaultMessage is static if throws is enabled
                            if self.throws && descriptor.default_message.is_none() {
                                panic!("defaultMessage must be a string literal to be extracted.");
                            }
                        }
                        "description" => {
                            descriptor.description = self.extract_description(&p.value);
                        }
                        _ => {}
                    }
                }
            }
        }

        // Only return if we have at least defaultMessage
        if descriptor.default_message.is_some() {
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
                // Don't walk - this prevents double extraction since walk would
                // visit the arguments which may contain nested chains
                // Instead, manually walk just the arguments to find nested messages
                for arg in &call.arguments {
                    if let Some(expr) = arg.as_expression() {
                        walk::walk_expression(self, expr);
                    }
                }
            }
            oxc_ast::ast::ChainElement::StaticMemberExpression(_) => {
                // For member expressions in chains, walk normally to find nested patterns
                walk::walk_chain_expression(self, it);
            }
            _ => {
                // For other chain elements, walk normally
                walk::walk_chain_expression(self, it);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    // Helper function to get the fixtures directory
    fn fixtures_dir() -> PathBuf {
        // In Bazel, test data is available in the runfiles
        // The fixtures are from //packages/ts-transformer:test_fixtures
        if let Ok(runfiles) = std::env::var("RUNFILES_DIR") {
            // Running under Bazel
            PathBuf::from(runfiles)
                .join("_main")
                .join("packages")
                .join("ts-transformer")
                .join("tests")
                .join("fixtures")
        } else {
            // Fallback for cargo test
            let manifest_dir = env!("CARGO_MANIFEST_DIR");
            PathBuf::from(manifest_dir)
                .parent()
                .unwrap()
                .parent()
                .unwrap()
                .join("packages")
                .join("ts-transformer")
                .join("tests")
                .join("fixtures")
        }
    }

    // Helper function to read and extract from a fixture file
    fn extract_from_fixture(
        fixture_name: &str,
        component_names: &[String],
        function_names: &[String],
        pragma: Option<&str>,
    ) -> Result<Vec<MessageDescriptor>> {
        let fixture_path = fixtures_dir().join(fixture_name);
        let source_text = fs::read_to_string(&fixture_path)
            .with_context(|| format!("Failed to read fixture {}", fixture_name))?;

        let source_type = determine_source_type(&fixture_path)?;
        let pragma_meta = if let Some(p) = pragma {
            extract_pragma(&source_text, p)
        } else {
            HashMap::new()
        };

        extract_messages_from_source(
            &source_text,
            &fixture_path,
            source_type,
            false,
            component_names,
            function_names,
            pragma_meta,
            false,
            false,
            false,
        )
    }

    // Helper for pragma extraction (imported from extract module)
    fn extract_pragma(source: &str, pragma: &str) -> HashMap<String, String> {
        let mut meta = HashMap::new();
        let pragma_pattern = format!("// {}", pragma);

        for line in source.lines() {
            let trimmed = line.trim();
            if let Some(rest) = trimmed.strip_prefix(&pragma_pattern) {
                for pair in rest.split_whitespace() {
                    if let Some((key, value)) = pair.split_once(':') {
                        meta.insert(key.to_string(), value.to_string());
                    }
                }
            }
        }
        meta
    }

    #[test]
    fn test_extract_formatted_message_jsx() {
        let source = r#"
            import { FormattedMessage } from 'react-intl';
            <FormattedMessage id="greeting" defaultMessage="Hello {name}!" description="Greeting message" />
        "#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("greeting".to_string()));
        assert_eq!(
            messages[0].default_message,
            Some("Hello {name}!".to_string())
        );
        assert_eq!(
            messages[0].description,
            Some(Value::String("Greeting message".to_string()))
        );
    }

    #[test]
    fn test_extract_define_messages() {
        let source = r#"
            import { defineMessages } from 'react-intl';
            const messages = defineMessages({
                greeting: {
                    id: 'greeting',
                    defaultMessage: 'Hello!',
                    description: 'Simple greeting'
                },
                farewell: {
                    id: 'farewell',
                    defaultMessage: 'Goodbye!',
                    description: 'Simple farewell'
                }
            });
        "#;

        let file_path = PathBuf::from("test.ts");
        let source_type = SourceType::default().with_typescript(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].id, Some("greeting".to_string()));
        assert_eq!(messages[0].default_message, Some("Hello!".to_string()));
        assert_eq!(messages[1].id, Some("farewell".to_string()));
        assert_eq!(messages[1].default_message, Some("Goodbye!".to_string()));
    }

    #[test]
    fn test_extract_format_message_call() {
        let source = r#"
            intl.formatMessage({
                id: 'welcome',
                defaultMessage: 'Welcome to our app!',
                description: 'Welcome message'
            });
        "#;

        let file_path = PathBuf::from("test.js");
        let source_type = SourceType::default();
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("welcome".to_string()));
        assert_eq!(
            messages[0].default_message,
            Some("Welcome to our app!".to_string())
        );
    }

    #[test]
    fn test_extract_with_source_location() {
        let source = r#"
            <FormattedMessage defaultMessage="Test message" />
        "#;

        let file_path = PathBuf::from("/path/to/test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            true, // extract_source_location
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].file, Some("/path/to/test.tsx".to_string()));
        assert!(messages[0].start.is_some());
        assert!(messages[0].end.is_some());
    }

    #[test]
    fn test_extract_object_description() {
        let source = r#"
            <FormattedMessage
                defaultMessage="Test"
                description={{ context: "button", importance: "high" }}
            />
        "#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        match &messages[0].description {
            Some(Value::Object(map)) => {
                assert_eq!(
                    map.get("context"),
                    Some(&Value::String("button".to_string()))
                );
                assert_eq!(
                    map.get("importance"),
                    Some(&Value::String("high".to_string()))
                );
            }
            _ => panic!("Expected object description"),
        }
    }

    #[test]
    fn test_whitespace_preservation() {
        let source = r#"
            <FormattedMessage defaultMessage="  Hello World  " />
        "#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        // Without whitespace preservation
        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false, // preserve_whitespace = false
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages[0].default_message, Some("Hello World".to_string()));

        // With whitespace preservation
        let messages_preserved = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            true, // preserve_whitespace = true
            false,
            false,
        )
        .unwrap();

        assert_eq!(
            messages_preserved[0].default_message,
            Some("  Hello World  ".to_string())
        );
    }

    #[test]
    fn test_custom_component_names() {
        let source = r#"
            <CustomMessage id="custom" defaultMessage="Custom!" />
        "#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["CustomMessage".to_string()];
        let function_names = vec![];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("custom".to_string()));
        assert_eq!(messages[0].default_message, Some("Custom!".to_string()));
    }

    #[test]
    fn test_custom_function_names() {
        let source = r#"
            $t({
                id: 'translated',
                defaultMessage: 'Translated text'
            });
        "#;

        let file_path = PathBuf::from("test.js");
        let source_type = SourceType::default();
        let component_names = vec![];
        let function_names = vec!["$t".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("translated".to_string()));
        assert_eq!(
            messages[0].default_message,
            Some("Translated text".to_string())
        );
    }

    #[test]
    fn test_no_defaultmessage_skips() {
        let source = r#"
            <FormattedMessage id="no-default" description="Has no default message" />
        "#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        // Should not extract messages without defaultMessage
        assert_eq!(messages.len(), 0);
    }

    // Fixture-based tests (matching ts-transformer test suite)

    #[test]
    fn test_fixture_formatted_message() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_from_fixture(
            "FormattedMessage.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from FormattedMessage.tsx");

        // Should extract 3 identical messages (string, template literal, and expression)
        assert_eq!(messages.len(), 3);
        for msg in &messages {
            assert_eq!(msg.id, Some("foo.bar.baz".to_string()));
            assert_eq!(
                msg.default_message,
                Some("Hello World! {foo, number}".to_string())
            );
            assert_eq!(
                msg.description,
                Some(Value::String("The default message.".to_string()))
            );
        }
    }

    #[test]
    fn test_fixture_define_messages() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];

        let messages = extract_from_fixture(
            "defineMessages.tsx",
            &component_names,
            &function_names,
            Some("@react-intl"),
        )
        .expect("Failed to extract from defineMessages.tsx");

        // Should extract 7 messages from defineMessages + 1 inline FormattedMessage
        assert!(messages.len() >= 7);

        // Check first message
        let header = messages
            .iter()
            .find(|m| m.id == Some("foo.bar.baz".to_string()));
        assert!(header.is_some());
        let header = header.unwrap();
        assert_eq!(header.default_message, Some("Hello World!".to_string()));
        assert_eq!(
            header.description,
            Some(Value::String("The default message".to_string()))
        );

        // Check kittens message with ICU plural
        let kittens = messages
            .iter()
            .find(|m| m.id == Some("app.home.kittens".to_string()));
        assert!(kittens.is_some());
        let kittens = kittens.unwrap();
        assert_eq!(
            kittens.default_message,
            Some("{count, plural, =0 {😭} one {# kitten} other {# kittens}}".to_string())
        );
    }

    #[test]
    fn test_fixture_additional_component_names() {
        let component_names = vec!["CustomMessage".to_string()];
        let function_names = vec![];

        let messages = extract_from_fixture(
            "additionalComponentNames.tsx",
            &component_names,
            &function_names,
            Some("@react-intl"),
        )
        .expect("Failed to extract from additionalComponentNames.tsx");

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("greeting-world".to_string()));
        assert_eq!(
            messages[0].default_message,
            Some("Hello World!".to_string())
        );
        assert_eq!(
            messages[0].description,
            Some(Value::String("Greeting to the world".to_string()))
        );
    }

    #[test]
    fn test_fixture_additional_function_names() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string(), "$formatMessage".to_string()];

        let messages = extract_from_fixture(
            "additionalFunctionNames.tsx",
            &component_names,
            &function_names,
            Some("@react-intl"),
        )
        .expect("Failed to extract from additionalFunctionNames.tsx");

        // Should extract 2 messages (1 formatMessage + 1 $formatMessage)
        assert_eq!(messages.len(), 2);
        for msg in &messages {
            assert_eq!(msg.default_message, Some("foo".to_string()));
        }
    }

    #[test]
    fn test_fixture_descriptions_as_objects() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages = extract_from_fixture(
            "descriptionsAsObjects.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from descriptionsAsObjects.tsx");

        assert!(messages.len() >= 1);

        // Find message with object description
        let msg_with_obj = messages.iter().find(|m| m.description.is_some());
        assert!(msg_with_obj.is_some());

        if let Some(Value::Object(desc)) = &msg_with_obj.unwrap().description {
            assert!(desc.contains_key("text") || desc.contains_key("metadata"));
        }
    }

    #[test]
    fn test_fixture_extract_from_format_message() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_from_fixture(
            "extractFromFormatMessage.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from extractFromFormatMessage.tsx");

        // Should extract messages from formatMessage calls
        assert!(messages.len() >= 1);
        assert!(messages.iter().any(|m| m.default_message.is_some()));
    }

    #[test]
    fn test_fixture_format_message_call() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_from_fixture(
            "formatMessageCall.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from formatMessageCall.tsx");

        // Should extract messages from intl.formatMessage calls
        assert!(messages.len() >= 1);
    }

    #[test]
    fn test_fixture_nested() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_from_fixture("nested.tsx", &component_names, &function_names, None)
            .expect("Failed to extract from nested.tsx");

        // Should extract nested formatMessage calls (layer1 and layer2)
        assert!(messages.len() >= 2);
    }

    #[test]
    fn test_fixture_string_concat() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages =
            extract_from_fixture("stringConcat.tsx", &component_names, &function_names, None)
                .expect("Failed to extract from stringConcat.tsx");

        // Should extract messages with string concatenation
        assert!(messages.len() >= 1);
    }

    #[test]
    fn test_fixture_template_literal() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        let messages = extract_from_fixture(
            "templateLiteral.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from templateLiteral.tsx");

        // Should extract messages from template literals
        assert!(messages.len() >= 1);
    }

    #[test]
    fn test_fixture_inline() {
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessage".to_string()];

        let messages = extract_from_fixture("inline.tsx", &component_names, &function_names, None)
            .expect("Failed to extract from inline.tsx");

        // Should extract 1 FormattedMessage + 2 defineMessage calls
        assert_eq!(messages.len(), 3);

        // Check the FormattedMessage
        let fm = messages
            .iter()
            .find(|m| m.id == Some("foo.bar.baz".to_string()));
        assert!(fm.is_some());

        // Check the defineMessage calls
        let dm1 = messages.iter().find(|m| m.id == Some("header".to_string()));
        assert!(dm1.is_some());
        let dm2 = messages
            .iter()
            .find(|m| m.id == Some("header2".to_string()));
        assert!(dm2.is_some());
    }

    #[test]
    fn test_fixture_define_messages_preserve_whitespace() {
        let fixture_path = fixtures_dir().join("defineMessagesPreserveWhitespace.tsx");
        let source_text = fs::read_to_string(&fixture_path)
            .expect("Failed to read defineMessagesPreserveWhitespace.tsx");

        let source_type = determine_source_type(&fixture_path).unwrap();
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];
        let pragma_meta = extract_pragma(&source_text, "@react-intl");

        // With whitespace preservation
        let messages = extract_messages_from_source(
            &source_text,
            &fixture_path,
            source_type,
            false,
            &component_names,
            &function_names,
            pragma_meta,
            true, // preserve_whitespace = true
            false,
            false,
        )
        .unwrap();

        // Should extract multiple messages including one with trailing whitespace
        assert!(messages.len() >= 7);

        // Find the message with trailing whitespace
        let ws_msg = messages
            .iter()
            .find(|m| m.id == Some("trailing.ws".to_string()));
        assert!(ws_msg.is_some());
        let ws_msg = ws_msg.unwrap();

        // Should preserve whitespace
        assert_eq!(
            ws_msg.default_message,
            Some("   Some whitespace   ".to_string())
        );
    }

    #[test]
    fn test_fixture_optional_chaining() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string()];

        let messages = extract_from_fixture(
            "optionalChaining.tsx",
            &component_names,
            &function_names,
            None,
        )
        .expect("Failed to extract from optionalChaining.tsx");

        // Expected messages match the TypeScript transformer test expectations
        let expected = vec![
            MessageDescriptor {
                id: None,
                default_message: Some("Normal call".to_string()),
                description: Some(Value::String("Test normal formatMessage call".to_string())),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("With generics".to_string()),
                description: Some(Value::String(
                    "Test formatMessage with generic type".to_string(),
                )),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("With optional chaining".to_string()),
                description: Some(Value::String(
                    "Test formatMessage with optional chaining".to_string(),
                )),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("With both generics and optional chaining".to_string()),
                description: Some(Value::String(
                    "Test formatMessage with both generic type and optional chaining".to_string(),
                )),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("Nested optional chaining".to_string()),
                description: Some(Value::String("Test nested optional chaining".to_string())),
                file: None,
                start: None,
                end: None,
            },
        ];

        assert_eq!(messages, expected);
    }

    #[test]
    fn test_fixture_no_import() {
        let component_names = vec![];
        let function_names = vec!["formatMessage".to_string()];

        let messages =
            extract_from_fixture("noImport.tsx", &component_names, &function_names, None)
                .expect("Failed to extract from noImport.tsx");

        // Expected messages match the TypeScript transformer test expectations
        // These include props.intl.formatMessage, this.props.intl.formatMessage patterns
        let mut obj_desc_1 = serde_json::Map::new();
        obj_desc_1.insert(
            "obj1".to_string(),
            Value::Number(serde_json::Number::from_f64(1.0).unwrap()),
        );
        obj_desc_1.insert("obj2".to_string(), Value::String("123".to_string()));

        let mut obj_desc_2 = serde_json::Map::new();
        obj_desc_2.insert("obj2".to_string(), Value::String("123".to_string()));

        let expected = vec![
            MessageDescriptor {
                id: None,
                default_message: Some("props {intl}".to_string()),
                description: Some(Value::String("bar".to_string())),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("this props {intl}".to_string()),
                description: Some(Value::String("bar".to_string())),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("this props {intl}".to_string()),
                description: Some(Value::Object(obj_desc_1.clone())),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("this props {intl}".to_string()),
                description: Some(Value::Object(obj_desc_1.clone())),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("this props {intl}".to_string()),
                description: Some(Value::Object(obj_desc_2)),
                file: None,
                start: None,
                end: None,
            },
            MessageDescriptor {
                id: None,
                default_message: Some("foo {bar}".to_string()),
                description: Some(Value::String("bar".to_string())),
                file: None,
                start: None,
                end: None,
            },
        ];

        assert_eq!(messages, expected);
    }

    #[test]
    fn test_fixture_extract_source_location() {
        let fixture_path = fixtures_dir().join("extractSourceLocation.tsx");
        let source_text =
            fs::read_to_string(&fixture_path).expect("Failed to read extractSourceLocation.tsx");

        let source_type = determine_source_type(&fixture_path).unwrap();
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec![];

        // With extractSourceLocation enabled
        let messages = extract_messages_from_source(
            &source_text,
            &fixture_path,
            source_type,
            true, // extract_source_location = true
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert!(messages.len() >= 1);
        // Should have file, start, and end fields
        assert!(messages[0].file.is_some());
        assert!(messages[0].start.is_some());
        assert!(messages[0].end.is_some());
    }

    #[test]
    fn test_string_concatenation() {
        let source = r#"
            import { defineMessages } from 'react-intl';
            defineMessages({
                greeting: {
                    id: 'greeting',
                    defaultMessage: 'foo ' + 'bar',
                    description: 'Test string concatenation'
                }
            });
        "#;

        let file_path = PathBuf::from("test.js");
        let source_type = SourceType::default();
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("greeting".to_string()));
        assert_eq!(messages[0].default_message, Some("foo bar".to_string()));
    }

    #[test]
    fn test_non_breaking_space_in_message() {
        let source = r#"
            import { defineMessages } from 'react-intl';
            defineMessages({
                spacing: {
                    id: 'spacing',
                    defaultMessage: 'foo\xa0bar baz',
                    description: 'Test non-breaking space'
                }
            });
        "#;

        let file_path = PathBuf::from("test.js");
        let source_type = SourceType::default();
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];

        let messages = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("spacing".to_string()));
        // \xa0 is a non-breaking space (U+00A0)
        assert_eq!(
            messages[0].default_message,
            Some("foo\u{00a0}bar baz".to_string())
        );
    }

    #[test]
    fn test_typescript_type_guard_no_crash() {
        // Test that TypeScript type guards don't crash the parser
        let source = r#"
            import { defineMessages } from 'react-intl';

            const nonEmpty = <T>(a: T | void | undefined): a is T => !!a;

            defineMessages({
                test: {
                    id: 'test',
                    defaultMessage: 'Hello world',
                    description: 'Test message'
                }
            });
        "#;

        let file_path = PathBuf::from("test.ts");
        let source_type = SourceType::default().with_typescript(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["defineMessages".to_string()];

        // Should not crash and should extract the message
        let result = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            false,
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        );

        assert!(result.is_ok(), "Should not crash on TypeScript type guard");
        let messages = result.unwrap();
        assert_eq!(messages.len(), 1);
        assert_eq!(messages[0].id, Some("test".to_string()));
        assert_eq!(messages[0].default_message, Some("Hello world".to_string()));
    }

    #[test]
    fn test_flatten_error_includes_location_info() {
        // GH #4161 - Test that flatten errors include file path, line, and column
        let source = r#"
import { FormattedMessage } from 'react-intl';
export default function Test() {
  return (
    <FormattedMessage
      id="test.message"
      defaultMessage="Hello <b>{count, plural, one {# item} other {# items}}</b>"
    />
  );
}
"#;

        let file_path = PathBuf::from("test.tsx");
        let source_type = SourceType::default().with_typescript(true).with_jsx(true);
        let component_names = vec!["FormattedMessage".to_string()];
        let function_names = vec!["formatMessage".to_string()];

        // Should fail with detailed error message including file, line, column, and id
        let result = extract_messages_from_source(
            source,
            &file_path,
            source_type,
            true, // extract_source_location = true
            &component_names,
            &function_names,
            HashMap::new(),
            false,
            true, // flatten = true
            false,
        );

        assert!(result.is_err(), "Should fail when trying to flatten plural within tag");
        let error = result.unwrap_err().to_string();

        // Verify error message contains all expected information
        assert!(error.contains("[formatjs]"), "Error should include [formatjs] prefix");
        assert!(error.contains("test.tsx"), "Error should include file name");
        assert!(error.contains("line"), "Error should include line number");
        assert!(error.contains("column"), "Error should include column number");
        assert!(error.contains("test.message"), "Error should include message ID");
        assert!(error.contains("Cannot hoist plural/select within a tag element"), "Error should include original error message");
        assert!(error.contains("<b>{count"), "Error should include problematic message");
    }
}
