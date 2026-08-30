"""ICU number and date skeleton parsing."""

from icu_skeleton_parser._native import parse_date_time, parse_number

parse_date_time_skeleton = parse_date_time
parse_number_skeleton = parse_number

__all__ = ["parse_date_time_skeleton", "parse_number_skeleton"]
