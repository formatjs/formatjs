use formatjs_cli::static_evaluation::evaluate_strings;

fn evaluate(prefix: &str, expression: &str) -> Option<String> {
    let source = format!("{prefix}; defineMessage({{defaultMessage: {expression}}})");
    let start = source.rfind(expression).unwrap();
    let start = source[..start].encode_utf16().count() as u32;
    let end = start + expression.encode_utf16().count() as u32;
    let values = evaluate_strings(&source, "test.tsx", &[(start, end)]).unwrap();
    values.into_iter().next().map(|value| {
        assert_eq!((value.start, value.end), (start, end));
        value.value
    })
}

#[test]
fn evaluates_oxc_expressions_and_local_constants() {
    for (prefix, expression, expected) in [
        ("const greeting = 'Hello'", "greeting", "Hello"),
        (
            "const first = 'Hel'; const greeting = first + 'lo'",
            "greeting",
            "Hello",
        ),
        ("const name = 'world'", "`Hello ${name}`", "Hello world"),
        (
            "const count = 1 + 1",
            "count === 2 ? 'Hello' : 'Wrong'",
            "Hello",
        ),
        (
            "const greeting = ('Hello' as const) satisfies string",
            "greeting!",
            "Hello",
        ),
        (
            "const text = '😀é'; const greeting = 'Hello'",
            "greeting",
            "Hello",
        ),
    ] {
        assert_eq!(
            evaluate(prefix, expression).as_deref(),
            Some(expected),
            "{expression}"
        );
    }
}

#[test]
fn rejects_unsafe_or_non_string_values() {
    for (prefix, expression) in [
        ("let greeting = 'Hello'", "greeting"),
        ("import {greeting} from './messages'", "greeting"),
        ("const {greeting} = {greeting: 'Hello'}", "greeting"),
        ("const greeting = 'Hello'; greeting = 'Wrong'", "greeting"),
        ("const a = b; const b = a", "a"),
        ("", "42"),
        ("", "(sideEffect(), 'Hello')"),
        ("const greeting = runtime()", "greeting"),
    ] {
        assert_eq!(evaluate(prefix, expression), None, "{prefix}: {expression}");
    }
}

#[test]
fn caches_repeated_constant_initializers() {
    let mut declarations = "const value0 = 'H';".to_string();
    for index in 1..30 {
        declarations.push_str(&format!("const value{index} = value{} + 'i';", index - 1));
    }
    assert_eq!(
        evaluate(&declarations, "value29"),
        Some(format!("H{}", "i".repeat(29)))
    );
}
