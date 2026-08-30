from typing import Mapping

MessageValue = str | bool | int | float | None

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
        id: str,
        *,
        default_message: str = "",
        values: Mapping[str, MessageValue] | None = None,
    ) -> str: ...

def negotiate(
    requested_locales: list[str],
    default_locale: str,
    available_locales: list[str],
) -> str: ...
