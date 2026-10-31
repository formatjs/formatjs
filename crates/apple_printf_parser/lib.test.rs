use formatjs_apple_printf_parser::{
    Amount, Argument, ArgumentReference, Conversion, Element, ErrorKind, Length, Span, parse,
};

fn specifiers(input: &str) -> Vec<formatjs_apple_printf_parser::Specifier<'_>> {
    parse(input)
        .unwrap()
        .into_iter()
        .filter_map(|element| match element {
            Element::Specifier(specifier) => Some(specifier),
            _ => None,
        })
        .collect()
}

#[test]
fn foundation_types_lengths_and_aliases() {
    let tokens = specifiers("%@ %D %U %O %C %S %s %p %hhd %hd %ld %lld %qd %jd %zd %td %Lf %lf %i");
    assert_eq!(
        tokens
            .iter()
            .map(|token| token.conversion)
            .collect::<Vec<_>>(),
        [
            Conversion::Object,
            Conversion::SignedInteger,
            Conversion::UnsignedInteger,
            Conversion::Octal,
            Conversion::Utf16Character,
            Conversion::Utf16String,
            Conversion::String,
            Conversion::Pointer,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::SignedInteger,
            Conversion::FloatingPoint,
            Conversion::FloatingPoint,
            Conversion::SignedInteger,
        ]
    );
    assert_eq!(tokens[1].length, Length::None);
    assert_eq!(
        tokens[8..17]
            .iter()
            .map(|token| token.length)
            .collect::<Vec<_>>(),
        [
            Length::Char,
            Length::Short,
            Length::Long,
            Length::LongLong,
            Length::LongLong,
            Length::IntMax,
            Length::Size,
            Length::PtrDiff,
            Length::LongDouble
        ]
    );
    for conversion in "diuoxXaAeEfFgGcCsSp@".chars() {
        assert!(parse(&format!("%{conversion}")).is_ok(), "{conversion}");
    }
}

#[test]
fn dynamic_arguments_precede_values_and_positional_reordering_resolves() {
    let tokens = specifiers("%*.*f %% %@");
    let argument = |index| Argument {
        index,
        reference: ArgumentReference::Implicit,
    };
    assert_eq!(tokens[0].width, Some(Amount::Argument(argument(1))));
    assert_eq!(tokens[0].precision, Some(Amount::Argument(argument(2))));
    assert_eq!(tokens[0].argument, Some(argument(3)));
    assert_eq!(tokens[1].argument, None);
    assert_eq!(tokens[2].argument, Some(argument(4)));
    let tokens = specifiers("%3$*1$.*2$f %4$@ %4$@");
    let argument = |index| Argument {
        index,
        reference: ArgumentReference::Explicit,
    };
    assert_eq!(tokens[0].width, Some(Amount::Argument(argument(1))));
    assert_eq!(tokens[0].precision, Some(Amount::Argument(argument(2))));
    assert_eq!(tokens[0].argument, Some(argument(3)));
    assert_eq!(tokens[1].argument, tokens[2].argument);
}

#[test]
fn literals_and_spans_are_borrowed_utf8_bytes() {
    let input = "你好 %.f 🦀 %%";
    let elements = parse(input).unwrap();
    let Element::Literal(literal) = elements[0] else {
        panic!()
    };
    assert_eq!(literal.value, "你好 ");
    assert_eq!(literal.span, Span { start: 0, end: 7 });
    let Element::Specifier(token) = elements[1] else {
        panic!()
    };
    assert_eq!(token.precision, Some(Amount::Fixed(0)));
    assert_eq!(token.span, Span { start: 7, end: 10 });
    for element in elements {
        match element {
            Element::Literal(token) => {
                assert_eq!(&input[token.span.start..token.span.end], token.value)
            }
            Element::Specifier(token) => {
                assert_eq!(&input[token.span.start..token.span.end], token.raw)
            }
        }
    }
}

#[test]
fn invalid_and_unsupported_formats_have_specific_errors() {
    for (input, error) in [
        ("%", ErrorKind::MissingConversion),
        ("%💥", ErrorKind::UnknownConversion('💥')),
        ("%0$@", ErrorKind::InvalidNumber),
        ("%128$@", ErrorKind::InvalidNumber),
        ("%2147483648d", ErrorKind::InvalidNumber),
        ("%.2147483648f", ErrorKind::InvalidNumber),
        ("%1$@ %@", ErrorKind::MixedIndexing),
        ("%1$*f", ErrorKind::MixedIndexing),
        ("%2$@", ErrorKind::MissingArgument(1)),
        ("%1$@ %3$d", ErrorKind::MissingArgument(2)),
        ("%n", ErrorKind::UnsupportedWriteCount),
        ("%#@count@", ErrorKind::UnsupportedNamedReference),
        ("%lc", ErrorKind::InvalidLength),
        ("%ls", ErrorKind::InvalidLength),
        ("%l@", ErrorKind::InvalidLength),
        ("%Ld", ErrorKind::InvalidLength),
        ("%lD", ErrorKind::InvalidLength),
        ("%5%", ErrorKind::InvalidPercent),
        ("%'d", ErrorKind::UnknownConversion('\'')),
        ("%{public}@", ErrorKind::UnknownConversion('{')),
    ] {
        assert_eq!(parse(input).unwrap_err().kind, error, "{input}");
    }
    assert_eq!(parse("é %💥").unwrap_err().span, Span { start: 3, end: 8 });
}

#[test]
fn repeated_flags_and_maximum_numeric_fields_do_not_allocate_widths() {
    let tokens = specifiers("%--00++ 2147483647.2147483647d");
    assert_eq!(tokens[0].flags, "--00++ ");
    assert_eq!(tokens[0].width, Some(Amount::Fixed(i32::MAX as u32)));
    assert_eq!(tokens[0].precision, Some(Amount::Fixed(i32::MAX as u32)));
    let input = (1..=127)
        .map(|index| format!("%{index}$@"))
        .collect::<String>();
    assert_eq!(
        specifiers(&input).last().unwrap().argument.unwrap().index,
        127
    );
}
