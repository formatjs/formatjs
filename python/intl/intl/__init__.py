"""High-level internationalization runtime."""

import base64
import hashlib
from collections.abc import Mapping
from dataclasses import dataclass

from intl._native import Intl as _NativeIntl
from intl._native import negotiate

MessageValue = str | bool | int | float | None


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


class Intl:
    def __init__(
        self,
        requested_locales: list[str],
        default_locale: str,
        messages: Mapping[str, Mapping[str, str]],
    ) -> None:
        self._native = _NativeIntl(
            requested_locales,
            default_locale,
            {locale: dict(locale_messages) for locale, locale_messages in messages.items()},
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
        **message_values: MessageValue,
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

        merged_values: dict[str, MessageValue] = dict(values or {})
        duplicates = merged_values.keys() & message_values.keys()
        if duplicates:
            duplicate = min(duplicates)
            raise TypeError(f"message value was provided twice: {duplicate}")
        merged_values.update(message_values)
        return self._native.format_message(
            id,
            default_message=default_message or "",
            description=description,
            values=merged_values,
        )


__all__ = ["Intl", "MessageDescriptor", "define_message", "negotiate"]
