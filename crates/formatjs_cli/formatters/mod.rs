mod crowdin;
mod default;
mod lokalise;
mod simple;
mod smartling;
mod transifex;

use anyhow::Result;
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

use crate::extractor::MessageDescriptor;

/// Built-in formatters for converting various translation file formats to Record<string, string>
#[derive(Debug, Clone, Copy)]
pub enum Formatter {
    /// Default formatter: extracts defaultMessage from MessageDescriptor objects
    Default,
    /// Simple formatter: pass-through for Record<string, string>
    Simple,
    /// Transifex formatter: extracts string field from structured format
    Transifex,
    /// Smartling formatter: extracts message field and skips smartling metadata
    Smartling,
    /// Lokalise formatter: extracts translation field from structured format
    Lokalise,
    /// Crowdin formatter: extracts message field from structured format
    Crowdin,
}

impl Formatter {
    /// Format MessageDescriptor objects to vendor-specific JSON format (for extraction)
    ///
    /// Converts MessageDescriptor objects to the vendor-specific format that can be
    /// uploaded to the translation service.
    ///
    /// # Arguments
    ///
    /// * `messages` - BTreeMap of message IDs to MessageDescriptor objects
    ///
    /// # Returns
    ///
    /// serde_json::Value in the vendor-specific format
    pub fn format_to_vendor_json(&self, messages: &BTreeMap<String, MessageDescriptor>) -> Value {
        match self {
            Formatter::Default => default::format(messages),
            Formatter::Simple => simple::format(messages),
            Formatter::Transifex => transifex::format(messages),
            Formatter::Smartling => smartling::format(messages),
            Formatter::Lokalise => lokalise::format(messages),
            Formatter::Crowdin => crowdin::format(messages),
        }
    }

    /// Format MessageDescriptor objects using this formatter (for extraction)
    ///
    /// Converts MessageDescriptor objects to the vendor-specific format,
    /// then immediately converts back to simple key-value pairs.
    ///
    /// # Arguments
    ///
    /// * `messages` - BTreeMap of message IDs to MessageDescriptor objects
    /// * `_file_path` - Path to the file (for error messages, currently unused)
    ///
    /// # Returns
    ///
    /// HashMap mapping message IDs to message strings
    pub fn format(
        &self,
        messages: &BTreeMap<String, MessageDescriptor>,
        _file_path: &str,
    ) -> Result<HashMap<String, String>> {
        // Convert MessageDescriptor to vendor format
        let vendor_json = self.format_to_vendor_json(messages);

        // Then compile vendor format back to Record<string, string>
        let btree_result = match self {
            Formatter::Default => default::compile(&vendor_json),
            Formatter::Simple => simple::compile(&vendor_json),
            Formatter::Transifex => transifex::compile(&vendor_json),
            Formatter::Smartling => smartling::compile(&vendor_json),
            Formatter::Lokalise => lokalise::compile(&vendor_json),
            Formatter::Crowdin => crowdin::compile(&vendor_json),
        };

        // Convert BTreeMap to HashMap
        Ok(btree_result.into_iter().collect())
    }

    /// Apply this formatter to convert vendor JSON to Record<string, string> (for compilation)
    ///
    /// # Arguments
    ///
    /// * `json` - The parsed JSON value from the translation file
    /// * `_file_path` - Path to the file (for error messages)
    ///
    /// # Returns
    ///
    /// HashMap mapping message IDs to message strings
    pub fn apply(&self, json: &Value, _file_path: &str) -> Result<HashMap<String, String>> {
        let btree_result = match self {
            Formatter::Default => default::compile(json),
            Formatter::Simple => simple::compile(json),
            Formatter::Transifex => transifex::compile(json),
            Formatter::Smartling => smartling::compile(json),
            Formatter::Lokalise => lokalise::compile(json),
            Formatter::Crowdin => crowdin::compile(json),
        };

        // Convert BTreeMap to HashMap
        Ok(btree_result.into_iter().collect())
    }

    /// Parse a formatter name from a string
    pub fn from_str(s: &str) -> Result<Self> {
        match s.to_lowercase().as_str() {
            "default" => Ok(Formatter::Default),
            "simple" => Ok(Formatter::Simple),
            "transifex" => Ok(Formatter::Transifex),
            "smartling" => Ok(Formatter::Smartling),
            "lokalise" => Ok(Formatter::Lokalise),
            "crowdin" => Ok(Formatter::Crowdin),
            _ => anyhow::bail!(
                "Unknown formatter '{}'. Available formatters: default, simple, transifex, smartling, lokalise, crowdin",
                s
            ),
        }
    }

    /// Get the formatter name as a string
    pub fn as_str(&self) -> &'static str {
        match self {
            Formatter::Default => "default",
            Formatter::Simple => "simple",
            Formatter::Transifex => "transifex",
            Formatter::Smartling => "smartling",
            Formatter::Lokalise => "lokalise",
            Formatter::Crowdin => "crowdin",
        }
    }
}
