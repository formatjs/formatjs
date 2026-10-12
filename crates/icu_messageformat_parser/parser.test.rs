use formatjs_icu_messageformat_parser::error::{Location, LocationDetails};
use formatjs_icu_messageformat_parser::parser::*;
use formatjs_icu_messageformat_parser::types::*;

#[test]
fn test_position_default() {
    let pos = Position::default();
    assert_eq!(pos.offset, 0);
    assert_eq!(pos.line, 1);
    assert_eq!(pos.column, 1);
}

#[test]
fn test_is_alpha() {
    for name in ["a", "Z"] {
        let ast = Parser::new(format!("<{name}>value</{name}>"), ParserOptions::default())
            .parse()
            .unwrap();
        assert!(matches!(&ast[0], MessageFormatElement::Tag(tag) if tag.value == name));
    }
    for name in ["0", "_"] {
        let message = format!("<{name}>value</{name}>");
        assert!(
            Parser::new(&message, ParserOptions::default())
                .parse()
                .is_err()
        );
    }
}

#[test]
fn test_is_white_space() {
    for whitespace in [" ", "\t", "\n"] {
        let ast = Parser::new(
            format!("{{{whitespace}name{whitespace}}}"),
            ParserOptions::default(),
        )
        .parse()
        .unwrap();
        assert!(
            matches!(&ast[0], MessageFormatElement::Argument(argument) if argument.value == "name")
        );
    }
    assert!(
        Parser::new("{name extra}", ParserOptions::default())
            .parse()
            .is_err()
    );
}

#[test]
fn test_parser_creation() {
    let ast = Parser::new("Hello world", ParserOptions::default())
        .parse()
        .unwrap();
    assert!(
        matches!(&ast[0], MessageFormatElement::Literal(value) if value.value == "Hello world")
    );
}

#[test]
fn test_parse_plain_top_level_message() {
    let elements = Parser::new("Hello world", ParserOptions::default())
        .parse()
        .unwrap();

    assert_eq!(elements.len(), 1);
    match &elements[0] {
        MessageFormatElement::Literal(lit) => {
            assert_eq!(lit.value, "Hello world");
            assert_eq!(lit.location, None);
        }
        _ => panic!("Expected a literal element"),
    }
}

#[test]
fn test_parse_empty_message() {
    let elements = Parser::new("", ParserOptions::default()).parse().unwrap();
    assert!(elements.is_empty());
}

#[test]
fn test_parse_plain_top_level_message_with_location() {
    let elements = Parser::new(
        "Hello world",
        ParserOptions {
            capture_location: true,
            ..Default::default()
        },
    )
    .parse()
    .unwrap();

    assert_eq!(elements.len(), 1);
    match &elements[0] {
        MessageFormatElement::Literal(lit) => {
            assert_eq!(lit.value, "Hello world");
            assert_eq!(
                lit.location,
                Some(Location {
                    start: LocationDetails {
                        offset: 0,
                        line: 1,
                        column: 1,
                    },
                    end: LocationDetails {
                        offset: 11,
                        line: 1,
                        column: 12,
                    },
                })
            );
        }
        _ => panic!("Expected a literal element"),
    }
}

#[test]
fn captures_argument_offsets() {
    let ast = Parser::new(
        "ab{c}",
        ParserOptions {
            capture_location: true,
            ..Default::default()
        },
    )
    .parse()
    .unwrap();
    let MessageFormatElement::Argument(argument) = &ast[1] else {
        panic!("expected argument")
    };
    assert_eq!(argument.value, "c");
    let location = argument.location.as_ref().unwrap();
    assert_eq!(location.start.offset, 2);
    assert_eq!(location.end.offset, 5);
}

#[test]
fn parses_select_branches() {
    let ast = Parser::new("{v, select, a {A} other {B}}", ParserOptions::default())
        .parse()
        .unwrap();
    let MessageFormatElement::Select(select) = &ast[0] else {
        panic!("expected select")
    };
    assert_eq!(select.value, "v");
    assert_eq!(select.options.len(), 2);
}

#[test]
fn round_trips_literal_and_argument_boundaries() {
    for message in ["ab", "a<", "a{b}"] {
        let ast = Parser::new(message, ParserOptions::default())
            .parse()
            .unwrap();
        assert_eq!(formatjs_icu_messageformat_parser::print_ast(&ast), message);
    }
}

#[test]
fn test_parser_hindi_text_with_tags() {
    // Test parsing Hindi text with HTML tags: "ही किंमत <span>जास्त</span>"
    let parser = Parser::new("ही किंमत <span>जास्त</span>", ParserOptions::default());
    let result = parser.parse();

    assert!(
        result.is_ok(),
        "Failed to parse Hindi text with tags: {:?}",
        result.err()
    );

    let elements = result.unwrap();
    assert_eq!(elements.len(), 2, "Expected 2 elements (literal + tag)");

    // First element should be literal text "ही किंमत "
    match &elements[0] {
        MessageFormatElement::Literal(lit) => {
            assert_eq!(lit.value, "ही किंमत ", "First element should be Hindi text");
        }
        _ => panic!("First element should be a literal"),
    }

    // Second element should be a tag with Hindi text inside
    match &elements[1] {
        MessageFormatElement::Tag(tag) => {
            assert_eq!(tag.value, "span", "Tag name should be 'span'");
            assert_eq!(tag.children.len(), 1, "Tag should have 1 child");

            // Check the child is the Hindi literal "जास्त"
            match &tag.children[0] {
                MessageFormatElement::Literal(lit) => {
                    assert_eq!(lit.value, "जास्त", "Tag content should be Hindi text");
                }
                _ => panic!("Tag child should be a literal"),
            }
        }
        _ => panic!("Second element should be a tag"),
    }
}
