"""Test262 gates report tracked failures separately from passing tests."""

load("@aspect_rules_js//js:defs.bzl", "js_test")

def test262_test(name, suite, prelude, data, baseline = "test262-baseline.json"):
    """Run every selected test, failing on baseline drift or any harness error."""
    for strict in [False, True]:
        js_test(
            name = name + ("-strict" if strict else ""),
            entry_point = "//tools/test262:runner",
            args = [
                "--suite",
                suite,
                "--root",
                "../+http_archive+com_github_tc39_test262",
                "--prelude",
                "$(rootpath %s)" % prelude,
                "--baseline",
                "$(rootpath %s)" % baseline,
            ] + (["--strict"] if strict else []),
            data = data + [
                prelude,
                baseline,
                "//:node_modules/minimist",
                "//:node_modules/test262-harness",
            ],
            size = "large",
            tags = ["manual"] if strict else [],
        )
