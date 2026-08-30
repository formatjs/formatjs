from icu_messageformat_parser import parse, print_ast


def test_parse_and_print() -> None:
    ast = parse("Hello, {name}!")
    assert [element["type"] for element in ast] == [0, 1, 0]
    assert print_ast(ast) == "Hello, {name}!"


def test_parse_error() -> None:
    try:
        parse("{count, plural, one {item}}", requires_other_clause=True)
    except ValueError:
        return
    raise AssertionError("parse should reject a plural without other")
