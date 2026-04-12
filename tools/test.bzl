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

    Args:
        name: target name (e.g. "unit_test")
        srcs: test files
        deps: test-specific dependencies (gazelle-managed)
        **kwargs: passed through to vitest (dom, config, size, tsconfig, data, etc.)
    """
    vitest(
        name = name,
        srcs = [":srcs"] + srcs,
        deps = deps + [":lib"],
        **kwargs
    )
