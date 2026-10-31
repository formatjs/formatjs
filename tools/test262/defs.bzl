"""Generated harness execution with separate baseline validation."""

load("@aspect_rules_js//js:defs.bzl", "js_run_binary")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

def test262_test(name, suite, prelude, data, baseline = "test262-baseline.json", threads = 1, timeout = "long", case_timeout_ms = 30000, tags = [], estimated_memory = "2GB"):
    """Keep direct strict/native tests and validate captured baseline reports."""
    if threads < 1:
        fail("Test262 threads must be positive")

    # Match the generated harness worker count with local and RBE reservations.
    # https://github.com/tc39/test262-harness#command-line-options
    resource_tags = ["cpu:%d" % threads]
    execution_resources = {"EstimatedCPU": str(threads), "EstimatedMemory": estimated_memory} if threads > 1 else {}
    if case_timeout_ms < 1:
        fail("Test262 case timeout must be positive")
    preludes = prelude if type(prelude) == "list" else [prelude]
    root = "../+http_archive+com_github_tc39_test262"
    realm_prelude = name + "-realm-prelude.js"
    prelude_source = name + "-prelude-source.js"
    prelude_files = [realm_prelude, prelude_source]
    js_run_binary(
        name = name + "-realm-prelude",
        tool = "//tools/test262:prelude",
        srcs = preludes,
        outs = prelude_files,
        tags = tags,
        args = [arg for source in preludes for arg in ["--input", "$(rootpath %s)" % source]] + ["--out", "$(rootpath %s)" % realm_prelude, "--sourceOut", "$(rootpath %s)" % prelude_source],
    )
    args = [
        "--threads",
        str(threads),
        "--reporter",
        "json",
        "--reporter-keys",
        "file,scenario,result,rawResult",
        "--errorForFailures",
        "--timeout",
        str(case_timeout_ms),
        "--test262Dir",
        root,
        root + "/test/" + suite + "/**/*.js",
    ]
    polyfill_args = args + ["--prelude", "$(rootpath %s)" % realm_prelude]
    test262_harness_bin.test262_harness_binary(
        node_toolchain = "//tools/test262:node-runtime",
        name = name + "-harness",
        data = data + prelude_files,
        tags = ["manual"] + [tag for tag in tags if tag != "manual"],
        testonly = True,
    )

    # Reports belong to test execution, so --nocache_test_results reruns the
    # harness instead of revalidating a cached build output.
    sh_test(
        name = name,
        srcs = ["//tools/test262:run.sh"],
        data = [":" + name + "-harness", baseline, "//tools/test262:validator"] + prelude_files,
        args = ["$(rootpath :%s-harness)" % name, "$(rootpath //tools/test262:validator)", suite, "$(rootpath %s)" % baseline] + polyfill_args,
        env = {"TZ": "UTC"},
        exec_properties = execution_resources,
        tags = tags + resource_tags,
        size = "large",
        timeout = timeout,
    )
    for mode in ["strict", "native"]:
        test262_harness_bin.test262_harness_test(
            node_toolchain = "//tools/test262:node-runtime",
            name = name + "-" + mode,
            args = polyfill_args if mode == "strict" else args,
            data = data + (prelude_files if mode == "strict" else []),
            env = {"TZ": "UTC"},
            exec_properties = execution_resources,
            size = "large",
            timeout = timeout,
            tags = ["manual"] + [tag for tag in tags if tag != "manual"] + resource_tags,
        )
