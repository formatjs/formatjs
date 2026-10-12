use formatjs_icu_skeleton_parser::number_skeleton_token::*;

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
