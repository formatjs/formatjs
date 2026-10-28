use formatjs_cli::id_generator::IdGenerator;
use formatjs_cli::python_extractor::*;
use ruff_python_ast::{self as ast};
use serde_json::Value;
use std::path::Path;

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
    let generated_id = IdGenerator::new("[sha512:contenthash:base64:10]")
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

#[test]
fn extracts_web_hex_ids_and_preserves_explicit_ids() {
    let source = r#"
define_message(default_message="  Hello,\n {name}! \u0085", description="Greeting", id_encoding="hex")
intl.format_message(default_message="Hello", description="", id_encoding="hex")
intl.format_message("manual", default_message="Hello", id_encoding="hex")
"#;
    let messages = extract_messages_from_python_source(
        source,
        Path::new("messages.py"),
        false,
        false,
        true,
        true,
    )
    .unwrap();
    assert_eq!(
        messages
            .iter()
            .map(|message| message.id.as_deref().unwrap())
            .collect::<Vec<_>>(),
        ["106d712534", "3615f80c9d", "manual"]
    );
}

#[test]
fn rejects_invalid_id_encoding() {
    for source in [
        r#"define_message(default_message="Hello", id_encoding="rot13")"#,
        r#"intl.format_message(default_message="Hello", id_encoding="rot13")"#,
    ] {
        let error = extract_messages_from_python_source(
            source,
            Path::new("messages.py"),
            false,
            false,
            false,
            true,
        )
        .unwrap_err();
        assert!(
            error
                .to_string()
                .contains("id_encoding must be base64 or hex")
        );
    }
}
