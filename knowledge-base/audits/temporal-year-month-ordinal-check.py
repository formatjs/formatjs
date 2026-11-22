"""Check ordinal inequalities for the source's finite leap-position formulas."""

def lunisolar_present(leap):
    codes = []
    for n in range(1, 13):
        codes.append((n, False))
        if n == leap:
            codes.append((n, True))
    return codes


def l_ord(code, leap):
    number, suffix = code
    return number + int(leap > 0 and (number > leap or (number == leap and suffix)))


def h_ord(code, leap):
    number, suffix = code
    return 6 if suffix else number + int(leap and number >= 6)


def check(mapper, positions, present):
    checks = 0
    all_codes = sorted({code for p in positions for code in present(p)})
    for current in positions:
        actual = present(current)
        assert 12 <= len(actual) <= 13
        assert [mapper(c, current) for c in actual] == list(range(1, len(actual) + 1))
        for adjacent in positions:
            for origin_code in all_codes:
                old = mapper(origin_code, current)
                new = mapper(origin_code, adjacent)
                assert abs(new - old) <= 1
                for m, target_code in enumerate(actual, 1):
                    if origin_code >= target_code or old >= m:
                        assert new >= m - 1
                    if origin_code <= target_code or old <= m:
                        assert new <= m + 1
                    checks += 1
    return checks

print("Chinese/Dangi ordinal cases:", check(l_ord, range(13), lunisolar_present))
print("Hebrew ordinal cases:", check(h_ord, (0, 1), lambda leap: lunisolar_present(5 * leap)))
