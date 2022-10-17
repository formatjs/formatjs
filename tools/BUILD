load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load(":index.bzl", "check_format")

exports_files([
    "tsconfig.golden.json",
    "supported-locales-gen.ts",
    "update_submodules.sh"
])

check_format(
    name = "prettier",
    srcs = glob(
        [
            "*.*",
        ],
        exclude = ["tsconfig.golden.json"],
    ),
)

copy_to_bin(
    name = "jest-reporter",
    srcs = ["jest-reporter.js"],
    visibility = ["//visibility:public"],
)

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
    declaration_map = True,
    resolve_json_module = True,
    tsconfig = "//:tsconfig.node",
    deps = [
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/minimist",
        "//:node_modules/@types/node",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/minimist",
        "//:node_modules/tslib",
    ],
)

js_binary(
    name = "generate_supported_locales",
    data = [
        ":supported-locales-gen-transpiled",
        "//:node_modules/@types/fs-extra",
        "//:node_modules/@types/minimist",
        "//:node_modules/@types/node",
        "//:node_modules/fast-glob",
        "//:node_modules/fs-extra",
        "//:node_modules/minimist",
        "//:node_modules/tslib",
    ],
    entry_point = ":supported-locales-gen-transpiled",
    visibility = ["//visibility:public"],
)


sh_binary(
    name="update_submodules",
    srcs=["//tools:update_submodules.sh"]
)
