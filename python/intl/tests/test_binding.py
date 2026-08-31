import base64
import hashlib

from intl import Intl, MessageDescriptor, define_message, negotiate


def test_negotiates_locale() -> None:
    assert negotiate(["fr-CA", "fr"], "en", ["en", "fr"]) == "fr"


def test_formats_translation_and_fallback() -> None:
    generated_id = base64.b64encode(
        hashlib.sha512(b"Welcome#Home title").digest()
    ).decode()[:10]
    runtime = Intl(
        ["fr-CA", "fr"],
        "en",
        {
            "en": {"tasks": "{count, plural, one {# task} other {# tasks}}"},
            "fr": {
                "tasks": "{count, plural, one {# tâche} other {# tâches}}",
                generated_id: "Bienvenue",
            },
        },
    )
    assert runtime.locale == "fr"
    assert runtime.format_message("tasks", values={"count": 2}) == "2 tâches"
    assert (
        runtime.format_message(
            MessageDescriptor(
                id="tasks",
                default_message="{count, plural, one {# task} other {# tasks}}",
            ),
            count=2,
        )
        == "2 tâches"
    )
    assert runtime.format_message("missing", default_message="Fallback") == "Fallback"
    assert (
        runtime.format_message(
            default_message="Welcome",
            description="Home title",
        )
        == "Bienvenue"
    )
    descriptor = define_message(
        default_message="Welcome",
        description="Home title",
    )
    assert runtime.format_message(descriptor) == "Bienvenue"
    assert descriptor.id == generated_id

    try:
        runtime.format_message("tasks", values={"count": 1}, count=2)
    except TypeError as error:
        assert str(error) == "message value was provided twice: count"
    else:
        raise AssertionError("duplicate message value should fail")


if __name__ == "__main__":
    test_negotiates_locale()
    test_formats_translation_and_fallback()
