"""Generated harness execution with separate baseline validation."""

load("@aspect_rules_js//js:defs.bzl", "js_run_binary")
load("@npm//:test262-harness/package_json.bzl", test262_harness_bin = "bin")
load("@rules_shell//shell:sh_test.bzl", "sh_test")

def test262_test(name, suite, prelude, data, baseline = "test262-baseline.json", threads = 1, timeout = "long"):
    """Keep direct strict/native tests and validate captured baseline reports."""
    if threads < 1:
        fail("Test262 threads must be positive")

    # Match the generated harness worker count with local and RBE reservations.
    # https://github.com/tc39/test262-harness#command-line-options
    resource_tags = ["cpu:%d" % threads]
    execution_resources = {"EstimatedCPU": str(threads), "EstimatedMemory": "2GB"} if threads > 1 else {}
    preludes = prelude if type(prelude) == "list" else [prelude]
    root = "../+http_archive+com_github_tc39_test262"
    realm_prelude = name + "-realm-prelude.js"
    js_run_binary(
        name = name + "-realm-prelude",
        tool = "//tools/test262:prelude",
        srcs = preludes,
        outs = [realm_prelude],
        args = [arg for source in preludes for arg in ["--input", "$(rootpath %s)" % source]] + ["--out", "$(rootpath %s)" % realm_prelude],
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
        "30000",
        "--test262Dir",
        root,
        root + "/test/" + suite + "/**/*.js",
    ]
    polyfill_args = args + ["--prelude", "$(rootpath %s)" % realm_prelude]
    test262_harness_bin.test262_harness_binary(
        node_toolchain = "//tools/test262:node-runtime",
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
        exec_properties = execution_resources,
        tags = resource_tags,
        size = "large",
        timeout = timeout,
    )
    for mode in ["strict", "native"]:
        test262_harness_bin.test262_harness_test(
            node_toolchain = "//tools/test262:node-runtime",
            name = name + "-" + mode,
            args = polyfill_args if mode == "strict" else args,
            data = data + ([realm_prelude] if mode == "strict" else []),
            env = {"TZ": "UTC"},
            exec_properties = execution_resources,
            size = "large",
            timeout = timeout,
            tags = ["manual"] + resource_tags,
        )
