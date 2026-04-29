"Macro for formatjs test targets."

load("@aspect_rules_js//js:defs.bzl", "js_test")
load("//tools:vitest.bzl", "vitest")

def _split_data(data):
    """Partition gazelle_ts's ts_test `data` attr into vitest's srcs / deps / data.

    The plugin emits a single `data` list mixing test source file paths,
    npm package labels (//:node_modules/...), internal package labels
    (//packages/...), a sibling library reference (e.g. ":dist"), and
    runtime-only file labels like //:package.json (added when test imports
    use `#packages/*`).

    vitest needs them split:
      - srcs:  TS test files + JSON fixtures (paths, no leading // or :)
      - deps:  Bazel labels for js_library / npm packages — fed to ts_project
      - data:  runtime file labels that ts_project rejects (e.g.
               //:package.json) but vitest still needs in its sandbox
    """
    srcs = []
    deps = []
    extra_data = []
    for item in data:
        if item.startswith("//:package.json") or item == "//:package.json":
            extra_data.append(item)
            continue
        if item.startswith("//") or item.startswith(":") or item.startswith("@"):
            deps.append(item)
        else:
            srcs.append(item)
    return srcs, deps, extra_data

def formatjs_test(
        name,
        data = [],
        extra_data = [],
        extra_srcs = [],
        entry_point = None,
        **kwargs):
    """Vitest wrapper that consumes gazelle_ts ts_test output.

    The plugin emits abstract `ts_test` attrs: a `data` list mixing test
    source files, npm dep labels, internal cross-package labels, and (when
    a sibling library exists) its label. vitest needs srcs and deps split,
    so this wrapper partitions `data` by label prefix.

    Files under tests/fixtures/ in srcs are automatically separated and
    passed as the fixtures kwarg to vitest.

    Args:
        name: target name (e.g. "unit_test")
        data: gazelle-managed mixed list (test sources + dep labels)
        extra_data: hand-maintained items that gazelle should not touch.
            Use for list comprehensions (e.g. generated locale-data labels)
            that gazelle's flat-list merger can't process. Items are
            partitioned the same way `data` is.
        extra_srcs: hand-maintained label list whose output files must be
            visible to the typecheck ts_project as srcs (not just to vitest
            via data). Use for genrule outputs like JSON locale fixtures
            imported via `import x from '#packages/.../foo.json'`.
        entry_point: ignored (vitest auto-discovers tests). Accepted only so
            hand-written rules with an entry_point forward cleanly; the
            ts_test abstract kind never emits one.
        **kwargs: passed through to vitest (dom, config, size, tsconfig, etc.)
    """
    srcs, deps, runtime_data = _split_data(data + extra_data)

    # Stock js_test passthrough: a hand-rolled rule whose entry_point is a
    # plain .mjs/.js (not a vitest test file) and whose data is just labels.
    # The original was `js_test(...)`; gazelle's map_kind rewrote it to
    # formatjs_test. We forward back to js_test so the runner stays right.
    if entry_point and not srcs and not extra_srcs:
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
        srcs = lib_srcs + srcs + extra_srcs,
        deps = deps,
        **kwargs
    )
