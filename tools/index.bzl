"Custom macro"

load("@bazelbuild_buildtools//buildifier:def.bzl", "buildifier_test")
load("@build_bazel_rules_nodejs//:index.bzl", "generated_file_test")
load("@build_bazel_rules_nodejs//internal/js_library:js_library.bzl", "js_library")
load("@npm//@bazel/esbuild:index.bzl", _esbuild = "esbuild")
load("@npm//@bazel/typescript:index.bzl", "ts_config", "ts_project")
load("@npm//prettier:index.bzl", "prettier", "prettier_test")
load("@npm//ts-node:index.bzl", "ts_node", "ts_node_test")

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

def ts_compile(name, srcs, deps, package_name = None, skip_esm = True, skip_esm_esnext = True):
    """Compile TS with prefilled args.

    Args:
        name: target name
        srcs: src files
        deps: deps
        package_name: name from package.json
        skip_esm: skip building ESM bundle
        skip_esm_esnext: skip building the ESM ESNext bundle
    """
    deps = deps + ["@npm//tslib"]
    ts_config(
        name = "%s-tsconfig" % name,
        src = "tsconfig.json",
        deps = ["//:tsconfig.json"],
    )
    ts_project(
        name = "%s-base" % name,
        srcs = srcs,
        declaration = True,
        declaration_map = True,
        tsconfig = ":%s-tsconfig" % name,
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

def ts_script(name, entry_point, args = [], data = [], outs = None, output_dir = False, visibility = None):
    """Execute a TS script

    Args:
        name: name
        entry_point: script entry file
        args: arguments
        data: runtime data
        outs: output
        output_dir: whether output is a dir
        visibility: visibility
    """
    all_args = [
        "$(execpath %s)" % entry_point,
        "--project",
        "$(location //:tsconfig.node.json)",
    ]
    if output_dir:
        all_args += ["--outDir", "$(@D)"]
    else:
        all_args += ["--out", "$@"]
    all_args += args
    ts_node(
        name = name,
        outs = outs,
        args = all_args,
        data = data + [
            entry_point,
            "//:tsconfig.json",
            "@npm//@types/fs-extra",
            "@npm//@types/minimist",
            "@npm//fs-extra",
            "@npm//minimist",
            "@npm//tslib",
            "//:tsconfig.node.json",
        ],
        output_dir = output_dir,
        visibility = visibility,
    )

def generate_src_file(name, entry_point, src, args = [], data = [], visibility = None):
    """Generate a source file.

    Args:
        name: target name
        args: args to generate src file binary
        data: dependent data labels
        src: src file to generate
        entry_point: generation script entry point
        visibility: target visibility
    """
    tmp_filename = "%s-gen.tmp" % name
    ts_script(
        name = tmp_filename[:tmp_filename.rindex(".")],
        outs = [tmp_filename],
        entry_point = entry_point,
        args = args,
        data = data,
        visibility = visibility,
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
        resolve_json_module = True,
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
            target = "es5",
            define = {
                "process.version": "0",
            },
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

def check_format(name, srcs, config = "//:.prettierrc.json"):
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

    prettier_test(
        name = "%s_prettier_test" % name,
        data = [
            "%s_prettier_srcs" % name,
            config,
        ],
        templated_args = [
            "--config",
            "$(rootpath %s)" % config,
            "--loglevel",
            "warn",
            "--check",
            "$(rootpaths :%s_prettier_srcs)" % name,
        ],
    )

    prettier(
        name = name,
        data = [
            "%s_prettier_srcs" % name,
            config,
        ],
        templated_args = [
            "--config",
            "$(rootpath %s)" % config,
            "--loglevel",
            "warn",
            "--write",
            "$(rootpaths :%s_prettier_srcs)" % name,
        ],
        visibility = [
            "//:__pkg__",
        ],
    )

def esbuild(name, **kwargs):
    _esbuild(
        name = name,
        **kwargs
    )

def package_json_test(name, packageJson = "package.json", deps = []):
    external_deps = [s.replace("@npm//", "") for s in deps if s.startswith("@npm//")]
    internal_dep_package_jsons = ["%s:package.json" % s.split(":")[0] for s in deps if not s.startswith("@npm//")]
    ts_node_test(
        name = name,
        args = [
                   "--transpile-only",
                   "$(execpath //tools:check-package-json.ts)",
                   "--rootPackageJson",
                   "$(location //:package.json)",
                   "--packageJson",
                   "$(location %s)" % packageJson,
               ] +
               ["--externalDep %s" % n for n in external_deps] +
               ["--internalDepPackageJson $(location %s)" % d for d in internal_dep_package_jsons],
        data = internal_dep_package_jsons + [
            packageJson,
            "//tools:check-package-json.ts",
            "//:package.json",
            "//:tsconfig.json",
            "@npm//@types/fs-extra",
            "@npm//@types/minimist",
            "@npm//fs-extra",
            "@npm//json-stable-stringify",
            "@npm//@types/json-stable-stringify",
            "@npm//minimist",
            "@npm//lodash",
            "@npm//@types/lodash",
            "@npm//unidiff",
            "@npm//tslib",
            "//:tsconfig.node.json",
        ],
    )
