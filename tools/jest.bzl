"Utility macro the vanilla aspect.dev rules_jest to supply common dependencies."

load("@aspect_rules_jest//jest:defs.bzl", _jest_test = "jest_test")

def jest_test(name, data, size = "small", jest_config = "//:jest.config", node_modules = "//:node_modules", snapshots = [], flaky = False, tags = [], **kwargs):
    """A macro around the autogenerated jest_test rule.

    The target to update the snapshot is `{name}_update_snapshots`.

    Args:
        name: target name
        data: list of data sources and dependencies.
        size: test size
        snapshots: snapshot files
        jest_config: jest.config.js file, default to the root one
        node_modules: the node_modules label, default to the root one
        flaky: Whether this test is flaky
        tags: tags
        **kwargs: the rest
    """
    data = data + [
        "//:node_modules/@swc/jest",
        "//:node_modules/@types/jest",
        "//:node_modules/@swc/helpers",
        "//:swcrc",
    ]

    tags = [
        # Need to set the pwd to avoid jest needing a runfiles helper
        # Windows users with permissions can use --enable_runfiles
        # to make this test work
        "no-bazelci-windows",
        # TODO: why does this fail almost all the time, but pass on local Mac?
        "no-bazelci-mac",
    ] + tags

    _jest_test(
        name = name,
        config = jest_config,
        node_modules = node_modules,
        data = data,
        size = size,
        snapshots = snapshots,
        flaky = flaky,
        tags = tags,
        node_options = [
            "--experimental-vm-modules",
        ],
        **kwargs
    )
