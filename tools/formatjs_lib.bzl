"Gazelle-compatible library macro wrapping the dual typecheck+transpile pattern."

load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")
load("//tools:tsconfig.bzl", "BASE_TSCONFIG")
load("//tools:vitest.bzl", "TEST_TSCONFIG", "VITEST_DEPS", "VITEST_DOM_DEPS", "vitest_runner")

def formatjs_ts_project(
        name,
        srcs = [],
        deps = [],
        visibility = None,
        testonly = False,
        tsconfig = None,
        data = [],
        # vitest-specific args (only used when testonly=True)
        dom = False,
        fixtures = [],
        snapshots = [],
        size = "small",
        flaky = False,
        tags = [],
        no_copy_to_bin = [],
        test_timeout = None,
        config = None,
        # Ignored args that gazelle may pass
        **kwargs):
    """Gazelle-compatible macro that wraps the formatjs build pattern.

    When testonly=False (library): creates typecheck ts_project + transpile
    ts_project + js_library bundle.

    When testonly=True (test): creates typecheck ts_project + vitest_runner.

    Gazelle manages deps on this macro via map_kind directive.

    Args:
        name: target name (gazelle uses {dirname}_lib or {dirname}_tests)
        srcs: source files
        deps: dependencies (managed by gazelle)
        visibility: target visibility
        testonly: if True, creates test targets instead of library targets
        tsconfig: tsconfig for library targets (default: BASE_TSCONFIG for lib, ESNEXT_TSCONFIG for node)
        data: additional data deps
        dom: (test only) run in DOM environment
        fixtures: (test only) fixture files
        snapshots: (test only) snapshot files
        size: (test only) test size
        flaky: (test only) flaky test
        tags: tags
        no_copy_to_bin: (test only) files not to copy to bin
        test_timeout: (test only) timeout in ms
        config: (test only) custom vitest config
        **kwargs: additional args (ignored, allows gazelle to pass extra attrs)
    """
    if testonly:
        _formatjs_test(
            name = name,
            srcs = srcs,
            deps = deps,
            dom = dom,
            fixtures = fixtures,
            snapshots = snapshots,
            size = size,
            flaky = flaky,
            tags = tags,
            no_copy_to_bin = no_copy_to_bin,
            test_timeout = test_timeout,
            config = config,
            data = data,
        )
    else:
        _formatjs_library(
            name = name,
            srcs = srcs,
            deps = deps,
            visibility = visibility,
            tsconfig = tsconfig,
        )

def _formatjs_library(name, srcs, deps = [], visibility = None, tsconfig = None):
    """Library: typecheck + transpile + js_library."""

    # Ignore file-based tsconfig from gazelle (e.g. ":tsconfig") — we use
    # Starlark dict tsconfigs for sandbox compatibility.
    effective_tsconfig = tsconfig if type(tsconfig) == "dict" else BASE_TSCONFIG

    ts_project(
        # Type-check only (tsgo, no emit)
        name = "%s-typecheck" % name,
        srcs = srcs,
        declaration = True,
        no_emit = True,
        resolve_json_module = True,
        transpiler = tsgo_bin.tsgo,
        tsconfig = effective_tsconfig,
        validate = False,
        tags = ["no-typecheck-test"],
        deps = deps,
    )

    ts_project(
        # Transpile to JS + .d.ts (oxc-transform)
        name = "%s-transpile" % name,
        srcs = srcs,
        declaration = True,
        declaration_transpiler = oxc_transpiler,
        resolve_json_module = True,
        transpiler = oxc_transpiler,
        tsconfig = effective_tsconfig,
        validate = False,
        tags = ["no-typecheck-test"],
        deps = deps + ["//:node_modules/oxc-transform"],
    )

    js_library(
        name = name,
        srcs = [
            "package.json",
            ":%s-transpile" % name,
        ],
        visibility = visibility,
    )

def _formatjs_test(
        name,
        srcs = [],
        deps = [],
        dom = False,
        fixtures = [],
        snapshots = [],
        size = "small",
        flaky = False,
        tags = [],
        no_copy_to_bin = [],
        test_timeout = None,
        config = None,
        data = []):
    """Test: typecheck + vitest_runner."""

    all_test_deps = deps + VITEST_DEPS + (VITEST_DOM_DEPS if dom else [])
    all_test_deps = list(set(all_test_deps))

    # Filter out snapshot files from srcs for type-checking
    srcs_no_snapshots = [src for src in srcs if "/__snapshots__/" not in src]

    ts_project(
        # Type-check only (tsgo, no emit)
        name = "%s_typecheck" % name,
        srcs = srcs_no_snapshots,
        declaration = True,
        no_emit = True,
        resolve_json_module = True,
        testonly = True,
        transpiler = tsgo_bin.tsgo,
        tsconfig = TEST_TSCONFIG,
        validate = False,
        tags = ["no-typecheck-test"],
        deps = all_test_deps,
    )

    vitest_runner(
        name = name,
        srcs = srcs,
        deps = deps,
        dom = dom,
        fixtures = fixtures,
        snapshots = snapshots,
        size = size,
        flaky = flaky,
        tags = tags,
        no_copy_to_bin = no_copy_to_bin,
        test_timeout = test_timeout,
        config = config,
        data = data,
    )
