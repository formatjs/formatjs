"""Test262 gates report tracked failures separately from passing tests."""

load("@aspect_rules_js//js:defs.bzl", "js_test")

def test262_test(name, suite, prelude, data, baseline = "test262-baseline.json"):
    """Run complete suites, with separate strict and native control targets."""
    for mode in ["baseline", "strict", "native"]:
        args = ["--suite", suite, "--root", "../+http_archive+com_github_tc39_test262"]
        inputs = data + ["//:node_modules/minimist", "//:node_modules/test262-harness"]
        if mode != "native":
            args += ["--prelude", "$(rootpath %s)" % prelude]
            inputs += [prelude]
        if mode == "baseline":
            args += ["--baseline", "$(rootpath %s)" % baseline]
            inputs += [baseline]
        else:
            args += ["--" + mode]
        js_test(
            name = name + ("" if mode == "baseline" else "-" + mode),
            entry_point = "//tools/test262:runner",
            args = args,
            data = inputs,
            size = "large",
            tags = [] if mode == "baseline" else ["manual"],
        )
