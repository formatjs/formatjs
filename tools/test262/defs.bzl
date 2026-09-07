"""Generated harness execution with separate baseline validation."""

load("@aspect_rules_js//js:defs.bzl", "js_run_binary", "js_test")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")

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
    report = name + "-results.json"
    status = name + "-exit-code.txt"
    stderr = name + "-stderr.txt"

    # Capture the real failing exit status; only the validation test decides
    # whether those failures match the reviewed baseline.
    test262_harness_bin.test262_harness(
        name = name + "-report",
        srcs = data + [realm_prelude],
        # Build actions resolve external inputs below bazel-bin/external;
        # test runfiles resolve them beside the main repository.
        args = [arg.replace(root, "external/" + root[3:]) for arg in polyfill_args],
        stdout = report,
        stderr = stderr,
        exit_code_out = status,
        env = {"TZ": "UTC"},
    )
    js_test(
        name = name,
        entry_point = "//tools/test262:validate",
        data = [report, status, stderr, baseline, "//tools/test262:validation_sources", "//:node_modules/minimist"],
        args = ["--suite", suite, "--report", "$(rootpath %s)" % report, "--status", "$(rootpath %s)" % status, "--stderr", "$(rootpath %s)" % stderr, "--baseline", "$(rootpath %s)" % baseline],
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
