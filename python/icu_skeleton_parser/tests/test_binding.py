from icu_skeleton_parser import parse_date_time_skeleton, parse_number_skeleton


def test_parse_number_skeleton() -> None:
    assert parse_number_skeleton("currency/USD") == {
        "currency": "USD",
        "style": "currency",
    }


def test_parse_date_time_skeleton() -> None:
    assert parse_date_time_skeleton("yMMMd") == {
        "day": "numeric",
        "month": "short",
        "year": "numeric",
    }
