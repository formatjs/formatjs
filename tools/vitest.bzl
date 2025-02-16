"Utility macro the vanilla aspect.dev rules_jest to supply common dependencies."

load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")

def vitest(name, srcs = [], deps = [], size = "small", flaky = False, tags = [], no_copy_to_bin = [], **kwargs):
    """
    A rule to define a vitest target.

    Args:
        name (str): The name of the target.
        srcs (list): A list of source files for the target.
        deps (list): A list of dependencies for the target.
        size (str, optional): The size of the test. Defaults to "small".
        flaky (bool, optional): Whether the test is flaky. Defaults to False.
        tags (list, optional): A list of tags for the target. Defaults to an empty list.
        no_copy_to_bin (list, optional): A list of files not to copy to the bin directory. Defaults to an empty list.
        **kwargs: Additional keyword arguments.
    """

    deps = deps + [
        "//:node_modules/tslib",
        "//:node_modules/vitest",
        "//:node_modules/vite",
        "//:node_modules/@types/node",
    ]

    ts_project(
        name = "typecheck_test",
        srcs = srcs,
        tsconfig = "//:tsconfig.test",
        resolve_json_module = True,
        declaration = True,
        no_emit = True,
        testonly = True,
        deps = deps,
    )

    vitest_bin.vitest_test(
        name = name,
        data = srcs + deps,
        size = size,
        flaky = flaky,
        tags = tags,
        no_copy_to_bin = no_copy_to_bin,
        args = [
            "run",
        ],
        **kwargs
    )
