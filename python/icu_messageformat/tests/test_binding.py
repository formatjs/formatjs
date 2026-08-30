from icu_messageformat import IcuMessageFormat


def test_formats_plural() -> None:
    message = IcuMessageFormat(
        "{count, plural, one {# item} other {# items}}",
        locale="en",
    )
    assert message.format({"count": 2}) == "2 items"


def test_exposes_ast() -> None:
    assert IcuMessageFormat("Hello, {name}!").get_ast()[1]["value"] == "name"
