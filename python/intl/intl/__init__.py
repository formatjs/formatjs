"""High-level internationalization runtime."""

import base64
import hashlib
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date, datetime
from enum import StrEnum

from intl._native import Intl as _NativeIntl
from intl._native import negotiate

MessageValue = str | bool | int | float | date | datetime | None


def _generate_id(default_message: str, description: str | None) -> str:
    content = " ".join(default_message.split())
    if description is not None:
        content += f"#{description}"
    return base64.b64encode(hashlib.sha512(content.encode()).digest()).decode()[:10]


@dataclass(frozen=True, slots=True)
class MessageDescriptor:
    default_message: str
    id: str = ""
    description: str | None = None

    def __post_init__(self) -> None:
        if not self.id:
            object.__setattr__(
                self,
                "id",
                _generate_id(self.default_message, self.description),
            )


def define_message(
    *,
    default_message: str,
    id: str | None = None,
    description: str | None = None,
) -> MessageDescriptor:
    return MessageDescriptor(
        id=id or "",
        default_message=default_message,
        description=description,
    )


class IntlErrorCode(StrEnum):
    FORMAT_ERROR = "FORMAT_ERROR"
    MISSING_TRANSLATION = "MISSING_TRANSLATION"


class MessageSource(StrEnum):
    TRANSLATION = "translation"
    DEFAULT_CATALOG = "default_catalog"
    DEFAULT_MESSAGE = "default_message"


class IntlError(Exception):
    def __init__(
        self,
        code: IntlErrorCode,
        descriptor: MessageDescriptor,
        locale: str,
        source: MessageSource,
        message: str,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.descriptor = descriptor
        self.locale = locale
        self.source = source
        self.message = message


class Intl:
    def __init__(
        self,
        requested_locales: list[str],
        default_locale: str,
        messages: Mapping[str, Mapping[str, str]],
        on_error: Callable[[IntlError], None] | None = None,
    ) -> None:
        def handle_error(
            code: str,
            message_id: str,
            default_message: str,
            description: str | None,
            locale: str,
            source: str,
            message: str,
        ) -> None:
            if on_error is not None:
                on_error(
                    IntlError(
                        code=IntlErrorCode(code),
                        descriptor=MessageDescriptor(
                            id=message_id,
                            default_message=default_message,
                            description=description,
                        ),
                        locale=locale,
                        source=MessageSource(source),
                        message=message,
                    )
                )

        self._native = _NativeIntl(
            requested_locales,
            default_locale,
            {locale: dict(locale_messages) for locale, locale_messages in messages.items()},
            handle_error if on_error is not None else None,
        )

    @property
    def locale(self) -> str:
        return self._native.locale

    def format_message(
        self,
        descriptor: MessageDescriptor | str | None = None,
        *,
        id: str | None = None,
        default_message: str | None = None,
        description: str | None = None,
        values: Mapping[str, MessageValue] | None = None,
    ) -> str:
        if isinstance(descriptor, str):
            if id is not None:
                raise TypeError("id was provided twice")
            id = descriptor
        elif descriptor is not None:
            if id is not None or default_message is not None or description is not None:
                raise TypeError("descriptor fields cannot be combined with a descriptor")
            id = descriptor.id or None
            default_message = descriptor.default_message
            description = descriptor.description

        return self._native.format_message(
            id,
            default_message=default_message or "",
            description=description,
            values=dict(values or {}),
        )


__all__ = [
    "Intl",
    "IntlError",
    "IntlErrorCode",
    "MessageDescriptor",
    "MessageSource",
    "define_message",
    "negotiate",
]
