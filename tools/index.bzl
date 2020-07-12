"Custom macro"

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "generated_file_test")
load("@npm//@bazel/rollup:index.bzl", "rollup_bundle")
load("@npm//@bazel/typescript:index.bzl", "ts_project")
load("@npm//@microsoft/api-extractor:index.bzl", "api_extractor")
load("@npm//karma:index.bzl", "karma_test")
load("@npm//ts-node:index.bzl", "ts_node")

def ts_compile(name, srcs, deps, package_name = None):
    """Compile TS with prefilled args.

    Args:
        name: target name
        srcs: src files
        deps: deps
        package_name: name from package.json
    """
    ts_project(
        name = name,
        package_name = package_name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        source_map = True,
        tsconfig = "//:tsconfig.json",
        visibility = ["//visibility:public"],
        deps = deps,
    )

    ts_project(
        name = "%s-esm" % name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        extends = ["//:tsconfig.json"],
        outdir = "lib",
        source_map = True,
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

def rollup_dts(name, package_name, package_json, types):
    """Macro for @microsoft/api-extractor.

    Args:
        name: target name
        package_name: package name from package.json
        package_json: package.json file
        types: filegroup that contains generated d.ts
    """
    native.genrule(
        name = "copy-tsconfig-%s" % package_name,
        srcs = ["//:tsconfig.json"],
        outs = ["tsconfig.json"],
        cmd = "cp $< $@",
    )

    native.genrule(
        name = "copy-api-extractor-%s" % package_name,
        srcs = ["//:api-extractor.json"],
        outs = ["api-extractor.json"],
        cmd = "cp $< $@",
    )

    copy_to_bin(
        name = "copy-package-json-%s" % package_name,
        srcs = [package_json],
    )

    api_extractor(
        name = name,
        outs = ["%s.d.ts" % package_name],
        args = [
            "run",
            "--local",
            "-c",
            "$(@D)/api-extractor.json",
        ],
        data = [
            "api-extractor.json",
            "tsconfig.json",
            ":copy-package-json-%s" % package_name,
            "//:setup-api-extractor",
        ] + types,
    )

def karma_bundle_test(name, srcs, tests, data = [], deps = []):
    """Bundle tests and run karma.

    Args:
        name: target name
        srcs: src files
        tests: test files
        data: data
        deps: src + test deps
    """
    ts_project(
        name = "%s-compile" % name,
        srcs = srcs + tests + data,
        declaration = True,
        declaration_map = True,
        extends = ["//:tsconfig.json"],
        outdir = name,
        source_map = True,
        tsconfig = "//:tsconfig.esm.json",
        visibility = ["//visibility:public"],
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
            ] + deps,
        )

    karma_test(
        name = name,
        data = [
            "//:karma.conf.js",
            "@npm//karma-jasmine",
            "@npm//karma-chrome-launcher",
            "@npm//karma-jasmine-matchers",
        ] + BUNDLE_KARMA_TESTS,
        templated_args = [
            "start",
            "$(rootpath //:karma.conf.js)",
        ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
    )

    karma_test(
        name = "%s-ci" % name,
        configuration_env_vars = [
            "SAUCE_USERNAME",
            "SAUCE_ACCESS_KEY",
        ],
        data = [
            "//:karma.conf-ci.js",
            "@npm//karma-jasmine",
            "@npm//karma-sauce-launcher",
            "@npm//karma-jasmine-matchers",
        ] + BUNDLE_KARMA_TESTS,
        templated_args = [
            "start",
            "$(rootpath //:karma.conf-ci.js)",
        ] + ["$$(rlocation $(location %s))" % f for f in BUNDLE_KARMA_TESTS],
    )
