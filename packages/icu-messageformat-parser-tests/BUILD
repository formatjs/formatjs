load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

filegroup(
    name = "test-cases",
    visibility = ["//visibility:public"],
    srcs = glob(['test_cases/*'])
)

copy_to_bin(
    name = "test-cases-copy",
    srcs = [":test-cases"],
    visibility = ["//visibility:public"],
)
