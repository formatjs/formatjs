from dataclasses import dataclass
from typing import Mapping

MessageValue = str | bool | int | float | None

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

class Intl:
    def __init__(
        self,
        requested_locales: list[str],
        default_locale: str,
        messages: Mapping[str, Mapping[str, str]],
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
        **message_values: MessageValue,
    ) -> str: ...

def negotiate(
    requested_locales: list[str],
    default_locale: str,
    available_locales: list[str],
) -> str: ...
