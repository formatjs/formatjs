load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_lint//format:defs.bzl", "multi_formatter_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@buildifier_prebuilt//:rules.bzl", "buildifier")
load("@npm//:prettier/package_json.bzl", prettier = "bin")

prettier.prettier_binary(
    name = "prettier",
    # Allow the binary to be run outside bazel
    env = {"BAZEL_BINDIR": "."},
)

exports_files([
    "tsconfig.golden.json",
    "supported-locales-gen.ts",
])

copy_to_bin(
    name = "check-package-json",
    srcs = ["check-package-json.ts"],
    visibility = ["//visibility:public"],
)

copy_to_bin(
    name = "supported-locales-gen",
    srcs = ["supported-locales-gen.ts"],
    visibility = ["//visibility:public"],
)

ts_project(
    name = "supported-locales-gen-transpiled",
    srcs = ["supported-locales-gen.ts"],
    declaration = True,
    resolve_json_module = True,
    tsconfig = "//:tsconfig.node",
    deps = [
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/json-stable-stringify",
        "//:node_modules/@types/minimist",
        "//:node_modules/@types/node",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/minimist",
        "//:node_modules/tslib",
    ],
)

js_binary(
    name = "generate_supported_locales",
    data = [
        ":supported-locales-gen-transpiled",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/json-stable-stringify",
        "//:node_modules/@types/minimist",
        "//:node_modules/@types/node",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/json-stable-stringify",
        "//:node_modules/minimist",
        "//:node_modules/tslib",
    ],
    entry_point = ":supported-locales-gen-transpiled",
    visibility = ["//visibility:public"],
)

buildifier(
    name = "buildifier",
    exclude_patterns = ["./node_modules/*"],
    lint_mode = "fix",
    lint_warnings = [
        "attr-cfg",
        "attr-license",
        "attr-non-empty",
        "attr-output-default",
        "attr-single-file",
        "constant-glob",
        "ctx-actions",
        "ctx-args",
        "depset-iteration",
        "depset-union",
        "dict-concatenation",
        "duplicated-name",
        "filetype",
        "git-repository",
        "http-archive",
        "integer-division",
        "load",
        "load-on-top",
        "native-build",
        "native-package",
        "out-of-order-load",
        "output-group",
        "package-name",
        "package-on-top",
        "positional-args",
        "redefined-variable",
        "repository-name",
        "same-origin-load",
        "string-iteration",
        "unsorted-dict-items",
        "unused-variable",
    ],
    verbose = True,
)

multi_formatter_binary(
    name = "format",
    javascript = ":prettier",
    # TODO: Add starlark formatter
    # starlark = ":buildifier",
    visibility = ["//visibility:public"],
)
