use anyhow::{Context, Result};
use formatjs_cli::extractor::*;
use oxc_span::SourceType;
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::Path;
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
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
            .expect("Cargo must set CARGO_MANIFEST_DIR outside Bazel");
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
        formatjs_cli::extract::extract_sources(
            &[formatjs_cli::extract::ExtractSourceInput {
                filename: fixture_path.to_string_lossy().into_owned(),
                source: source_text.clone(),
            }],
            None,
            false,
            component_names,
            function_names,
            true,
            Some(p),
            false,
            false,
        )
        .unwrap()
        .files[0]
            .meta
            .clone()
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

// Read pragma metadata through public extraction results.

#[test]
fn test_get_line_col_uses_utf16_columns() {
    let source = "defineMessage({/*🍄*/id: dynamic, defaultMessage:'Value'});\ndefineMessage({id: dynamic, defaultMessage:'Value'})";
    let result = formatjs_cli::extract::extract_sources(
        &[formatjs_cli::extract::ExtractSourceInput {
            filename: "test.ts".into(),
            source: source.into(),
        }],
        None,
        true,
        &[],
        &[],
        false,
        None,
        false,
        false,
    )
    .unwrap();
    assert!(
        result.files[0]
            .errors
            .iter()
            .any(|error| error.contains("test.ts:1:22")),
        "{:?}",
        result.files[0].errors
    );
    assert!(
        result.files[0]
            .errors
            .iter()
            .any(|error| error.contains("test.ts:2:16")),
        "{:?}",
        result.files[0].errors
    );
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
fn test_extract_js_file_with_jsx() {
    let source = r#"
            import { FormattedMessage } from 'react-intl';

            export default function App() {
                return <FormattedMessage id="greeting" defaultMessage="Hello from JS" />;
            }
        "#;

    let file_path = PathBuf::from("test.js");
    let source_type = determine_source_type(&file_path).unwrap();
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
        Some("Hello from JS".to_string())
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
fn test_message_recognition_parenthesized_descriptors() {
    let descriptor = "{id: 'greeting', defaultMessage: 'Hello', description: 'Greeting'}";
    let sources = [
            format!("wrappedIntl.formatMessage(({descriptor}))"),
            format!("messages.defineMessage((({descriptor} as const) satisfies MessageDescriptor)!)"),
            format!("messages.defineMessages(({{greeting: {descriptor}}}))"),
            format!("messages.defineMessages({{greeting: ({descriptor})}})"),
            format!("messages.defineMessages(({{greeting: (<MessageDescriptor>{descriptor})!}} as const)!)"),
            "wrappedIntl.formatMessage({id: ('greeting' as const), defaultMessage: ('Hello'), description: ('Greeting' satisfies string)})".to_string(),
        ];
    let function_names = vec![
        "formatMessage".to_string(),
        "defineMessage".to_string(),
        "defineMessages".to_string(),
    ];

    for source in sources {
        let messages = extract_messages_from_source(
            &source,
            Path::new("test.ts"),
            SourceType::default().with_typescript(true),
            true,
            &[],
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1, "{source}");
        let message = &messages[0];
        assert_eq!(message.id.as_deref(), Some("greeting"), "{source}");
        assert_eq!(
            message.default_message.as_deref(),
            Some("Hello"),
            "{source}"
        );
        assert_eq!(
            message.description,
            Some(Value::String("Greeting".to_string())),
            "{source}"
        );
        assert_eq!(message.start, Some(0), "{source}");
        assert_eq!(message.end, Some(source.len() as u32), "{source}");
    }
}

#[test]
fn test_message_recognition_quoted_descriptor_keys() {
    let sources = [
        r#"wrappedIntl.formatMessage({'id': 'greeting', "defaultMessage": 'Hello', 'description': 'Greeting'})"#,
        r#"messages.defineMessage({"id": 'greeting', 'defaultMessage': 'Hello', "description": 'Greeting'})"#,
        r#"messages.defineMessages({'greeting': {'id': 'greeting', 'defaultMessage': 'Hello', 'description': 'Greeting'}})"#,
    ];
    let function_names = vec![
        "formatMessage".to_string(),
        "defineMessage".to_string(),
        "defineMessages".to_string(),
    ];

    for source in sources {
        let messages = extract_messages_from_source(
            source,
            Path::new("test.ts"),
            SourceType::default().with_typescript(true),
            false,
            &[],
            &function_names,
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert_eq!(messages.len(), 1, "{source}");
        assert_eq!(messages[0].id.as_deref(), Some("greeting"), "{source}");
        assert_eq!(
            messages[0].default_message.as_deref(),
            Some("Hello"),
            "{source}"
        );
        assert_eq!(
            messages[0].description,
            Some(Value::String("Greeting".to_string())),
            "{source}"
        );
    }
}

#[test]
fn test_message_recognition_quoted_keys_reject_non_static_values() {
    for (source, property) in [
        (
            "wrappedIntl.formatMessage({'id': getId(), defaultMessage: 'Hello'})",
            "id",
        ),
        (
            "wrappedIntl.formatMessage({id: 'greeting', 'defaultMessage': getMessage()})",
            "defaultMessage",
        ),
    ] {
        let extraction = extract_messages_from_source_with_diagnostics(
            source,
            Path::new("test.ts"),
            SourceType::default().with_typescript(true),
            false,
            &[],
            &["formatMessage".to_string()],
            HashMap::new(),
            false,
            false,
            false,
        )
        .unwrap();

        assert!(extraction.messages.is_empty(), "{source}");
        assert_eq!(extraction.errors.len(), 1, "{source}");
        assert!(
            extraction.errors[0].contains(&format!("`{property}` must be a string literal")),
            "{source}"
        );
    }
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
fn test_unicode_whitespace_normalization() {
    let message = "\u{0009}A\u{0085}\u{2002}\u{2003}B\u{00a0}C\u{2028}D\u{3000}";
    assert_eq!(extracted_message(message), "A B C D");
}

#[test]
fn test_format_characters_are_not_whitespace() {
    let message = "\u{feff}A\u{feff}B\u{feff}";
    assert_eq!(extracted_message(message), message);
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
fn test_extracts_id_only_messages() {
    let source = r#"
            const label = intl.formatMessage({id: "call  only"});
            <FormattedMessage id={"jsx  only"} />
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

    assert_eq!(messages.len(), 2);
    assert!(messages.iter().any(|message| {
        message.id.as_deref() == Some("call  only") && message.default_message.is_none()
    }));
    assert!(messages.iter().any(|message| {
        message.id.as_deref() == Some("jsx  only") && message.default_message.is_none()
    }));
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
fn test_fixture_type_assertions() {
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec![
        "defineMessage".to_string(),
        "defineMessages".to_string(),
        "formatMessage".to_string(),
    ];

    let messages = extract_from_fixture(
        "typeAssertions.tsx",
        &component_names,
        &function_names,
        None,
    )
    .expect("Failed to extract from typeAssertions.tsx");

    assert_eq!(messages.len(), 8);
    assert!(messages.iter().any(|msg| {
        msg.id == Some("define.satisfies".to_string())
            && msg.default_message == Some("Define satisfies".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("define.as".to_string())
            && msg.default_message == Some("Define as".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("define.object.satisfies".to_string())
            && msg.default_message == Some("Define object satisfies".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("messages.satisfies".to_string())
            && msg.default_message == Some("Messages satisfies".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("messages.as".to_string())
            && msg.default_message == Some("Messages as".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("format.satisfies".to_string())
            && msg.default_message == Some("Format satisfies".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("jsx.satisfies".to_string())
            && msg.default_message == Some("JSX satisfies".to_string())
    }));
    assert!(messages.iter().any(|msg| {
        msg.id == Some("jsx.as".to_string()) && msg.default_message == Some("JSX as".to_string())
    }));
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
    let function_names = vec!["defineMessage".to_string()];

    let messages = extract_from_fixture(
        "templateLiteral.tsx",
        &component_names,
        &function_names,
        None,
    )
    .expect("Failed to extract from templateLiteral.tsx");

    // Matches the ts-transformer snapshot for this fixture: plain and tagged
    // (dedent`...`) no-substitution templates are both extracted.
    let by_id = |id: &str| {
        messages
            .iter()
            .find(|m| m.id.as_deref() == Some(id))
            .unwrap_or_else(|| panic!("missing message `{id}`"))
    };
    assert_eq!(messages.len(), 4);
    assert_eq!(
        by_id("template").default_message.as_deref(),
        Some("should remove newline and extra spaces")
    );
    assert_eq!(
        by_id("template dedent").default_message.as_deref(),
        Some("dedent Hello World!")
    );
    assert_eq!(
        by_id("foo.bar.baz").default_message.as_deref(),
        Some("Hello World!")
    );
    assert_eq!(
        by_id("dedent foo.bar.baz").default_message.as_deref(),
        Some("dedent Hello World!")
    );
}

#[test]
fn test_tagged_template_literal() {
    let source = r#"
            import { defineMessage, FormattedMessage } from 'react-intl';
            defineMessage({
                id: 'greeting',
                defaultMessage: dedent`
                    Hello {name},
                    welcome back.
                `,
                description: dedent`Shown after login`,
            });
            <FormattedMessage
                id={dedent`farewell`}
                defaultMessage={dedent`Goodbye {name}`}
            />;
            defineMessage({
                id: 'dynamic',
                defaultMessage: dedent`Hello ${name}`,
            });
        "#;

    let file_path = PathBuf::from("test.tsx");
    let source_type = SourceType::from_path(&file_path).unwrap();
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec!["defineMessage".to_string()];

    let messages = extract_messages_from_source(
        source,
        &file_path,
        source_type,
        false,
        &component_names,
        &function_names,
        HashMap::new(),
        true,
        false,
        false,
    )
    .unwrap();

    assert_eq!(messages.len(), 2);
    assert_eq!(messages[0].id.as_deref(), Some("greeting"));
    assert_eq!(
        messages[0].default_message.as_deref(),
        Some(
            "\n                    Hello {name},\n                    welcome back.\n                "
        )
    );
    assert_eq!(
        messages[0].description,
        Some(Value::String("Shown after login".to_string()))
    );
    assert_eq!(messages[1].id.as_deref(), Some("farewell"));
    assert_eq!(
        messages[1].default_message.as_deref(),
        Some("Goodbye {name}")
    );
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
    let pragma_meta = pragma_metadata(&source_text, "@react-intl");

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
        MessageDescriptor {
            id: None,
            default_message: Some("In a callback inside an optional chain".to_string()),
            description: Some(Value::String(
                "Test callbacks inside an optional chain".to_string(),
            )),
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

    let messages = extract_from_fixture("noImport.tsx", &component_names, &function_names, None)
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
    // \xa0 is a non-breaking space (U+00A0), which JavaScript /\s/ normalizes.
    assert_eq!(messages[0].default_message, Some("foo bar baz".to_string()));
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

    assert!(
        result.is_err(),
        "Should fail when trying to flatten plural within tag"
    );
    let error = result.unwrap_err().to_string();

    // Verify error message contains all expected information
    assert!(
        error.contains("[formatjs]"),
        "Error should include [formatjs] prefix"
    );
    assert!(error.contains("test.tsx"), "Error should include file name");
    assert!(error.contains("line"), "Error should include line number");
    assert!(
        error.contains("column"),
        "Error should include column number"
    );
    assert!(
        error.contains("test.message"),
        "Error should include message ID"
    );
    assert!(
        error.contains("Cannot hoist plural/select within a tag element"),
        "Error should include original error message"
    );
    assert!(
        error.contains("<b>{count"),
        "Error should include problematic message"
    );
}

#[test]
fn test_non_static_id_throws_includes_location() {
    // When throws=true and id is non-static, the error should include file:line:col
    let source = r#"import { defineMessage } from 'react-intl';
const dynamicId = 'foo';
const msg = defineMessage({
    id: dynamicId,
    defaultMessage: 'Hello',
});
"#;

    let file_path = PathBuf::from("src/App.tsx");
    let source_type = SourceType::default().with_typescript(true).with_jsx(true);
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec![
        "defineMessage".to_string(),
        "defineMessages".to_string(),
        "formatMessage".to_string(),
    ];

    let error = extract_messages_from_source(
        source,
        &file_path,
        source_type,
        false,
        &component_names,
        &function_names,
        HashMap::new(),
        false,
        false,
        true,
    )
    .unwrap_err()
    .to_string();
    assert!(
        error.contains("src/App.tsx:4:"),
        "Error should include file:line:col, got: {}",
        error
    );
    assert!(
        error.contains("[FormatJS]"),
        "Error should include [FormatJS] prefix, got: {}",
        error
    );
}

#[test]
fn test_non_static_default_message_throws_includes_location() {
    // When throws=true and defaultMessage is non-static, the error should include file:line:col
    let source = r#"import { FormattedMessage } from 'react-intl';
export default function App() {
    const msg = getDynamicMessage();
    return <FormattedMessage id="test" defaultMessage={msg} />;
}
"#;

    let file_path = PathBuf::from("src/Component.tsx");
    let source_type = SourceType::default().with_typescript(true).with_jsx(true);
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec!["formatMessage".to_string()];

    let error = extract_messages_from_source(
        source,
        &file_path,
        source_type,
        false,
        &component_names,
        &function_names,
        HashMap::new(),
        false,
        false,
        true,
    )
    .unwrap_err()
    .to_string();
    assert!(
        error.contains("src/Component.tsx:4:"),
        "Error should include file:line:col, got: {}",
        error
    );
    assert!(
        error.contains("`defaultMessage`"),
        "Error should mention defaultMessage, got: {}",
        error
    );
}

#[test]
fn test_non_static_values_no_throw_skips_and_warns() {
    // When throws=false and defaultMessage is non-static, messages should be skipped (not panic)
    let source = r#"import { defineMessage } from 'react-intl';
const dynamic = getDynamic();
const msg1 = defineMessage({
    id: 'skip.me',
    defaultMessage: dynamic,
});
const msg2 = defineMessage({
    id: 'valid.message',
    defaultMessage: 'This is valid',
});
"#;

    let file_path = PathBuf::from("src/App.tsx");
    let source_type = SourceType::default().with_typescript(true).with_jsx(true);
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec![
        "defineMessage".to_string(),
        "defineMessages".to_string(),
        "formatMessage".to_string(),
    ];

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
        false, // throws = false
    )
    .unwrap();

    // Only the valid message should be extracted (the one with non-static defaultMessage is skipped)
    assert_eq!(messages.len(), 1, "Should extract only the valid message");
    assert_eq!(messages[0].id.as_deref(), Some("valid.message"));
    assert_eq!(
        messages[0].default_message.as_deref(),
        Some("This is valid")
    );
}

#[test]
fn test_many_non_static_messages_keep_location_lookup_linear() {
    let mut source =
        String::from("import { defineMessage } from 'react-intl';\nconst dynamic = {};\n");
    for index in 0..4_000 {
        source.push_str(&format!(
                "const msg{index} = defineMessage({{ id: 'dynamic.{index}', defaultMessage: dynamic[{index}] }});\n"
            ));
    }

    let file_path = PathBuf::from("src/Large.ts");
    let source_type = SourceType::default().with_typescript(true);
    let component_names = vec!["FormattedMessage".to_string()];
    let function_names = vec!["defineMessage".to_string()];

    let start = std::time::Instant::now();
    let messages = extract_messages_from_source(
        &source,
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
    let elapsed = start.elapsed();

    assert!(
        messages.is_empty(),
        "non-static descriptors should be skipped"
    );
    assert!(
        elapsed < std::time::Duration::from_secs(3),
        "warning-heavy extraction should stay linear, took {:?}",
        elapsed
    );
}

fn extracted_message(message: &str) -> String {
    let source = format!(
        "defineMessage({{defaultMessage: {}}})",
        serde_json::to_string(message).unwrap()
    );
    let result = formatjs_cli::extract::extract_sources(
        &[formatjs_cli::extract::ExtractSourceInput {
            filename: "message.js".into(),
            source,
        }],
        None,
        false,
        &[],
        &[],
        true,
        None,
        false,
        false,
    )
    .unwrap();
    result.files[0].messages[0].default_message.clone().unwrap()
}

fn pragma_metadata(source: &str, pragma: &str) -> HashMap<String, String> {
    formatjs_cli::extract::extract_sources(
        &[formatjs_cli::extract::ExtractSourceInput {
            filename: "source.tsx".into(),
            source: source.into(),
        }],
        None,
        false,
        &[],
        &[],
        false,
        Some(pragma),
        false,
        false,
    )
    .unwrap()
    .files[0]
        .meta
        .clone()
}
