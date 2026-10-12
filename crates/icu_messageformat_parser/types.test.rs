use formatjs_icu_messageformat_parser::types::*;

#[test]
fn test_type_enum() {
    assert_eq!(Type::Literal, Type::Literal);
    assert_ne!(Type::Literal, Type::Argument);
}

#[test]
fn test_valid_plural_rule() {
    assert_eq!(ValidPluralRule::from_str("one"), ValidPluralRule::One);
    assert_eq!(ValidPluralRule::from_str("other"), ValidPluralRule::Other);
    assert_eq!(
        ValidPluralRule::from_str("=5"),
        ValidPluralRule::Exact("=5".to_string())
    );
    assert_eq!(ValidPluralRule::One.as_str(), "one");
}

#[test]
fn test_literal_element() {
    let elem = LiteralElement::new("hello".to_string());
    assert_eq!(elem.value, "hello");
    assert!(elem.location.is_none());
}

#[test]
fn test_message_format_element_type_guards() {
    let literal = MessageFormatElement::literal("test".to_string());
    assert!(literal.is_literal());
    assert!(!literal.is_argument());
    assert_eq!(literal.element_type(), Type::Literal);

    let arg = MessageFormatElement::argument("x".to_string());
    assert!(arg.is_argument());
    assert!(!arg.is_literal());
    assert_eq!(arg.element_type(), Type::Argument);
}

#[test]
fn test_skeleton_type() {
    let dt_skeleton = Skeleton::DateTime(DateTimeSkeleton {
        pattern: "yyyy-MM-dd".to_string(),
        location: None,
        parsed_options: DateTimeFormatOptions::default(),
    });
    assert!(dt_skeleton.is_date_time_skeleton());
    assert!(!dt_skeleton.is_number_skeleton());
    assert_eq!(dt_skeleton.skeleton_type(), SkeletonType::DateTime);
}

#[test]
fn deserializes_compiled_ast() {
    let ast = formatjs_icu_messageformat_parser::Parser::new(
        "<b>{name}</b> {gender, select, other {has}} {count, plural, one {# task} other {# tasks}} worth {total, number, ::currency/USD} on {date, date, ::yMMMd} at {date, time, short}",
        formatjs_icu_messageformat_parser::ParserOptions {
            should_parse_skeletons: true,
            ..Default::default()
        },
    )
    .parse()
    .unwrap();
    let json = serde_json::to_string(&ast).unwrap();
    let deserialized: Vec<MessageFormatElement> = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized, ast);
}
