load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

exports_files([
    "tsconfig.golden.json",
    "supported-locales-gen.ts",
])

copy_to_bin(
    name = "check-package-json",
    srcs = ["check-package-json.ts"],
    visibility = ["//visibility:public"],
)
