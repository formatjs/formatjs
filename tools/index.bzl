"Custom macro"

load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
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
    ts_project(
        name = name,
        package_name = package_name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        tsconfig = "//:tsconfig.json",
        visibility = ["//visibility:public"],
        deps = deps,
    )
    if not skip_esm:
        ts_project(
            name = "%s-esm" % name,
            srcs = srcs,
            declaration = True,
            declaration_map = True,
            extends = ["//:tsconfig.json"],
            out_dir = "lib",
            tsconfig = "//:tsconfig.esm.json",
            deps = deps,
        )

    native.filegroup(
        name = "types",
        srcs = [":dist"],
        output_group = "types",
        visibility = ["//visibility:public"],
    )

def generate_src_file(name, args, data, src):
    """Generate a source file.

    Args:
        name: target name
        args: args to generate src file binary
        data: dependent data labels
        src: src file to generate
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
    )

def bundle_karma_tests(name, srcs, tests, data = [], deps = [], rollup_deps = []):
    """Bundle tests and run karma.

    Args:
        name: target name
        srcs: src files
        tests: test files
        data: data
        deps: src + test deps
        rollup_deps: deps to package with rollup but not to compile
    """
    ts_project(
        name = "%s-compile" % name,
        srcs = srcs + tests + data,
        declaration = True,
        declaration_map = True,
        extends = ["//:tsconfig.json"],
        out_dir = name,
        tsconfig = "//:tsconfig.esm.json",
        deps = deps + [
            "@npm//@jest/transform",
            "@npm//ts-jest",
            "@npm//@types/jest",
        ],
    )

    BUNDLE_KARMA_TESTS = ["%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]) for f in tests]

    for f in tests:
        rollup_bundle(
            name = "%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]),
            srcs = ["%s-compile" % name],
            config_file = "//:rollup.config.js",
            entry_point = "%s/%s.js" % (name, f[:f.rindex(".")]),
            format = "umd",
            deps = [
                "@npm//@rollup/plugin-node-resolve",
                "@npm//@rollup/plugin-commonjs",
                "@npm//@rollup/plugin-replace",
                "@npm//@rollup/plugin-json",
            ] + deps + rollup_deps,
        )

    native.filegroup(
        name = name,
        srcs = BUNDLE_KARMA_TESTS,
        visibility = ["//visibility:public"],
    )
