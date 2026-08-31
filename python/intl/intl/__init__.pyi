from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date, datetime
from enum import StrEnum

MessageValue = str | bool | int | float | date | datetime | None

@dataclass(frozen=True, slots=True)
class MessageDescriptor:
    default_message: str
    id: str = ""
    description: str | None = None
    def __post_init__(self) -> None: ...

def define_message(
    *,
    default_message: str,
    id: str | None = None,
    description: str | None = None,
) -> MessageDescriptor: ...

class IntlErrorCode(StrEnum):
    FORMAT_ERROR = "FORMAT_ERROR"
    MISSING_TRANSLATION = "MISSING_TRANSLATION"

class MessageSource(StrEnum):
    TRANSLATION = "translation"
    DEFAULT_CATALOG = "default_catalog"
    DEFAULT_MESSAGE = "default_message"

class IntlError(Exception):
    code: IntlErrorCode
    descriptor: MessageDescriptor
    locale: str
    source: MessageSource
    message: str
    def __init__(
        self,
        code: IntlErrorCode,
        descriptor: MessageDescriptor,
        locale: str,
        source: MessageSource,
        message: str,
    ) -> None: ...

class Intl:
    def __init__(
        self,
        requested_locales: list[str],
        default_locale: str,
        messages: Mapping[str, Mapping[str, str]],
        on_error: Callable[[IntlError], None] | None = None,
    ) -> None: ...
    @property
    def locale(self) -> str: ...
    def format_message(
        self,
        descriptor: MessageDescriptor | str | None = None,
        *,
        id: str | None = None,
        default_message: str | None = None,
        description: str | None = None,
        values: Mapping[str, MessageValue] | None = None,
    ) -> str: ...

def negotiate(
    requested_locales: list[str],
    default_locale: str,
    available_locales: list[str],
) -> str: ...
