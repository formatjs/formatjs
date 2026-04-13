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

    Files under tests/fixtures/ in srcs are automatically separated and
    passed as the fixtures kwarg to vitest.

    Args:
        name: target name (e.g. "unit_test")
        srcs: test files (gazelle-managed, may include fixtures)
        deps: test-specific dependencies (gazelle-managed)
        **kwargs: passed through to vitest (dom, config, size, tsconfig, data, etc.)
    """

    # Separate fixture files from test srcs if not explicitly provided.
    if "fixtures" not in kwargs:
        fixtures = [s for s in srcs if "/fixtures/" in s]
        if fixtures:
            srcs = [s for s in srcs if "/fixtures/" not in s]
            kwargs["fixtures"] = fixtures

    vitest(
        name = name,
        srcs = [":srcs"] + srcs,
        deps = deps + [":lib"],
        **kwargs
    )
