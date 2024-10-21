"Custom macro"

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_js//js:defs.bzl", "js_binary", "js_library", "js_run_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")

def ts_compile_node(name, srcs, deps = [], data = [], skip_esm_esnext = True, visibility = None):
    """Compile TS with prefilled args, specifically for Node tooling.

    Args:
        name: target name
        srcs: src files
        deps: deps
        data: add data deps like internal transitive deps
        skip_esm_esnext: whether to skip building esnext
        visibility: visibility
    """
    deps = deps + ["//:node_modules/tslib"]
    ts_project(
        name = "%s-base" % name,
        srcs = srcs,
        declaration = True,
        tsconfig = "//:tsconfig.node",
        resolve_json_module = True,
        deps = deps,
    )
    if not skip_esm_esnext:
        ts_project(
            name = "%s-esm-esnext" % name,
            srcs = srcs,
            declaration = True,
            out_dir = "lib_esnext",
            tsconfig = "//:tsconfig.esm.esnext",
            resolve_json_module = True,
            deps = deps,
        )

    js_library(
        name = name,
        srcs = [":%s-base" % name, "package.json"],
        data = data,
        visibility = visibility,
    )

def ts_compile(name, srcs, deps = [], skip_cjs = False, skip_esm = True, skip_esm_esnext = True, visibility = None):
    """Compile TS with prefilled args.

    Args:
        name: target name
        srcs: src files
        deps: deps
        skip_cjs: skip building CJS bundle
        skip_esm: skip building ESM bundle
        skip_esm_esnext: skip building the ESM ESNext bundle
        visibility: visibility
    """
    deps = deps + ["//:node_modules/tslib"]
    if not skip_cjs:
        ts_project(
            name = "%s-base" % name,
            srcs = srcs,
            declaration = True,
            tsconfig = "//:tsconfig",
            resolve_json_module = True,
            deps = deps,
        )
    if not skip_esm:
        ts_project(
            name = "%s-esm" % name,
            srcs = srcs,
            declaration = True,
            out_dir = "lib",
            tsconfig = "//:tsconfig.esm",
            resolve_json_module = True,
            deps = deps,
        )
    if not skip_esm_esnext:
        ts_project(
            name = "%s-esm-esnext" % name,
            srcs = srcs,
            declaration = True,
            out_dir = "lib_esnext",
            tsconfig = "//:tsconfig.esm.esnext",
            resolve_json_module = True,
            deps = deps,
        )

    js_library(
        name = name,
        srcs = ([":%s-base" % name] if not skip_cjs else []) + ([":%s-esm" % name] if not skip_esm else []) + ["package.json"],
        visibility = visibility,
    )

def ts_script(name, entry_point, args = [], chdir = None, srcs = [], outs = [], out_dirs = [], **kwargs):
    js_binary(
        name = "%s_tool" % name,
        chdir = chdir,
        entry_point = entry_point,
        data = [
            "//:node_modules/@swc-node/register",
            "//:node_modules/@swc/helpers",
        ],
        node_options = [
            "-r",
            "@swc-node/register",
        ],
    )
    js_run_binary(
        name = name,
        tool = ":%s_tool" % name,
        chdir = chdir,
        srcs = srcs,
        outs = outs,
        out_dirs = out_dirs,
        args = args,
        **kwargs
    )

def generate_src_file(name, entry_point, src, chdir = None, args = [], data = [], visibility = []):
    """Generate a source file.

    Args:
        name: target name
        args: args to generate src file binary
        data: dependent data labels
        src: src file to generate
        entry_point: generation script entry point
        visibility: target visibility
        chdir: whether to chdir to another dir
    """
    tmp_filename = "%s-gen.tmp" % name
    ts_script(
        name = tmp_filename[:tmp_filename.rindex(".")],
        outs = [tmp_filename],
        entry_point = entry_point,
        # NOTE: assumes that all scripts called here accept `--out` and
        # also uses fs-extra + minimist.
        args = args + [
            "--out",
            "$(rootpath %s)" % tmp_filename,
        ],
        chdir = chdir,
        srcs = data + [
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
        ],
    )

    files = {}
    files[src] = tmp_filename

    write_source_files(
        name = name,
        files = files,
        visibility = visibility + [
            "//:__pkg__",
        ],
        suggested_update_target = "//%s:%s" % (native.package_name(), tmp_filename[:tmp_filename.rindex(".")]),
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
    # ts_project(
    #     name = "%s-compile" % name,
    #     srcs = srcs + tests + data,
    #     declaration = True,
    #     out_dir = name,
    #     resolve_json_module = True,
    #     tsconfig = "//:tsconfig.esm",
    #     deps = deps + [
    #         "//:node_modules/@jest/transform",
    #         "//:node_modules/ts-jest",
    #         "//:node_modules/@types/jest",
    #         "//:node_modules/tslib",
    #     ],
    #     data = data,
    # )

    # BUNDLE_KARMA_TESTS = ["%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]) for f in tests]

    # for f in tests:
    #     esbuild(
    #         name = "%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]),
    #         entry_point = "%s/%s.js" % (name, f[:f.rindex(".")]),
    #         format = "iife",
    #         target = "es6",
    #         # TODO: fix this and set it back to es5
    #         define = {
    #             "process.version": "0",
    #         },
    #         deps = [
    #             ":%s-compile" % name,
    #             "//:node_modules/tslib",
    #         ] + deps + esbuild_deps,
    #     )

    # native.filegroup(
    #     name = name,
    #     srcs = BUNDLE_KARMA_TESTS,
    #     testonly = True,
    #     visibility = ["//:__pkg__"],
    # )
    pass

def is_internal_dep(s):
    return s.startswith("//:node_modules/@formatjs") or s in [
        "//:node_modules/babel-plugin-formatjs",
        "//:node_modules/eslint-plugin-formatjs",
        "//:node_modules/intl-messageformat",
        "//:node_modules/react-intl",
        "//:node_modules/vue-intl",
    ]

def package_json_test(name, packageJson = "package.json", deps = []):
    copy_to_bin(
        name = "package",
        srcs = ["package.json"],
        visibility = ["//visibility:public"],
    )

    internal_deps = [
        s
        for s in deps
        if is_internal_dep(s)
    ]

    external_deps = [s for s in deps if s not in internal_deps]

    # TODO: fix this
    # ts_node_bin.ts_node_test(
    #     name = name,
    #     args = [
    #                "--transpile-only",
    #                "$(location //tools:check-package-json)",
    #                "--rootPackageJson",
    #                "$(location //:package)",
    #                "--packageJson",
    #                "$(location %s)" % packageJson,
    #            ] +
    #            (["--externalDep %s" % n for n in external_deps] if external_deps else []) +
    #            (["--internalDep %s" % d.split("//:node_modules/")[1] for d in internal_deps] if internal_deps else []),
    #     data = internal_deps + [
    #         packageJson,
    #         "//tools:check-package-json",
    #         "//:package",
    #         "//:tsconfig",
    #         "//:node_modules/@types/fs-extra",
    #         "//:node_modules/@types/minimist",
    #         "//:node_modules/fs-extra",
    #         "//:node_modules/json-stable-stringify",
    #         "//:node_modules/@types/json-stable-stringify",
    #         "//:node_modules/minimist",
    #         "//:node_modules/lodash",
    #         "//:node_modules/@types/lodash",
    #         "//:node_modules/unidiff",
    #         "//:node_modules/tslib",
    #         "//:tsconfig.node",
    #     ],
    # )
