from typing import Any

def parse(
    message: str,
    *,
    ignore_tag: bool = False,
    requires_other_clause: bool = False,
    should_parse_skeletons: bool = False,
    capture_location: bool = False,
) -> list[dict[str, Any]]: ...
def print_ast(ast: list[dict[str, Any]]) -> str: ...
