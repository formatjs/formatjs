"""Generated harness execution with separate baseline validation."""

load("@aspect_rules_js//js:defs.bzl", "js_run_binary")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

def test262_test(name, suite, prelude, data, baseline = "test262-baseline.json"):
    """Keep direct strict/native tests and validate captured baseline reports."""
    root = "../+http_archive+com_github_tc39_test262"
    realm_prelude = name + "-realm-prelude.js"
    js_run_binary(
        name = name + "-realm-prelude",
        tool = "//tools/test262:prelude",
        srcs = [prelude],
        outs = [realm_prelude],
        args = ["--input", "$(rootpath %s)" % prelude, "--out", "$(rootpath %s)" % realm_prelude],
    )
    args = [
        "--reporter",
        "json",
        "--reporter-keys",
        "file,scenario,result",
        "--errorForFailures",
        "--timeout",
        "30000",
        "--test262Dir",
        root,
        root + "/test/" + suite + "/**/*.js",
    ]
    polyfill_args = args + ["--prelude", "$(rootpath %s)" % realm_prelude]
    test262_harness_bin.test262_harness_binary(
        name = name + "-harness",
        data = data + [realm_prelude],
        tags = ["manual"],
        testonly = True,
    )

    # Reports belong to test execution, so --nocache_test_results reruns the
    # harness instead of revalidating a cached build output.
    sh_test(
        name = name,
        srcs = ["//tools/test262:run.sh"],
        data = [":" + name + "-harness", realm_prelude, baseline, "//tools/test262:validator"],
        args = ["$(rootpath :%s-harness)" % name, "$(rootpath //tools/test262:validator)", suite, "$(rootpath %s)" % baseline] + polyfill_args,
        env = {"TZ": "UTC"},
        size = "large",
    )
    for mode in ["strict", "native"]:
        test262_harness_bin.test262_harness_test(
            name = name + "-" + mode,
            args = polyfill_args if mode == "strict" else args,
            data = data + ([realm_prelude] if mode == "strict" else []),
            env = {"TZ": "UTC"},
            size = "large",
            tags = ["manual"],
        )
