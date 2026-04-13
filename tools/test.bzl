"Macro for formatjs test targets."

load("//tools:vitest.bzl", "vitest")

def formatjs_test(
        name,
        srcs = [],
        deps = [],
        **kwargs):
    """Vitest wrapper that auto-depends on :lib from formatjs_library.

    Source deps are provided transitively via :lib. Only test-specific
    deps (vitest, test utils, etc.) need to be listed here.

    Fixtures in tests/fixtures/ are auto-discovered and passed to vitest.

    Args:
        name: target name (e.g. "unit_test")
        srcs: test files (gazelle-managed)
        deps: test-specific dependencies (gazelle-managed)
        **kwargs: passed through to vitest (dom, config, size, tsconfig, data, etc.)
    """

    # Auto-discover test fixtures if not explicitly provided.
    if "fixtures" not in kwargs:
        fixtures = native.glob(["tests/fixtures/**"], allow_empty = True)
        if fixtures:
            kwargs["fixtures"] = fixtures

    vitest(
        name = name,
        srcs = [":srcs"] + srcs,
        deps = deps + [":lib"],
        **kwargs
    )
