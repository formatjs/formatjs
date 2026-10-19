import base64
import hashlib
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import FrozenInstanceError
from datetime import date, datetime

from intl import (
    Intl,
    IntlError,
    IntlErrorCode,
    MessageCatalog,
    MessageDescriptor,
    MessageSource,
    define_message,
    negotiate,
)


def assert_raises(
    error_type: type[Exception],
    expected_message: str,
    callback: Callable[[], object],
) -> None:
    try:
        callback()
    except error_type as error:
        assert expected_message in str(error)
    else:
        raise AssertionError(f"expected {error_type.__name__}")


def test_negotiates_locale() -> None:
    assert negotiate(["fr-CA", "fr"], "en", ["en", "fr"]) == "fr"


def test_shared_catalog_preserves_fallback_and_errors() -> None:
    messages = {
        "en-us": {"hello": "Hello", "missing": "English", "broken": "Safe"},
        "de-de": {"hello": "Hallo", "broken": "{broken"},
        "de": {"missing": "Parent"},
        "zh-Hant": {"hello": "Traditional"},
    }
    catalog = MessageCatalog(messages)
    for requested, expected in [
        ("de-DE", "de-DE"), ("zh-TW", "zh-Hant"), ("mk-MK", "en-US")
    ]:
        assert catalog.negotiate([requested], "en-US") == expected
        recorded = []
        for source in (messages, catalog):
            errors: list[IntlError] = []
            runtime = Intl([requested], "en-US", source, on_error=errors.append)
            assert runtime.locale == expected
            outputs = [
                runtime.format_message(key, default_message="Descriptor")
                for key in ("hello", "missing", "broken", "absent")
            ]
            assert outputs[1:] == ["English", "Safe", "Descriptor"]
            recorded.append(
                (outputs, [(e.code, e.source, e.locale, e.message) for e in errors])
            )
        assert recorded[0] == recorded[1]


def test_shared_catalog_is_an_immutable_snapshot() -> None:
    messages = {"en": {"hello": "Hello"}}
    catalog = MessageCatalog(messages)
    messages["en"]["hello"] = "Changed"
    messages.clear()
    assert_raises(
        FrozenInstanceError, "cannot assign", lambda: setattr(catalog, "_native", None)
    )
    runtime = Intl(["en"], "en", catalog)
    del catalog
    assert runtime.format_message("hello") == "Hello"


def test_shared_catalog_supports_thread_local_formatters() -> None:
    catalog = MessageCatalog({"en": {"hello": "Hello"}, "fr": {"hello": "Bonjour"}})
    main_errors: list[IntlError] = []
    main = Intl(["en"], "en", catalog, on_error=main_errors.append)

    def format_on_worker(locale: str) -> tuple[str, int]:
        errors: list[IntlError] = []
        runtime = Intl([locale], "en", catalog, on_error=errors.append)
        assert catalog.negotiate([locale], "en") == locale
        runtime.format_message("missing")
        return runtime.format_message("hello"), len(errors)

    with ThreadPoolExecutor(max_workers=4) as executor:
        assert list(executor.map(format_on_worker, ["en", "fr"] * 8)) == [
            ("Hello", 1), ("Bonjour", 1)
        ] * 8
    assert main.format_message("hello") == "Hello"
    assert main_errors == []


def test_shared_catalog_validates_locales_without_compiling_messages() -> None:
    assert_raises(
        ValueError, "Invalid locale", lambda: MessageCatalog({"not_a_locale!": {}})
    )
    catalog = MessageCatalog({"fr": {"broken": "{broken"}})
    assert_raises(
        ValueError,
        "Default locale has no translation catalog",
        lambda: Intl(["fr"], "en", catalog),
    )
    errors: list[IntlError] = []
    runtime = Intl(["fr"], "fr", catalog, on_error=errors.append)
    assert errors == []
    assert runtime.format_message("broken", default_message="Safe") == "Safe"
    assert [error.code for error in errors] == [IntlErrorCode.FORMAT_ERROR]


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
            values={"count": 2},
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

def test_reports_fallback_and_formats_python_dates() -> None:
    errors: list[IntlError] = []
    runtime = Intl(["fr"], "en", {"en": {}, "fr": {}}, on_error=errors.append)

    assert runtime.format_message("missing", default_message="Fallback") == "Fallback"
    assert len(errors) == 1
    assert errors[0].code == IntlErrorCode.MISSING_TRANSLATION
    assert errors[0].descriptor.id == "missing"
    assert errors[0].locale == "fr"
    assert errors[0].source == MessageSource.TRANSLATION

    errors.clear()
    broken = Intl(
        ["fr"],
        "en",
        {"en": {}, "fr": {"broken": "{broken"}},
        on_error=errors.append,
    )
    assert broken.format_message("broken", default_message="Safe") == "Safe"
    assert len(errors) == 1
    assert errors[0].code == IntlErrorCode.FORMAT_ERROR
    assert errors[0].source == MessageSource.TRANSLATION

    def reject_fallback(_error: IntlError) -> None:
        raise RuntimeError("fallback rejected")

    strict = Intl(["fr"], "en", {"en": {}, "fr": {}}, on_error=reject_fallback)
    try:
        strict.format_message("missing", default_message="Fallback")
    except RuntimeError as error:
        assert str(error) == "fallback rejected"
    else:
        raise AssertionError("on_error exception should propagate")

    english = Intl(["en"], "en", {"en": {}})
    message = MessageDescriptor(
        id="created",
        default_message="Created {value, date, medium}",
    )
    assert english.format_message(message, values={"value": date(2024, 1, 2)}) == (
        "Created Jan 2, 2024"
    )
    assert english.format_message(
        message, values={"value": datetime(2024, 1, 2, 3, 4, 5)}
    ) == ("Created Jan 2, 2024")


