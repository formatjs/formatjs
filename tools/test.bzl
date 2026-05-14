"Macro for formatjs test targets."

load("@aspect_rules_js//js:defs.bzl", "js_test")
load("//tools:vitest.bzl", "vitest")

def _split_data(data):
    """Partition legacy gazelle_ts `ts_test.data` into vitest srcs / deps / data.

    Older gazelle_ts versions emitted a single `data` list mixing test source
    file paths, npm package labels (//:node_modules/...), internal package
    labels (//packages/...), a sibling library reference (e.g. ":dist"), and
    runtime-only file labels like //:package.json (added when test imports use
    `#packages/*`).

    vitest needs them split:
      - srcs:  TS test files + JSON fixtures (paths, no leading // or :)
      - deps:  Bazel labels for js_library / npm packages — fed to ts_project
      - data:  runtime file labels that ts_project rejects (e.g.
               //:package.json) but vitest still needs in its sandbox
    """
    srcs = []
    deps = []
    runtime_data = []
    for item in data:
        if item.startswith("//:package.json") or item == "//:package.json":
            runtime_data.append(item)
            continue
        if item.startswith("//") or item.startswith(":") or item.startswith("@"):
            deps.append(item)
        else:
            srcs.append(item)
    return srcs, deps, runtime_data

def formatjs_test(
        name,
        srcs = [],
        deps = [],
        data = [],
        entry_point = None,
        tsconfig_types = [],
        **kwargs):
    """Vitest wrapper that consumes gazelle_ts ts_test output.

    Newer gazelle_ts emits separate `srcs`, `deps`, and runtime `data` attrs.
    Older versions emitted one mixed `data` list, so this wrapper still
    partitions legacy data by label prefix when structured attrs are absent.

    Files under tests/fixtures/ in srcs are automatically separated and
    passed as the fixtures kwarg to vitest.

    Args:
        name: target name (e.g. "unit_test")
        srcs: gazelle-managed test sources
        deps: gazelle-managed Bazel labels for test compilation/runtime
        data: runtime files, or a legacy mixed list when srcs/deps are absent
        entry_point: ignored (vitest auto-discovers tests). Accepted only so
            hand-written rules with an entry_point forward cleanly; the
            ts_test abstract kind never emits one.
        **kwargs: passed through to vitest (dom, config, size, tsconfig, etc.)
    """
    if srcs or deps:
        runtime_data = data
    else:
        srcs, deps, runtime_data = _split_data(data)

    # Stock js_test passthrough: a hand-rolled rule whose entry_point is a
    # plain .mjs/.js (not a vitest test file) and whose data is just labels.
    # The original was `js_test(...)`; gazelle's map_kind rewrote it to
    # formatjs_test. We forward back to js_test so the runner stays right.
    if entry_point and not srcs:
        js_test(
            name = name,
            data = data,
            entry_point = entry_point,
            **kwargs
        )
        return

    # gazelle_ts emits the sibling-library label (basename) so the bundled
    # output is in the test sandbox. For published packages that bundled
    # js_library carries the package's own package.json, which shadows the
    # root //:package.json and breaks `#packages/*` subpath resolution at
    # runtime. Strip it and substitute the source-only `:lib` instead.
    base = native.package_name().split("/")[-1]
    sibling_lib = ":" + base
    deps = [d for d in deps if d != sibling_lib]
    if native.existing_rule("lib"):
        deps.append(":lib")

    if "fixtures" not in kwargs:
        fixtures = [s for s in srcs if "/fixtures/" in s]
        if fixtures:
            srcs = [s for s in srcs if "/fixtures/" not in s]
            kwargs["fixtures"] = fixtures

    # Pull in the sibling library's :srcs (copy_to_bin from formatjs_library)
    # only when one exists in this BUILD — test-only directories like
    # */integration-tests/ don't have a formatjs_library and therefore no
    # :srcs target.
    lib_srcs = [":srcs"] if native.existing_rule("srcs") else []

    if runtime_data:
        kwargs["data"] = kwargs.get("data", []) + runtime_data

    vitest(
        name = name,
        srcs = lib_srcs + srcs,
        deps = deps,
        tsconfig_types = tsconfig_types,
        **kwargs
    )
