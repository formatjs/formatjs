//! WASM bindings for ICU MessageFormat Parser
//!
//! This module provides WebAssembly bindings using wasm-bindgen,
//! allowing the parser to be used from JavaScript/TypeScript.

use formatjs_icu_messageformat_parser::{Parser, ParserOptions};
use icu::locale::Locale;
use serde::Deserialize;
use wasm_bindgen::prelude::*;

/// JavaScript-compatible parser options (for deserialization)
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct JsParserOptions {
    #[serde(default)]
    ignore_tag: bool,
    #[serde(default)]
    requires_other_clause: bool,
    #[serde(default)]
    should_parse_skeletons: bool,
    #[serde(default = "default_true")]
    capture_location: bool,
    #[serde(default)]
    locale: Option<String>,
}

fn default_true() -> bool {
    true
}

impl JsParserOptions {
    fn to_parser_options(self) -> ParserOptions {
        ParserOptions {
            ignore_tag: self.ignore_tag,
            requires_other_clause: self.requires_other_clause,
            should_parse_skeletons: self.should_parse_skeletons,
            capture_location: self.capture_location,
            locale: self.locale.and_then(|s| s.parse::<Locale>().ok()),
        }
    }
}

#[wasm_bindgen]
pub fn parse(input: &str, options_json: Option<String>) -> Result<String, JsValue> {
    let opts = if let Some(json) = options_json {
        serde_json::from_str::<JsParserOptions>(&json)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?
            .to_parser_options()
    } else {
        JsParserOptions::default().to_parser_options()
    };

    let parser = Parser::new(input, opts);
    match parser.parse() {
        Ok(ast) => {
            // Serialize to JSON string to ensure plain objects in JavaScript
            serde_json::to_string(&ast)
                .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
        }
        Err(e) => Err(JsValue::from_str(&format!("Parse error: {:?}", e))),
    }
}

#[wasm_bindgen]
pub fn parse_ignore_tag(input: &str) -> Result<String, JsValue> {
    let opts = ParserOptions {
        ignore_tag: true,
        capture_location: true,
        ..Default::default()
    };
    let parser = Parser::new(input, opts);
    match parser.parse() {
        Ok(ast) => {
            // Serialize to JSON string to ensure plain objects in JavaScript
            serde_json::to_string(&ast)
                .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
        }
        Err(e) => Err(JsValue::from_str(&format!("Parse error: {:?}", e))),
    }
}
