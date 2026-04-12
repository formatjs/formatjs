"Macro for formatjs test targets with separated dep tracking."

load("//tools:vitest.bzl", "vitest")

def formatjs_test(
        name,
        srcs = [],
        deps = [],
        project_references = [],
        test_deps = [],
        test_project_references = [],
        **kwargs):
    """Vitest wrapper with separated dependency tracking.

    Separates deps into 4 categories for gazelle:
    - deps: external npm deps from source files
    - project_references: internal //packages/* deps from source files
    - test_deps: external npm deps only in test files
    - test_project_references: internal deps only in test files

    All categories are merged and passed to vitest.

    Args:
        name: target name (e.g. "unit_test")
        srcs: source + test files
        deps: external npm dependencies from source files (gazelle-managed)
        project_references: internal package deps from source files (gazelle-managed)
        test_deps: external npm deps only in test files (gazelle-managed)
        test_project_references: internal deps only in test files (gazelle-managed)
        **kwargs: passed through to vitest (dom, config, size, tsconfig, data, etc.)
    """
    all_deps = deps + project_references + test_deps + test_project_references + [":lib"]

    vitest(
        name = name,
        srcs = srcs,
        deps = all_deps,
        **kwargs
    )
