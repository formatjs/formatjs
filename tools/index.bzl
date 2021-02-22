"Custom macro"

load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test")
load("@build_bazel_rules_nodejs//internal/js_library:js_library.bzl", "js_library")
load("@npm//@bazel/esbuild:index.bzl", _esbuild = "esbuild")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//prettier:index.bzl", "prettier", "prettier_test")
load("@npm//ts-node:index.bzl", "ts_node")

def ts_compile(name, srcs, deps, package_name = None, skip_esm = True):
    """Compile TS with prefilled args.

    Args:
        name: target name
        srcs: src files
        deps: deps
        package_name: name from package.json
        skip_esm: skip building ESM bundle
    """
    deps = deps + ["@npm//tslib"]

    ts_project(
        name = "%s-base" % name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        tsconfig = "tsconfig.json",
        extends = "//:tsconfig.json",
        deps = deps,
    )
    if not skip_esm:
        ts_project(
            name = "%s-esm" % name,
            srcs = srcs,
            declaration = True,
            declaration_map = True,
            extends = "//:tsconfig.json",
            out_dir = "lib",
            tsconfig = "//:tsconfig.esm.json",
            deps = deps,
        )

    native.filegroup(
        name = "types",
        srcs = [":%s-base" % name],
        output_group = "types",
        visibility = ["//visibility:public"],
    )

    js_library(
        name = name,
        package_name = package_name,
        srcs = ["package.json"],
        deps = [":%s-base" % name] + ([":%s-esm" % name] if not skip_esm else []),
        visibility = ["//visibility:public"],
    )

def generate_src_file(name, args, data, src, visibility = None):
    """Generate a source file.

    Args:
        name: target name
        args: args to generate src file binary
        data: dependent data labels
        src: src file to generate
        visibility: target visibility
    """
    tmp_filename = "%s-gen.tmp" % name
    ts_node(
        name = tmp_filename[:tmp_filename.rindex(".")],
        outs = [tmp_filename],
        args = args,
        data = data,
    )

    generated_file_test(
        name = name,
        src = src,
        generated = tmp_filename,
        visibility = visibility,
    )

def bundle_karma_tests(name, srcs, tests, data = [], deps = [], esbuild_deps = []):
    """Bundle tests and run karma.

    Args:
        name: target name
        srcs: src files
        tests: test files
        data: data
        deps: src + test deps
        esbuild_deps: deps to package with rollup but not to compile
    """
    ts_project(
        name = "%s-compile" % name,
        srcs = srcs + tests + data,
        declaration = True,
        declaration_map = True,
        extends = "//:tsconfig.json",
        out_dir = name,
        tsconfig = "//:tsconfig.esm.json",
        deps = deps + [
            "@npm//@jest/transform",
            "@npm//ts-jest",
            "@npm//@types/jest",
            "@npm//tslib",
        ],
    )

    BUNDLE_KARMA_TESTS = ["%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]) for f in tests]

    for f in tests:
        esbuild(
            name = "%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]),
            entry_point = "%s/%s.js" % (name, f[:f.rindex(".")]),
            format = "iife",
            deps = [
                ":%s-compile" % name,
                "@npm//tslib",
            ] + deps + esbuild_deps,
        )

    native.filegroup(
        name = name,
        srcs = BUNDLE_KARMA_TESTS,
        testonly = True,
        visibility = ["//:__pkg__"],
    )

def prettier_check(name, srcs, config = "//:.prettierrc.json"):
    native.filegroup(
        name = "%s_srcs" % name,
        srcs = srcs,
    )

    prettier_test(
        name = "%s_test" % name,
        data = [
            "%s_srcs" % name,
            config,
        ],
        templated_args = [
            "--config",
            "$(rootpath %s)" % config,
            "--loglevel",
            "warn",
            "--check",
            "$(rootpaths :%s_srcs)" % name,
        ],
    )

    prettier(
        name = name,
        data = [
            "%s_srcs" % name,
            config,
        ],
        templated_args = [
            "--config",
            "$(rootpath %s)" % config,
            "--loglevel",
            "warn",
            "--write",
            "$(rootpaths :%s_srcs)" % name,
        ],
        visibility = [
            "//:__pkg__",
        ],
    )

def esbuild(name, **kwargs):
    _esbuild(
        name = name,
        tool = select({
            "@bazel_tools//src/conditions:darwin": "@esbuild_darwin//:bin/esbuild",
            "@bazel_tools//src/conditions:linux_x86_64": "@esbuild_linux//:bin/esbuild",
            "@bazel_tools//src/conditions:windows": "@esbuild_windows//:esbuild.exe",
        }),
        **kwargs
    )
