use formatjs_icu_messageformat_parser::manipulator::*;
use formatjs_icu_messageformat_parser::types::*;
use indexmap::IndexMap;

#[test]
fn test_hoist_simple_plural() {
    // "I have {count, plural, one{a dog} other{many dogs}}"
    let mut plural_options = IndexMap::new();
    plural_options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "a dog".to_string(),
            ))],
            location: None,
        },
    );
    plural_options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "many dogs".to_string(),
            ))],
            location: None,
        },
    );

    let ast = vec![
        MessageFormatElement::Literal(LiteralElement::new("I have ".to_string())),
        MessageFormatElement::Plural(PluralElement {
            value: "count".to_string(),
            options: plural_options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        }),
    ];

    let result = hoist_selectors(ast);

    // Should have one element at top level
    assert_eq!(result.len(), 1);

    // It should be a plural element
    if let MessageFormatElement::Plural(plural) = &result[0] {
        // Check the "one" option contains "I have a dog"
        let one_value = &plural.options[&ValidPluralRule::One].value;
        assert_eq!(one_value.len(), 2);

        // Check the "other" option contains "I have many dogs"
        let other_value = &plural.options[&ValidPluralRule::Other].value;
        assert_eq!(other_value.len(), 2);
    } else {
        panic!("Expected plural element at top level");
    }
}

#[test]
fn test_collect_variables() {
    let ast = vec![
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        MessageFormatElement::Number(NumberElement {
            value: "count".to_string(),
            style: None,
            location: None,
        }),
        MessageFormatElement::Date(DateElement {
            value: "today".to_string(),
            style: None,
            location: None,
        }),
    ];

    use formatjs_icu_messageformat_parser::{ArgumentKind, message_arguments};
    let vars = message_arguments(&ast);
    assert_eq!(vars.len(), 3);
    assert!(vars["name"].contains(&ArgumentKind::Value));
    assert!(vars["count"].contains(&ArgumentKind::Number));
    assert!(vars["today"].contains(&ArgumentKind::DateTime));
}

#[test]
fn test_is_structurally_same_success() {
    let ast_a = vec![
        MessageFormatElement::Literal(LiteralElement::new("Hello ".to_string())),
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
    ];

    let ast_b = vec![
        MessageFormatElement::Literal(LiteralElement::new("Hola ".to_string())),
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
    ];

    let result = is_structurally_same(&ast_a, &ast_b, "test".to_string());
    assert!(result.is_ok());
}

#[test]
fn test_is_structurally_same_includes_message_id() {
    // Test that context (message ID) is included in error messages
    let ast_a = vec![
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        MessageFormatElement::Argument(ArgumentElement::new("count".to_string())),
    ];

    let ast_b = vec![MessageFormatElement::Argument(ArgumentElement::new(
        "name".to_string(),
    ))];

    let result = is_structurally_same(&ast_a, &ast_b, "app.welcome.message".to_string());
    assert!(result.is_err());

    let error_msg = result.unwrap_err().to_string();
    // Error message should include the message ID context
    assert!(
        error_msg.contains("[app.welcome.message]"),
        "Error message should include context: {}",
        error_msg
    );
    assert!(error_msg.contains("Different number of variables"));
}

#[test]
fn test_is_structurally_same_missing_variable() {
    let ast_a = vec![
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        MessageFormatElement::Argument(ArgumentElement::new("count".to_string())),
    ];

    let ast_b = vec![MessageFormatElement::Argument(ArgumentElement::new(
        "name".to_string(),
    ))];

    let result = is_structurally_same(&ast_a, &ast_b, "test".to_string());
    assert!(result.is_err());
    assert!(matches!(
        result.unwrap_err(),
        StructuralComparisonError::DifferentVariableCount {
            context: Some(_),
            ..
        }
    ));
}

