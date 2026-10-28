use formatjs_cli::rust_extractor::*;
use serde_json::Value;
use std::path::Path;

#[test]
fn extracts_message_descriptors() {
    let source = r#"fn main() {
        let descriptor = message_descriptor!(
            default_message: "Hello, {name}!",
            description: "Greeting"
        );
    }"#;
    let messages = extract_messages_from_rust_source(
        source,
        Path::new("src/main.rs"),
        false,
        false,
        false,
        true,
    )
    .unwrap();
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0].id.as_deref(), Some("EG1xJTTqQy"));
    assert_eq!(
        messages[0].default_message.as_deref(),
        Some("Hello, {name}!")
    );
    assert_eq!(
        messages[0].description,
        Some(Value::String("Greeting".to_owned()))
    );
}

#[test]
fn preserves_explicit_id() {
    let messages = extract_messages_from_rust_source(
        r#"fn main() { message_descriptor!(id: "hello", default_message: "Hello"); }"#,
        Path::new("src/main.rs"),
        false,
        false,
        false,
        true,
    )
    .unwrap();
    assert_eq!(messages[0].id.as_deref(), Some("hello"));
}

#[test]
fn extracts_format_message_macros() {
    for macro_name in ["format_message", "formatted_message"] {
        let source = r#"fn render(intl: &Intl, values: &Values<String>) {
            format_message!(
                &intl,
                default_message: "Hello, {name}!",
                description: "Greeting",
                values: values,
            );
            format_message!(
                &intl,
                default_message: "{count, plural, one {# task} other {{name} has # tasks}}",
                values: { count: count, name: user.name() },
            );
            formatjs_intl::format_message!(
                &intl,
                id: "approval.title",
                default_message: "Approve to continue",
            );
        }"#
        .replace("format_message!", &format!("{macro_name}!"));
        let messages = extract_messages_from_rust_source(
            &source,
            Path::new("src/main.rs"),
            false,
            false,
            false,
            true,
        )
        .unwrap();

        assert_eq!(messages.len(), 3);
        assert_eq!(messages[0].id.as_deref(), Some("EG1xJTTqQy"));
        assert_eq!(
            messages[1].default_message.as_deref(),
            Some("{count, plural, one {# task} other {{name} has # tasks}}")
        );
        assert_eq!(messages[2].id.as_deref(), Some("approval.title"));
    }
}

#[test]
fn reports_source_offsets() {
    let source = "fn main() {\n    message_descriptor!(default_message: \"Hello\");\n}\n";
    let messages = extract_messages_from_rust_source(
        source,
        Path::new("src/main.rs"),
        true,
        false,
        false,
        true,
    )
    .unwrap();
    assert_eq!(messages[0].file.as_deref(), Some("src/main.rs"));
    assert_eq!(messages[0].start, Some(16));
    assert!(messages[0].end.unwrap() > messages[0].start.unwrap());
}

#[test]
fn extracts_web_hex_ids_and_preserves_explicit_ids() {
    let source = r#"fn main() {
        message_descriptor!(default_message: "  Hello,\n {name}! \u{0085}", description: "Greeting", id_encoding: "hex");
        format_message!(&intl, default_message: "Hello", description: "", id_encoding: "hex");
        formatted_message!(&intl, id: "manual", default_message: "Hello", id_encoding: "hex");
    }"#;
    let messages =
        extract_messages_from_rust_source(source, Path::new("main.rs"), false, false, true, true)
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
    let error = extract_messages_from_rust_source(
        r#"fn main() { message_descriptor!(default_message: "Hello", id_encoding: "rot13"); }"#,
        Path::new("main.rs"),
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
