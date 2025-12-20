use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};

/// NumberSkeletonToken represents a parsed token from an ICU number skeleton string
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NumberSkeletonToken {
    pub stem: String,
    pub options: Vec<String>,
}

static WHITE_SPACE_RE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"[\t-\r \x85\u200E\u200F\u2028\u2029]").unwrap());

impl NumberSkeletonToken {
    /// Create a new NumberSkeletonToken
    pub fn new(stem: impl Into<String>, options: Vec<String>) -> Self {
        Self {
            stem: stem.into(),
            options,
        }
    }

    /// Parse a number skeleton string into tokens
    ///
    /// This function parses ICU number skeleton strings into structured tokens.
    /// Each token consists of a stem and optional slash-separated options.
    ///
    /// # Arguments
    /// * `skeleton` - The skeleton string to parse
    ///
    /// # Returns
    /// A vector of NumberSkeletonToken on success
    ///
    /// # Errors
    /// Returns an error string if:
    /// - The skeleton is empty
    /// - The skeleton contains invalid syntax (e.g., empty options)
    ///
    /// # Examples
    /// ```
    /// use icu_skeleton_parser::NumberSkeletonToken;
    ///
    /// // Simple token without options
    /// let tokens = NumberSkeletonToken::parse_from_string("percent").unwrap();
    /// assert_eq!(tokens[0].stem(), "percent");
    ///
    /// // Token with option
    /// let tokens = NumberSkeletonToken::parse_from_string("currency/USD").unwrap();
    /// assert_eq!(tokens[0].stem(), "currency");
    /// assert_eq!(tokens[0].options()[0], "USD");
    ///
    /// // Multiple tokens
    /// let tokens = NumberSkeletonToken::parse_from_string("percent scale/100").unwrap();
    /// assert_eq!(tokens.len(), 2);
    /// ```
    pub fn parse_from_string(skeleton: &str) -> Result<Vec<Self>, String> {
        if skeleton.is_empty() {
            return Err("Number skeleton cannot be empty".to_string());
        }

        WHITE_SPACE_RE
            .split(skeleton)
            .filter(|token| !token.is_empty())
            .map(Self::parse_token)
            .collect()
    }

    /// Parse a single token string into a NumberSkeletonToken
    fn parse_token(token: &str) -> Result<Self, String> {
        let mut parts = token.split('/');

        let stem = parts
            .next()
            .ok_or_else(|| "Invalid number skeleton".to_string())?;

        let options: Vec<String> = parts.map(|s| s.to_string()).collect();

        // Validate that no option is empty
        if options.iter().any(|opt| opt.is_empty()) {
            return Err("Invalid number skeleton".to_string());
        }

        Ok(Self::new(stem, options))
    }

    /// Get the stem
    pub fn stem(&self) -> &str {
        &self.stem
    }

    /// Get the options
    pub fn options(&self) -> &[String] {
        &self.options
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_number_skeleton_token_creation() {
        let token = NumberSkeletonToken::new("percent", vec![]);
        assert_eq!(token.stem(), "percent");
        assert_eq!(token.options(), &[] as &[String]);

        let token_with_options = NumberSkeletonToken::new("currency", vec!["USD".to_string()]);
        assert_eq!(token_with_options.stem(), "currency");
        assert_eq!(token_with_options.options(), &["USD".to_string()]);
    }

    #[test]
    fn test_number_skeleton_token_serialization() {
        let token = NumberSkeletonToken::new("currency", vec!["USD".to_string()]);
        let json = serde_json::to_string(&token).unwrap();
        assert!(json.contains("\"stem\":\"currency\""));
        assert!(json.contains("\"options\":[\"USD\"]"));
    }

    #[test]
    fn test_number_skeleton_token_deserialization() {
        let json = r#"{"stem":"percent","options":[]}"#;
        let token: NumberSkeletonToken = serde_json::from_str(json).unwrap();
        assert_eq!(token.stem(), "percent");
        assert_eq!(token.options(), &[] as &[String]);
    }

    #[test]
    fn test_parse_empty_skeleton() {
        let result = NumberSkeletonToken::parse_from_string("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Number skeleton cannot be empty");
    }

    #[test]
    fn test_parse_simple_token() {
        let result = NumberSkeletonToken::parse_from_string("percent").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].stem(), "percent");
        assert_eq!(result[0].options().len(), 0);
    }

    #[test]
    fn test_parse_token_with_options() {
        let result = NumberSkeletonToken::parse_from_string("currency/USD").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].stem(), "currency");
        assert_eq!(result[0].options(), &["USD".to_string()]);
    }

    #[test]
    fn test_parse_multiple_tokens() {
        let result = NumberSkeletonToken::parse_from_string("percent scale/100").unwrap();
        assert_eq!(result.len(), 2);

        assert_eq!(result[0].stem(), "percent");
        assert_eq!(result[0].options().len(), 0);

        assert_eq!(result[1].stem(), "scale");
        assert_eq!(result[1].options(), &["100".to_string()]);
    }

    #[test]
    fn test_parse_token_with_multiple_options() {
        let result = NumberSkeletonToken::parse_from_string("precision-integer/w").unwrap();
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].stem(), "precision-integer");
        assert_eq!(result[0].options(), &["w".to_string()]);
    }

    #[test]
    fn test_parse_invalid_skeleton_empty_option() {
        let result = NumberSkeletonToken::parse_from_string("currency//");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Invalid number skeleton");
    }

    #[test]
    fn test_parse_with_extra_whitespace() {
        let result = NumberSkeletonToken::parse_from_string("  percent   scale/100  ").unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].stem(), "percent");
        assert_eq!(result[1].stem(), "scale");
    }

    #[test]
    fn test_parse_compact_notation() {
        let result = NumberSkeletonToken::parse_from_string("compact-short currency/EUR").unwrap();
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].stem(), "compact-short");
        assert_eq!(result[1].stem(), "currency");
        assert_eq!(result[1].options(), &["EUR".to_string()]);
    }
}