#[test]
fn test_is_structurally_same_type_mismatch() {
    let ast_a = vec![MessageFormatElement::Number(NumberElement {
        value: "count".to_string(),
        style: None,
        location: None,
    })];

    let ast_b = vec![MessageFormatElement::Date(DateElement {
        value: "count".to_string(),
        style: None,
        location: None,
    })];

    let result = is_structurally_same(&ast_a, &ast_b, "test".to_string());
    assert!(result.is_err());
    let err = result.unwrap_err();
    // Type mismatch is now reported as MissingVariable (variable exists but with wrong type)
    assert!(
        matches!(
            err,
            StructuralComparisonError::MissingVariable {
                context: Some(_),
                ..
            }
        ),
        "Expected MissingVariable error for type mismatch, got: {:?}",
        err
    );
}

#[test]
#[should_panic(expected = "Cannot hoist plural/select within a tag element")]
fn test_hoist_panics_on_plural_in_tag() {
    let mut plural_options = IndexMap::new();
    plural_options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "text".to_string(),
            ))],
            location: None,
        },
    );

    let ast = vec![MessageFormatElement::Tag(TagElement {
        value: "b".to_string(),
        children: vec![MessageFormatElement::Plural(PluralElement {
            value: "count".to_string(),
            options: plural_options,
            offset: 0,
            plural_type: PluralType::Cardinal,
            location: None,
        })],
        location: None,
    })];

    hoist_selectors(ast);
}

#[test]
fn test_is_structurally_same_with_plural_translations() {
    use formatjs_icu_messageformat_parser::parser::{Parser, ParserOptions};

    // English: "I have {count} {count, plural, one{dog} other{dogs}}"
    let english = "I have {count} {count, plural, one{dog} other{dogs}}";
    // Spanish: "Tengo {count} {count, plural, one{perro} other{perros}}"
    let spanish = "Tengo {count} {count, plural, one{perro} other{perros}}";

    let parser_options = ParserOptions::default();
    let english_ast = Parser::new(english, parser_options.clone())
        .parse()
        .expect("Failed to parse English message");
    let spanish_ast = Parser::new(spanish, parser_options)
        .parse()
        .expect("Failed to parse Spanish message");

    // These should be structurally the same (same variable, same plural cases)
    let result = is_structurally_same(&english_ast, &spanish_ast, "test.dogs".to_string());
    assert!(
        result.is_ok(),
        "Expected messages to be structurally the same, but got error: {:?}",
        result.err()
    );
}

#[test]
fn test_is_structurally_same_allows_locale_specific_plural_branches() {
    use formatjs_icu_messageformat_parser::parser::{Parser, ParserOptions};

    let options = ParserOptions::default();
    let english = Parser::new(
        "{count, plural, one {{name} has one file} other {{name} has # files}}",
        options.clone(),
    )
    .parse()
    .expect("parse English");
    let polish = Parser::new(
        concat!(
            "{count, plural, ",
            "one {{name} ma jeden plik} ",
            "few {{name} ma # pliki} ",
            "many {{name} ma # plików} ",
            "other {{name} ma # pliku}}"
        ),
        options,
    )
    .parse()
    .expect("parse Polish");

    assert!(
        is_structurally_same(&english, &polish, "plural".to_string()).is_ok(),
        "translations with locale-specific plural branches should be structurally equal",
    );
}

// https://github.com/formatjs/formatjs/issues/6212
// Variable names that happen to match Map prototype properties (e.g., "size",
// "entries", "get") should work correctly. The TypeScript implementation had a
// bug where `in` operator on a Map checked the prototype chain instead of Map
// entries. IndexMap has no prototype chain, but these
// tests ensure parity with the TypeScript fix.
#[test]
fn test_map_prototype_variable_names_no_false_conflict() {
    use formatjs_icu_messageformat_parser::parser::{Parser, ParserOptions};
    let opts = ParserOptions::default();

    // "size" and "entries" are Map.prototype properties in JS
    let a = Parser::new("{size} m²", opts.clone())
        .parse()
        .expect("parse a");
    let b = Parser::new("{size} sq ft", opts.clone())
        .parse()
        .expect("parse b");
    assert!(
        is_structurally_same(&a, &b, "test.size".to_string()).is_ok(),
        "Same variable 'size' should be structurally equal"
    );

    let a = Parser::new("{entries} items", opts.clone())
        .parse()
        .expect("parse a");
    let b = Parser::new("{entries} records", opts.clone())
        .parse()
        .expect("parse b");
    assert!(
        is_structurally_same(&a, &b, "test.entries".to_string()).is_ok(),
        "Same variable 'entries' should be structurally equal"
    );

    // Different variable counts should still fail
    let a = Parser::new("{size} m²", opts.clone())
        .parse()
        .expect("parse a");
    let b = Parser::new("{date} · {size}", opts.clone())
        .parse()
        .expect("parse b");
    let result = is_structurally_same(&a, &b, "test.size_mismatch".to_string());
    assert!(result.is_err(), "Different variable counts should fail");
}

