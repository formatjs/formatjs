use formatjs_icu_messageformat_parser::parser::{Parser, ParserOptions};
use formatjs_icu_messageformat_parser::printer::*;
use formatjs_icu_messageformat_parser::types::*;

fn parse_message(message: &str) -> Vec<MessageFormatElement> {
    Parser::new(message, ParserOptions::default())
        .parse()
        .expect("message should parse")
}

#[test]
fn test_print_literal() {
    let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
        "Hello, world!".to_string(),
    ))];
    assert_eq!(print_ast(&ast), "Hello, world!");
}

#[test]
fn test_print_tag_like_literal() {
    let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
        "The URL is defined as <Issuer URL>/.well-known/openid-configuration.".to_string(),
    ))];

    assert_eq!(
        print_ast(&ast),
        "The URL is defined as '<Issuer URL>'/.well-known/openid-configuration."
    );
}

#[test]
fn test_print_quoted_literals_with_apostrophes() {
    let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
        "This {isn't} obvious and <Bob's URL> works.".to_string(),
    ))];

    assert_eq!(
        print_ast(&ast),
        "This '{isn''t}' obvious and '<Bob''s URL>' works."
    );
}

#[test]
fn test_print_tag_syntax_delimiters() {
    let ast = vec![MessageFormatElement::Literal(LiteralElement::new(
        "This is <b>HTML</b> and <i>XML</i>.".to_string(),
    ))];

    assert_eq!(
        print_ast(&ast),
        "This is '<b>'HTML'</b>' and '<i>'XML'</i>'."
    );
}

#[test]
fn test_print_adjacent_syntax_as_one_quoted_span() {
    let ast = parse_message("Use }} to close");

    assert_eq!(print_ast(&ast), "Use '}}' to close");
}

#[test]
fn test_print_literal_syntax_runs_round_trip() {
    for input in ["Use }} to close", "a }}< b", "}}}", "<}}", "'{a}{b}'"] {
        let ast = parse_message(input);
        let output = print_ast(&ast);

        assert_eq!(parse_message(&output), ast, "printed message: {output}");
    }
}

#[test]
fn test_print_apostrophe_before_quoted_span_round_trip() {
    let ast = parse_message("a '''}' b");
    let output = print_ast(&ast);

    assert_eq!(parse_message(&output), ast);
}

#[test]
fn test_print_literal_pounds_inside_plural_tag_round_trip() {
    let ast = parse_message("{count, plural, other {<b>'##'</b>}}");
    let output = print_ast(&ast);

    assert_eq!(output, "{count,plural,other{<b>'##'</b>}}");
    assert_eq!(parse_message(&output), ast);
}

#[test]
fn test_print_argument() {
    let ast = vec![MessageFormatElement::Argument(ArgumentElement::new(
        "name".to_string(),
    ))];
    assert_eq!(print_ast(&ast), "{name}");
}

#[test]
fn test_print_number() {
    let elem = NumberElement {
        value: "count".to_string(),
        style: Some(NumberSkeletonOrStyle::String("percent".to_string())),
        location: None,
    };
    let ast = vec![MessageFormatElement::Number(elem)];
    assert_eq!(print_ast(&ast), "{count, number, percent}");
}

#[test]
fn test_print_date() {
    let elem = DateElement {
        value: "today".to_string(),
        style: Some(DateTimeSkeletonOrStyle::String("short".to_string())),
        location: None,
    };
    let ast = vec![MessageFormatElement::Date(elem)];
    assert_eq!(print_ast(&ast), "{today, date, short}");
}

#[test]
fn test_print_pound() {
    let ast = vec![MessageFormatElement::Pound(PoundElement { location: None })];
    assert_eq!(print_ast(&ast), "#");
}

#[test]
fn test_print_tag() {
    let tag = TagElement {
        value: "b".to_string(),
        children: vec![MessageFormatElement::Literal(LiteralElement::new(
            "bold".to_string(),
        ))],
        location: None,
    };
    let ast = vec![MessageFormatElement::Tag(tag)];
    assert_eq!(print_ast(&ast), "<b>bold</b>");
}

#[test]
fn test_print_select() {
    use indexmap::IndexMap;

    let mut options = IndexMap::new();
    options.insert(
        "male".to_string(),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "He".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        "female".to_string(),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "She".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        "other".to_string(),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "They".to_string(),
            ))],
            location: None,
        },
    );

    let select = SelectElement {
        value: "gender".to_string(),
        options,
        location: None,
    };

    let ast = vec![MessageFormatElement::Select(select)];
    let result = print_ast(&ast);

    // Keys are sorted alphabetically: female, male, other
    assert_eq!(result, "{gender,select,female{She} male{He} other{They}}");
}

