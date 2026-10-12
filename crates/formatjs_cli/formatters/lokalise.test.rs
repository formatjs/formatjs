use formatjs_cli::formatters::Formatter;
use serde_json::json;

#[test]
fn test_lokalise_formatter_basic() {
    let input = json!({
        "greeting": {
            "translation": "Hello {name}!",
            "notes": "Greeting message"
        },
        "farewell": {
            "translation": "Goodbye!",
            "context": "homepage"
        }
    });

    let result = Formatter::Lokalise.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result.get("greeting").unwrap(), "Hello {name}!");
    assert_eq!(result.get("farewell").unwrap(), "Goodbye!");
}

#[test]
fn test_lokalise_formatter_missing_field() {
    let input = json!({
        "greeting": {
            "notes": "Greeting message"
        }
    });

    let result = Formatter::Lokalise.apply(&input, "messages.json").unwrap();
    assert_eq!(result.len(), 0);
}

#[test]
fn test_lokalise_formatter_with_metadata() {
    let input = json!({
        "msg": {
            "translation": "{count, plural, one {# item} other {# items}}",
            "notes": "Item count",
            "context": "shopping cart",
            "limit": "50"
        }
    });

    let result = Formatter::Lokalise.apply(&input, "messages.json").unwrap();
    assert_eq!(
        result.get("msg").unwrap(),
        "{count, plural, one {# item} other {# items}}"
    );
}
