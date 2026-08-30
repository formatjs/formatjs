from intl import Intl, negotiate


def test_negotiates_locale() -> None:
    assert negotiate(["fr-CA", "fr"], "en", ["en", "fr"]) == "fr"


def test_formats_translation_and_fallback() -> None:
    runtime = Intl(
        ["fr-CA", "fr"],
        "en",
        {
            "en": {"tasks": "{count, plural, one {# task} other {# tasks}}"},
            "fr": {"tasks": "{count, plural, one {# tâche} other {# tâches}}"},
        },
    )
    assert runtime.locale == "fr"
    assert runtime.format_message("tasks", values={"count": 2}) == "2 tâches"
    assert runtime.format_message("missing", default_message="Fallback") == "Fallback"