def test_formats_arguments_selects_and_plurals() -> None:
    runtime = Intl(
        ["en"],
        "en",
        {
            "en": {
                "greeting": "Hello, {name}!",
                "role": "{role, select, admin {Administrator} other {User}}",
                "tasks": "{count, plural, =0 {No tasks} one {# task} other {# tasks}}",
            }
        },
    )

    assert runtime.format_message("greeting", values={"name": "Ada"}) == "Hello, Ada!"
    assert runtime.format_message("role", values={"role": "admin"}) == "Administrator"
    assert runtime.format_message("role", values={"role": "member"}) == "User"
    assert runtime.format_message("tasks", values={"count": 0}) == "No tasks"
    assert runtime.format_message("tasks", values={"count": 1}) == "1 task"
    assert runtime.format_message("tasks", values={"count": 4}) == "4 tasks"


def test_falls_back_across_catalogs_and_descriptor() -> None:
    errors: list[IntlError] = []
    runtime = Intl(
        ["fr"],
        "en",
        {
            "fr": {"syntax": "{broken"},
            "en": {
                "syntax": "English fallback",
                "catalog-broken": "{broken",
            },
        },
        on_error=errors.append,
    )

    assert runtime.format_message("syntax", default_message="Descriptor fallback") == (
        "English fallback"
    )
    assert [(error.code, error.source, error.locale) for error in errors] == [
        (IntlErrorCode.FORMAT_ERROR, MessageSource.TRANSLATION, "fr")
    ]

    errors.clear()
    assert runtime.format_message(
        "catalog-broken", default_message="Descriptor fallback"
    ) == ("Descriptor fallback")
    assert [(error.code, error.source, error.locale) for error in errors] == [
        (IntlErrorCode.MISSING_TRANSLATION, MessageSource.TRANSLATION, "fr"),
        (IntlErrorCode.FORMAT_ERROR, MessageSource.DEFAULT_CATALOG, "en"),
    ]


def test_returns_verbatim_translation_after_all_formatting_fails() -> None:
    errors: list[IntlError] = []
    runtime = Intl(
        ["fr"],
        "en",
        {
            "fr": {"missing-value": "Traduction {name}"},
            "en": {"missing-value": "Catalog {name}"},
        },
        on_error=errors.append,
    )

    assert runtime.format_message(
        "missing-value", default_message="Default {name}"
    ) == ("Traduction {name}")
    assert [error.code for error in errors] == [IntlErrorCode.FORMAT_ERROR] * 3
    assert [error.source for error in errors] == [
        MessageSource.TRANSLATION,
        MessageSource.DEFAULT_CATALOG,
        MessageSource.DEFAULT_MESSAGE,
    ]


def test_handles_missing_and_empty_messages() -> None:
    errors: list[IntlError] = []
    runtime = Intl(
        ["fr"],
        "en",
        {"fr": {"empty": ""}, "en": {"empty": "English fallback"}},
        on_error=errors.append,
    )

    assert runtime.format_message("missing") == "missing"
    assert runtime.format_message("empty", default_message="Descriptor fallback") == (
        "English fallback"
    )
    assert [error.code for error in errors] == [
        IntlErrorCode.MISSING_TRANSLATION,
        IntlErrorCode.MISSING_TRANSLATION,
    ]

    default_errors: list[IntlError] = []
    default_runtime = Intl(
        ["en"], "en", {"en": {}}, on_error=default_errors.append
    )
    assert default_runtime.format_message("missing", default_message="Fallback") == "Fallback"
    assert default_errors == []


def test_formats_standalone_weekdays() -> None:
    for locale, skeleton, expected in [
        ("de", "EEE", "Do"),
        ("de", "EEEE", "Donnerstag"),
        ("de", "EEEEE", "D"),
        ("fi", "EEE", "to"),
        ("fi", "EEEE", "torstai"),
        ("fi", "EEEEE", "T"),
    ]:
        message = "{d, date, ::" + skeleton + "}"
        errors: list[IntlError] = []
        runtime = Intl(
            [locale], "en", {locale: {"weekday": message}, "en": {}},
            on_error=errors.append,
        )
        assert runtime.format_message(
            "weekday", values={"d": date(2026, 1, 1)}
        ) == expected
        assert errors == []


def test_rejects_invalid_calls_and_values() -> None:
    runtime = Intl(["en"], "en", {"en": {}})
    descriptor = MessageDescriptor(id="message", default_message="Message")

    assert_raises(
        ValueError,
        "default_message is required when id is omitted",
        runtime.format_message,
    )
    assert_raises(
        TypeError,
        "id was provided twice",
        lambda: runtime.format_message("first", id="second"),
    )
    assert_raises(
        TypeError,
        "descriptor fields cannot be combined with a descriptor",
        lambda: runtime.format_message(descriptor, default_message="Other"),
    )
    assert_raises(
        TypeError,
        "message values must be str, bool, int, float, date, datetime, or None",
        lambda: runtime.format_message(
            "message", values={"unsupported": object()}  # type: ignore[dict-item]
        ),
    )


if __name__ == "__main__":
    test_negotiates_locale()
    test_shared_catalog_preserves_fallback_and_errors()
    test_shared_catalog_is_an_immutable_snapshot()
    test_shared_catalog_supports_thread_local_formatters()
    test_shared_catalog_validates_locales_without_compiling_messages()
    test_formats_translation_and_fallback()
    test_reports_fallback_and_formats_python_dates()
    test_formats_arguments_selects_and_plurals()
    test_falls_back_across_catalogs_and_descriptor()
    test_returns_verbatim_translation_after_all_formatting_fails()
    test_handles_missing_and_empty_messages()
    test_formats_standalone_weekdays()
    test_rejects_invalid_calls_and_values()
