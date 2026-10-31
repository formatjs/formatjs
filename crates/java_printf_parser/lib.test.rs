use formatjs_java_printf_parser::{
    Argument, ArgumentReference, Conversion, Element, ErrorKind, NumberKind, Span, parse,
};

#[test]
fn preserves_borrowed_utf8_text_specifiers_and_byte_spans() {
    let source = "你好 %2$-12.3S 😀";
    let elements = parse(source).unwrap();
    assert_eq!(elements.len(), 3);
    let Element::Literal(first) = elements[0] else {
        panic!("literal expected")
    };
    assert_eq!(first.value, "你好 ");
    assert_eq!(first.span, Span { start: 0, end: 7 });
    let Element::Specifier(specifier) = elements[1] else {
        panic!("specifier expected")
    };
    assert_eq!(specifier.raw, "%2$-12.3S");
    assert_eq!(specifier.span, Span { start: 7, end: 16 });
    assert_eq!(
        specifier.argument,
        Some(Argument {
            index: 2,
            reference: ArgumentReference::Explicit
        })
    );
    assert_eq!(specifier.argument_index, Some(2));
    assert_eq!(specifier.flags, "-");
    assert_eq!(specifier.width, Some(12));
    assert_eq!(specifier.precision, Some(3));
    assert_eq!(specifier.conversion, Conversion::String);
    assert!(specifier.uppercase);
    for element in elements {
        let (span, text) = match element {
            Element::Literal(literal) => (literal.span, literal.value),
            Element::Specifier(specifier) => (specifier.span, specifier.raw),
        };
        assert_eq!(&source[span.start..span.end], text);
        assert_eq!(text.as_ptr(), source[span.start..].as_ptr());
    }
}

#[test]
fn explicit_relative_and_ordinary_indices_have_independent_counters() {
    let elements = parse("%2$s %s %<s %s %% %n %<s %4$<s").unwrap();
    let arguments: Vec<_> = elements
        .into_iter()
        .filter_map(|element| match element {
            Element::Specifier(specifier) => specifier.argument,
            Element::Literal(_) => None,
        })
        .collect();
    assert_eq!(
        arguments,
        [
            Argument {
                index: 2,
                reference: ArgumentReference::Explicit
            },
            Argument {
                index: 1,
                reference: ArgumentReference::Implicit
            },
            Argument {
                index: 1,
                reference: ArgumentReference::Previous
            },
            Argument {
                index: 2,
                reference: ArgumentReference::Implicit
            },
            Argument {
                index: 2,
                reference: ArgumentReference::Previous
            },
            Argument {
                index: 2,
                reference: ArgumentReference::Previous
            },
        ]
    );
}

#[test]
fn preserves_date_time_suffix_case_and_prefix_case() {
    for (input, suffix, uppercase) in [
        ("%tY", 'Y', false),
        ("%TY", 'Y', true),
        ("%ty", 'y', false),
        ("%tc", 'c', false),
    ] {
        let Element::Specifier(specifier) = parse(input).unwrap()[0] else {
            panic!("specifier expected")
        };
        assert_eq!(specifier.conversion, Conversion::DateTime(suffix));
        assert_eq!(specifier.uppercase, uppercase);
    }
}

#[test]
fn number_limits_match_java_signed_int_range_without_allocating_for_argument_indices() {
    for input in [
        "%2147483647$s",
        "%2147483647s",
        "%.2147483647s",
        "%0000000000000000000001$s",
    ] {
        assert!(parse(input).is_ok(), "{input}");
    }
    for (input, expected) in [
        ("%0$s", NumberKind::ArgumentIndex),
        ("%2147483648$s", NumberKind::ArgumentIndex),
        ("%2147483648s", NumberKind::Width),
        ("%.2147483648s", NumberKind::Precision),
        ("%999999999999999999999999999999s", NumberKind::Width),
    ] {
        assert_eq!(
            parse(input).unwrap_err().kind,
            ErrorKind::InvalidNumber(expected)
        );
    }
}

#[test]
fn rejects_malformed_formats_with_structured_errors_and_utf8_byte_spans() {
    for (input, kind) in [
        ("%", ErrorKind::MissingConversion),
        ("%q", ErrorKind::UnknownConversion('q')),
        ("%tq", ErrorKind::UnknownDateTimeSuffix('q')),
        ("%.s", ErrorKind::MissingPrecision),
        ("%--5s", ErrorKind::DuplicateFlag('-')),
        ("%+s", ErrorKind::UnsupportedFlag('+')),
        ("%+ d", ErrorKind::ConflictingFlags('+', ' ')),
        ("%-05d", ErrorKind::ConflictingFlags('-', '0')),
        ("%-s", ErrorKind::MissingWidth),
        ("%2n", ErrorKind::UnsupportedWidth),
        ("%.2d", ErrorKind::UnsupportedPrecision),
        ("%<s", ErrorKind::MissingPreviousArgument),
        ("%<%", ErrorKind::UnsupportedFlag('<')),
    ] {
        assert_eq!(parse(input).unwrap_err().kind, kind, "{input}");
    }
    let error = parse("😀 %é").unwrap_err();
    assert_eq!(error.kind, ErrorKind::UnknownConversion('é'));
    assert_eq!(error.span, Span { start: 5, end: 8 });
    assert_eq!(error.to_string(), "UnknownConversion('é') at bytes 5..8");
}

#[test]
fn leaves_xml_android_escapes_and_braces_as_literal_text() {
    let source = r#"<xliff:g id="value">%1$s</xliff:g>\n{literal} %@"#;
    assert_eq!(
        parse(source).unwrap_err().kind,
        ErrorKind::UnknownConversion('@')
    );
    let input = source.trim_end_matches(" %@");
    let elements = parse(input).unwrap();
    assert_eq!(elements.len(), 3);
    assert!(
        matches!(elements[2], Element::Literal(literal) if literal.value == r#"</xliff:g>\n{literal}"#)
    );
}