#[test]
fn test_print_plural() {
    use indexmap::IndexMap;

    let mut options = IndexMap::new();
    options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "# item".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "# items".to_string(),
            ))],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "count".to_string(),
        options,
        offset: 0,
        plural_type: PluralType::Cardinal,
        location: None,
    };

    let ast = vec![MessageFormatElement::Plural(plural)];
    let result = print_ast(&ast);

    // Keys are sorted in LDML order: one, other
    assert_eq!(result, "{count,plural,one{'#' item} other{'#' items}}");
}

#[test]
fn test_print_plural_ldml_order() {
    use indexmap::IndexMap;

    // Test that plural rules are printed in LDML order
    let mut options = IndexMap::new();
    options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "other".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Zero,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "zero".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Two,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "two".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "one".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Exact("=5".to_string()),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "exactly 5".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Exact("=0".to_string()),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "exactly 0".to_string(),
            ))],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "count".to_string(),
        options,
        offset: 0,
        plural_type: PluralType::Cardinal,
        location: None,
    };

    let ast = vec![MessageFormatElement::Plural(plural)];
    let result = print_ast(&ast);

    // LDML order: zero, one, two, (few, many skipped), other, then exact matches numerically
    assert_eq!(
        result,
        "{count,plural,zero{zero} one{one} two{two} other{other} =0{exactly 0} =5{exactly 5}}"
    );
}

#[test]
fn test_print_mixed_elements() {
    // Test a message with multiple different element types
    let ast = vec![
        MessageFormatElement::Literal(LiteralElement::new("Hello ".to_string())),
        MessageFormatElement::Argument(ArgumentElement::new("name".to_string())),
        MessageFormatElement::Literal(LiteralElement::new(", you have ".to_string())),
        MessageFormatElement::Number(NumberElement {
            value: "count".to_string(),
            style: Some(NumberSkeletonOrStyle::String("integer".to_string())),
            location: None,
        }),
        MessageFormatElement::Literal(LiteralElement::new(" messages.".to_string())),
    ];

    assert_eq!(
        print_ast(&ast),
        "Hello {name}, you have {count, number, integer} messages."
    );
}

#[test]
fn test_print_nested_plural_in_select() {
    use indexmap::IndexMap;

    // Create a plural element
    let mut plural_options = IndexMap::new();
    plural_options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "1 file".to_string(),
            ))],
            location: None,
        },
    );
    plural_options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "# files".to_string(),
            ))],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "fileCount".to_string(),
        options: plural_options,
        offset: 0,
        plural_type: PluralType::Cardinal,
        location: None,
    };

    // Create a select element with nested plural
    let mut select_options = IndexMap::new();
    select_options.insert(
        "download".to_string(),
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Literal(LiteralElement::new("Downloaded ".to_string())),
                MessageFormatElement::Plural(plural.clone()),
            ],
            location: None,
        },
    );
    select_options.insert(
        "upload".to_string(),
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Literal(LiteralElement::new("Uploaded ".to_string())),
                MessageFormatElement::Plural(plural),
            ],
            location: None,
        },
    );

    let select = SelectElement {
        value: "action".to_string(),
        options: select_options,
        location: None,
    };

    let ast = vec![MessageFormatElement::Select(select)];
    let result = print_ast(&ast);

    // Note: '#' inside plural gets quoted
    assert_eq!(
        result,
        "{action,select,download{Downloaded {fileCount,plural,one{1 file} other{'#' files}}} upload{Uploaded {fileCount,plural,one{1 file} other{'#' files}}}}"
    );
}

#[test]
fn test_print_nested_tags_with_formatting() {
    let ast = vec![MessageFormatElement::Tag(TagElement {
        value: "bold".to_string(),
        children: vec![
            MessageFormatElement::Literal(LiteralElement::new("You have ".to_string())),
            MessageFormatElement::Number(NumberElement {
                value: "count".to_string(),
                style: None,
                location: None,
            }),
            MessageFormatElement::Literal(LiteralElement::new(" new ".to_string())),
            MessageFormatElement::Tag(TagElement {
                value: "em".to_string(),
                children: vec![MessageFormatElement::Literal(LiteralElement::new(
                    "messages".to_string(),
                ))],
                location: None,
            }),
        ],
        location: None,
    })];

    assert_eq!(
        print_ast(&ast),
        "<bold>You have {count, number} new <em>messages</em></bold>"
    );
}

