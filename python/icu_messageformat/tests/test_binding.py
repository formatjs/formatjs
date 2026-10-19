from icu_messageformat import IcuMessageFormat


def test_formats_plural() -> None:
    message = IcuMessageFormat(
        "{count, plural, one {# item} other {# items}}",
        locale="en",
    )
    assert message.format({"count": 2}) == "2 items"


def test_exposes_ast() -> None:
    assert IcuMessageFormat("Hello, {name}!").get_ast()[1]["value"] == "name"


def test_formats_standalone_weekdays() -> None:
    for locale, skeleton, expected in [
        ("de", "EEE", "Do"),
        ("de", "EEEE", "Donnerstag"),
        ("de", "EEEEE", "D"),
        ("fi", "EEE", "to"),
        ("fi", "EEEE", "torstai"),
        ("fi", "EEEEE", "T"),
    ]:
        message = IcuMessageFormat("{d, date, ::" + skeleton + "}", locale=locale)
        assert message.format({"d": 0}) == expected


if __name__ == "__main__":
    test_formats_plural()
    test_exposes_ast()
    test_formats_standalone_weekdays()
