use formatjs_icu_messageformat_parser::error::*;

#[test]
fn test_error_kind_discriminants() {
    // Verify that error kinds have the correct numeric values
    assert_eq!(ErrorKind::ExpectArgumentClosingBrace as u8, 1);
    assert_eq!(ErrorKind::EmptyArgument as u8, 2);
    assert_eq!(ErrorKind::MalformedArgument as u8, 3);
    assert_eq!(ErrorKind::InvalidTagName as u8, 25);
    assert_eq!(ErrorKind::UnmatchedClosingTag as u8, 26);
    assert_eq!(ErrorKind::UnclosedTag as u8, 27);
}

#[test]
fn test_parser_error_display() {
    let location = Location {
        start: LocationDetails {
            offset: 0,
            line: 1,
            column: 5,
        },
        end: LocationDetails {
            offset: 10,
            line: 1,
            column: 15,
        },
    };
    let error = ParserError::new(
        ErrorKind::EmptyArgument,
        "Argument is empty".to_string(),
        location,
    );
    let display = format!("{}", error);
    assert!(display.contains("EMPTY_ARGUMENT"));
    assert!(display.contains("line 1"));
    assert!(display.contains("column 5"));
    assert!(display.contains("Argument is empty"));
}

#[test]
fn test_location_details() {
    let details = LocationDetails {
        offset: 10,
        line: 2,
        column: 5,
    };
    assert_eq!(details.offset, 10);
    assert_eq!(details.line, 2);
    assert_eq!(details.column, 5);
}
