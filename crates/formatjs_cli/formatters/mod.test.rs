use formatjs_cli::formatters::*;
use serde_json::json;

#[test]
fn test_formatter_from_str() {
    assert!(matches!(
        Formatter::from_str("default").unwrap(),
        Formatter::Default
    ));
    assert!(matches!(
        Formatter::from_str("simple").unwrap(),
        Formatter::Simple
    ));
    assert!(matches!(
        Formatter::from_str("transifex").unwrap(),
        Formatter::Transifex
    ));
    assert!(matches!(
        Formatter::from_str("smartling").unwrap(),
        Formatter::Smartling
    ));
    assert!(matches!(
        Formatter::from_str("lokalise").unwrap(),
        Formatter::Lokalise
    ));
    assert!(matches!(
        Formatter::from_str("crowdin").unwrap(),
        Formatter::Crowdin
    ));
}

#[test]
fn test_formatter_from_str_case_insensitive() {
    assert!(matches!(
        Formatter::from_str("DEFAULT").unwrap(),
        Formatter::Default
    ));
    assert!(matches!(
        Formatter::from_str("Simple").unwrap(),
        Formatter::Simple
    ));
    assert!(matches!(
        Formatter::from_str("TRANSIFEX").unwrap(),
        Formatter::Transifex
    ));
}

#[test]
fn test_formatter_from_str_invalid() {
    assert!(Formatter::from_str("invalid").is_err());
    assert!(Formatter::from_str("").is_err());
}

#[test]
fn test_formatter_as_str() {
    assert_eq!(Formatter::Default.as_str(), "default");
    assert_eq!(Formatter::Simple.as_str(), "simple");
    assert_eq!(Formatter::Transifex.as_str(), "transifex");
    assert_eq!(Formatter::Smartling.as_str(), "smartling");
    assert_eq!(Formatter::Lokalise.as_str(), "lokalise");
    assert_eq!(Formatter::Crowdin.as_str(), "crowdin");
}

#[test]
fn test_formatter_apply_default() {
    let input = json!({
        "msg": {
            "defaultMessage": "Hello!"
        }
    });

    let result = Formatter::Default.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}

#[test]
fn test_formatter_apply_simple() {
    let input = json!({
        "msg": "Hello!"
    });

    let result = Formatter::Simple.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}

#[test]
fn test_formatter_apply_transifex() {
    let input = json!({
        "msg": {
            "string": "Hello!"
        }
    });

    let result = Formatter::Transifex.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}

#[test]
fn test_formatter_apply_smartling() {
    let input = json!({
        "msg": {
            "message": "Hello!"
        }
    });

    let result = Formatter::Smartling.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}

#[test]
fn test_formatter_apply_lokalise() {
    let input = json!({
        "msg": {
            "translation": "Hello!"
        }
    });

    let result = Formatter::Lokalise.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}

#[test]
fn test_formatter_apply_crowdin() {
    let input = json!({
        "msg": {
            "message": "Hello!"
        }
    });

    let result = Formatter::Crowdin.apply(&input, "test.json").unwrap();
    assert_eq!(result.get("msg").unwrap(), "Hello!");
}
