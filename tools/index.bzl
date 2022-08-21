"Custom macro"

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@bazelbuild_buildtools//buildifier:def.bzl", "buildifier_test")
load("@npm//:prettier/package_json.bzl", prettier_bin = "bin")
load("@npm//:ts-node/package_json.bzl", ts_node_bin = "bin")

BUILDIFIER_WARNINGS = [
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
]

def ts_compile_node(name, srcs, deps = [], data = [], package = None, skip_esm_esnext = True, visibility = None):
    """Compile TS with prefilled args, specifically for Node tooling.

    Args:
        name: target name
        srcs: src files
        deps: deps
        package: name from package.json
        data: add data deps like internal transitive deps
        skip_esm_esnext: whether to skip building esnext
        visibility: visibility
    """
    deps = deps + ["//:node_modules/tslib"]
    internal_deps = [d for d in deps if is_internal_dep(d)]
    ts_project(
        name = "%s-base" % name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        tsconfig = "//:tsconfig.node",
        resolve_json_module = True,
        deps = deps,
    )
    if not skip_esm_esnext:
        ts_project(
            name = "%s-esm-esnext" % name,
            srcs = srcs,
            declaration = True,
            declaration_map = True,
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

def ts_compile(name, srcs, deps = [], data = [], package = None, skip_esm = True, skip_esm_esnext = True, visibility = None):
    """Compile TS with prefilled args.

    Args:
        name: target name
        srcs: src files
        deps: deps
        package: name from package.json
        skip_esm: skip building ESM bundle
        skip_esm_esnext: skip building the ESM ESNext bundle
        data: add data deps like internal transitive deps
        visibility: visibility
    """
    deps = deps + ["//:node_modules/tslib"]
    internal_deps = [d for d in deps if is_internal_dep(d)]
    ts_project(
        name = "%s-base" % name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        tsconfig = "//:tsconfig",
        resolve_json_module = True,
        deps = deps,
    )
    if not skip_esm:
        ts_project(
            name = "%s-esm" % name,
            srcs = srcs,
            declaration = True,
            declaration_map = True,
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
            declaration_map = True,
            out_dir = "lib_esnext",
            tsconfig = "//:tsconfig.esm.esnext",
            resolve_json_module = True,
            deps = deps,
        )

    js_library(
        name = name,
        srcs = [":%s-base" % name] + ([":%s-esm" % name] if not skip_esm else []) + ["package.json"],
        visibility = visibility,
    )

def ts_script(name, entry_point, args = [], chdir = None, data = [], outs = [], output_dir = False, out_dirs = [], visibility = None):
    """Execute a TS script

    Args:
        name: name
        entry_point: script entry file
        args: arguments
        data: runtime data
        outs: output
        output_dir: whether output is a dir
        out_dirs: output directories
        chdir: whether to chdir to a dir
        visibility: visibility
    """
    ts_node_bin.ts_node(
        name = name,
        outs = outs,
        chdir = chdir,
        args = [
            "$(location %s)" % entry_point,
            "--project",
            "$(location //:tsconfig.node)",
        ] + (["--outDir", "$(@D)"] if output_dir or out_dirs else ["--out %s/%s" % (native.package_name(), outFile) for outFile in outs]) + args,
        out_dirs = out_dirs if out_dirs else [],
        srcs = data + [
            entry_point,
            "//:node_modules/@types/fs-extra",
            "//:node_modules/@types/minimist",
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
            "//:node_modules/tslib",
            "//:tsconfig.node",
            "//:tsconfig",
        ],
        visibility = visibility,
    )

def generate_src_file(name, entry_point, src, chdir = None, args = [], data = [], visibility = None):
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
        args = args,
        chdir = chdir,
        data = data,
    )

    files = {}
    files[src] = tmp_filename

    write_source_files(
        name = name,
        files = files,
        visibility = visibility,
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
    ts_project(
        name = "%s-compile" % name,
        srcs = srcs + tests + data,
        declaration = True,
        declaration_map = True,
        extends = "//:tsconfig",
        out_dir = name,
        resolve_json_module = True,
        tsconfig = "//:tsconfig.esm",
        deps = deps + [
            "//:node_modules/@jest/transform",
            "//:node_modules/ts-jest",
            "//:node_modules/@types/jest",
            "//:node_modules/tslib",
        ],
        data = data,
    )

    BUNDLE_KARMA_TESTS = ["%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]) for f in tests]

    for f in tests:
        esbuild(
            name = "%s-%s.bundled" % (name, f[f.rindex("/") + 1:f.rindex(".")]),
            entry_point = "%s/%s.js" % (name, f[:f.rindex(".")]),
            format = "iife",
            target = "es6",
            # TODO: fix this and set it back to es5
            define = {
                "process.version": "0",
            },
            deps = [
                ":%s-compile" % name,
                "//:node_modules/tslib",
            ] + deps + esbuild_deps,
        )

    native.filegroup(
        name = name,
        srcs = BUNDLE_KARMA_TESTS,
        testonly = True,
        visibility = ["//:__pkg__"],
    )

def check_format(name, srcs, config = "//:.prettierrc"):
    """
    Run all file formatting checks like prettier/buildifier.

    Args:
        name: name of target
        srcs: list of srcs files
        config: prettier config
    """
    native.filegroup(
        name = "%s_prettier_srcs" % name,
        srcs = [s for s in srcs if not s.endswith("BUILD") and not s.endswith(".bzl")],
    )

    buildifier_test(
        name = "%s_buildifier_test" % name,
        srcs = [s for s in srcs if s.endswith("BUILD") or s.endswith(".bzl")],
        lint_mode = "warn",
        lint_warnings = BUILDIFIER_WARNINGS,
        verbose = True,
    )

    prettier_bin.prettier_test(
        name = "%s_prettier_test" % name,
        data = [
            "%s_prettier_srcs" % name,
            config,
        ],
        args = [
            "--config",
            "$(location %s)" % config,
            "--loglevel",
            "warn",
            "--check",
            "$(locations :%s_prettier_srcs)" % name,
        ],
    )

    prettier_bin.prettier_binary(
        name = name,
        data = [
            ":%s_prettier_srcs" % name,
            config,
        ],
        args = [
            "--config",
            "$(location %s)" % config,
            "--loglevel",
            "warn",
            "--write",
            "$(locations :%s_prettier_srcs)" % name,
        ],
        chdir = "$$BUILD_WORKSPACE_DIRECTORY",
        visibility = [
            "//:__pkg__",
        ],
    )

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
