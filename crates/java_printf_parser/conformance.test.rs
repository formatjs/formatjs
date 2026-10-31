use formatjs_java_printf_parser::{Conversion, Element, parse};

fn unhex(value: &str) -> String {
    let bytes = value
        .as_bytes()
        .chunks_exact(2)
        .map(|pair| u8::from_str_radix(std::str::from_utf8(pair).unwrap(), 16).unwrap())
        .collect();
    String::from_utf8(bytes).unwrap()
}

#[test]
fn matches_java_formatter_syntax_and_argument_selection() {
    let mut cases = 0;
    for line in include_str!(env!("JAVA_FORMATTER_FIXTURES")).lines() {
        let parts: Vec<_> = line.split('\t').collect();
        let source = unhex(parts[1]);
        let parsed = parse(&source);
        match parts[0] {
            "syntax" => assert_eq!(parsed.is_ok(), parts[2] == "true", "{source:?}: {parsed:?}"),
            "arguments" => {
                let mut rendered = String::new();
                for element in parsed.unwrap() {
                    match element {
                        Element::Literal(literal) => rendered.push_str(literal.value),
                        Element::Specifier(specifier) => match specifier.conversion {
                            Conversion::Percent => rendered.push('%'),
                            Conversion::LineSeparator => rendered.push('\n'),
                            Conversion::String => rendered.push_str(
                                ["A", "B", "C", "D"]
                                    [(specifier.argument.unwrap().index - 1) as usize],
                            ),
                            other => panic!("Unexpected conversion: {other:?}"),
                        },
                    }
                }
                assert_eq!(rendered, unhex(parts[2]), "{source:?}");
            }
            other => panic!("Unknown oracle case: {other}"),
        }
        cases += 1;
    }
    assert!(cases > 6000, "Oracle corpus incomplete: {cases}");
}