#[test]
fn test_plural_with_inner_number_element() {
    use formatjs_icu_messageformat_parser::parser::{Parser, ParserOptions};
    let opts = ParserOptions::default();

    // {count, plural, one {{count, number} cat} other {{count, number} cats}}
    // 'count' appears as both Plural and Number — this is valid ICU usage
    let a = Parser::new(
        "{count, plural, one {{count, number} cat} other {{count, number} cats}}",
        opts.clone(),
    )
    .parse()
    .expect("parse a");
    let b = Parser::new(
        "{count, plural, one {{count, number} foo} few{# cats} other {{count, number} bax}}",
        opts.clone(),
    )
    .parse()
    .expect("parse b");
    assert!(
        is_structurally_same(&a, &b, "test.plural_number".to_string()).is_ok(),
        "Plural with inner number for same variable should be structurally equal"
    );

    // Mismatch: different outer variable name
    let a = Parser::new(
        "some static string {count, plural, one {{count, number} cat} other {{count, number} cats}}",
        opts.clone(),
    )
    .parse()
    .expect("parse a");
    let b = Parser::new(
        "{count2, plural, one {{count, number} foo} other {{count, number} bax}}",
        opts.clone(),
    )
    .parse()
    .expect("parse b");
    let result = is_structurally_same(&a, &b, "test.plural_mismatch".to_string());
    assert!(
        result.is_err(),
        "Different plural variable names should fail"
    );
}

#[test]
fn test_shared_date_time_variable() {
    use formatjs_icu_messageformat_parser::{Parser, ParserOptions};

    let messages = [
        "Resets {resetDate, date, ::EEE} at {resetDate, time, short}.",
        "À {resetDate, time, short}, le {resetDate, date, ::EEE}.",
        "<b>{resetDate, date}</b> {resetDate, time} {resetDate, date}",
        "{count, plural, one {{resetDate, date} {resetDate, time}} other {{resetDate, time} {resetDate, date}}}",
        "{kind, select, date {{resetDate, date}} other {{resetDate, time}}}",
    ];
    for message in messages {
        let ast = Parser::new(message, ParserOptions::default())
            .parse()
            .unwrap();
        assert!(is_structurally_same(&ast, &ast, message.to_string()).is_ok());
    }
    let source = Parser::new(messages[0], ParserOptions::default())
        .parse()
        .unwrap();
    let reordered = Parser::new(messages[1], ParserOptions::default())
        .parse()
        .unwrap();
    assert!(is_structurally_same(&source, &reordered, "reset".to_string()).is_ok());

    for message in [
        "{resetDate, date}",
        "{resetDate, time}",
        "{resetDate, number}",
        "{otherDate, date} {otherDate, time}",
    ] {
        let target = Parser::new(message, ParserOptions::default())
            .parse()
            .unwrap();
        assert!(is_structurally_same(&source, &target, "reset".to_string()).is_err());
        assert!(is_structurally_same(&target, &source, "reset".to_string()).is_err());
    }
}

#[test]
fn test_date_time_still_rejects_incompatible_types() {
    use formatjs_icu_messageformat_parser::{Parser, ParserOptions};

    for message in [
        "{x, date} {x, number}",
        "{x, time} {x}",
        "{x, date} {x, time} {x, number}",
    ] {
        let ast = Parser::new(message, ParserOptions::default())
            .parse()
            .unwrap();
        assert!(
            std::panic::catch_unwind(|| is_structurally_same(&ast, &ast, "conflict".to_string()))
                .is_err()
        );
    }
}