#[test]
fn test_print_complex_plural_with_nested_elements() {
    use indexmap::IndexMap;

    let mut options = IndexMap::new();
    options.insert(
        ValidPluralRule::Zero,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "No items".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Tag(TagElement {
                    value: "b".to_string(),
                    children: vec![MessageFormatElement::Literal(LiteralElement::new(
                        "1".to_string(),
                    ))],
                    location: None,
                }),
                MessageFormatElement::Literal(LiteralElement::new(" item".to_string())),
            ],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Tag(TagElement {
                    value: "b".to_string(),
                    children: vec![MessageFormatElement::Pound(PoundElement { location: None })],
                    location: None,
                }),
                MessageFormatElement::Literal(LiteralElement::new(" items".to_string())),
            ],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "itemCount".to_string(),
        options,
        offset: 0,
        plural_type: PluralType::Cardinal,
        location: None,
    };

    let ast = vec![MessageFormatElement::Plural(plural)];
    let result = print_ast(&ast);

    assert_eq!(
        result,
        "{itemCount,plural,zero{No items} one{<b>1</b> item} other{<b>#</b> items}}"
    );
}

#[test]
fn test_print_selectordinal() {
    use indexmap::IndexMap;

    let mut options = IndexMap::new();
    options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "#st place".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Two,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "#nd place".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Few,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "#rd place".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "#th place".to_string(),
            ))],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "position".to_string(),
        options,
        offset: 0,
        plural_type: PluralType::Ordinal,
        location: None,
    };

    let ast = vec![MessageFormatElement::Plural(plural)];
    let result = print_ast(&ast);

    // Note: '#' gets quoted inside plural
    assert_eq!(
        result,
        "{position,selectordinal,one{'#'st place} two{'#'nd place} few{'#'rd place} other{'#'th place}}"
    );
}

#[test]
fn test_print_plural_with_offset() {
    use indexmap::IndexMap;

    let mut options = IndexMap::new();
    options.insert(
        ValidPluralRule::Exact("=0".to_string()),
        PluralOrSelectOption {
            value: vec![MessageFormatElement::Literal(LiteralElement::new(
                "Nobody is viewing".to_string(),
            ))],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Exact("=1".to_string()),
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                MessageFormatElement::Literal(LiteralElement::new(" is viewing".to_string())),
            ],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::One,
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                MessageFormatElement::Literal(LiteralElement::new(
                    " and 1 other are viewing".to_string(),
                )),
            ],
            location: None,
        },
    );
    options.insert(
        ValidPluralRule::Other,
        PluralOrSelectOption {
            value: vec![
                MessageFormatElement::Argument(ArgumentElement::new("p0".to_string())),
                MessageFormatElement::Literal(LiteralElement::new(" and ".to_string())),
                MessageFormatElement::Pound(PoundElement { location: None }),
                MessageFormatElement::Literal(LiteralElement::new(
                    " others are viewing".to_string(),
                )),
            ],
            location: None,
        },
    );

    let plural = PluralElement {
        value: "viewerCount".to_string(),
        options,
        offset: 1,
        plural_type: PluralType::Cardinal,
        location: None,
    };

    let ast = vec![MessageFormatElement::Plural(plural)];
    let result = print_ast(&ast);

    assert_eq!(
        result,
        "{viewerCount,plural,offset:1 one{{p0} and 1 other are viewing} other{{p0} and # others are viewing} =0{Nobody is viewing} =1{{p0} is viewing}}"
    );
}

#[test]
fn test_print_date_and_time_with_skeletons() {
    let ast = vec![
        MessageFormatElement::Literal(LiteralElement::new("Meeting scheduled for ".to_string())),
        MessageFormatElement::Date(DateElement {
            value: "meetingDate".to_string(),
            style: Some(DateTimeSkeletonOrStyle::Skeleton(DateTimeSkeleton {
                pattern: "yMMMd".to_string(),
                location: None,
                parsed_options: DateTimeFormatOptions::default(),
            })),
            location: None,
        }),
        MessageFormatElement::Literal(LiteralElement::new(" at ".to_string())),
        MessageFormatElement::Time(TimeElement {
            value: "meetingTime".to_string(),
            style: Some(DateTimeSkeletonOrStyle::Skeleton(DateTimeSkeleton {
                pattern: "jmm".to_string(),
                location: None,
                parsed_options: DateTimeFormatOptions::default(),
            })),
            location: None,
        }),
    ];

    assert_eq!(
        print_ast(&ast),
        "Meeting scheduled for {meetingDate, date, ::yMMMd} at {meetingTime, time, ::jmm}"
    );
}
