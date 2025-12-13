"Utility macro the vanilla aspect.dev rules_jest to supply common dependencies."

load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_file", "write_source_files")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("//tools:tsconfig.bzl", "TEST_TSCONFIG")

def vitest(
        name,
        srcs = [],
        deps = [],
        size = "small",
        flaky = False,
        tags = [],
        no_copy_to_bin = [],
        fixtures = [],
        dom = False,
        snapshots = [],
        skip_typecheck = False,
        test_timeout = None,
        **kwargs):
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
        snapshots (list, optional): A list of snapshot files for the target. Defaults to an empty list.
        fixtures (list, optional): A list of fixture files for the target. Defaults to an empty list.
        dom (bool, optional): Whether to run the test in a DOM environment. Defaults to False.
        skip_typecheck (bool, optional): Whether to skip typechecking. Defaults to False.
        test_timeout (str, optional): Custom timeout for the test in milliseconds. Defaults to None.
        **kwargs: Additional keyword arguments.
    """

    deps = deps + [
        "//:node_modules/tslib",
        "//:node_modules/vitest",
        "//:node_modules/vite",
        "//:node_modules/@types/node",
    ] + (["//:node_modules/happy-dom"] if dom else [])

    deps = list(set(deps))

    # Filter out snapshot files from srcs
    srcs_no_snapshots = [src for src in srcs if "/__snapshots__/" not in src]

    if not skip_typecheck:
        ts_project(
            name = "%s_typecheck" % name,
            srcs = srcs_no_snapshots,
            tsconfig = TEST_TSCONFIG,
            resolve_json_module = True,
            declaration = True,
            no_emit = True,
            testonly = True,
            deps = deps,
        )

    vitest_bin.vitest_test(
        name = name,
        data = srcs + deps + snapshots + fixtures,
        size = size,
        flaky = flaky,
        tags = tags,
        no_copy_to_bin = no_copy_to_bin,
        args = [
            "run",
        ] + (["--dom"] if dom else []) + (["--testTimeout ", test_timeout] if test_timeout else []),
        **kwargs
    )

    test_files = [src for src in srcs_no_snapshots if ".test.ts" in src or ".test.tsx" in src]

    test_file_dirs = {}
    for test_file in test_files:
        test_file_dir = "/".join(test_file.split("/")[:-1])
        if test_file_dir not in test_file_dirs:
            test_file_dirs[test_file_dir] = []
        test_file_dirs[test_file_dir].append(test_file)

    snapshot_targets = []
    for test_file_dir, test_files_in_dir in test_file_dirs.items():
        snapshot_dir = test_file_dir + "/__snapshots__" if test_file_dir else "__snapshots__"

        # Use a unique name for the snapshot target to avoid conflicts when multiple tests share the same snapshot directory
        snapshot_target_name = name + "_" + snapshot_dir.replace("/", "_")
        vitest_bin.vitest(
            name = snapshot_target_name,
            srcs = srcs_no_snapshots +
                   deps,
            out_dirs = [snapshot_dir],
            args = [
                "run",
                "--no-file-parallelism",
                "--update",
            ],
            tags = ["manual"],
        )

        write_source_file(
            name = snapshot_target_name + ".update",
            in_file = snapshot_target_name,
            out_file = snapshot_dir,
            check_that_out_file_exists = False,
            diff_test = False,
            tags = ["manual"],
        )

        snapshot_targets.append(snapshot_target_name + ".update")

    write_source_files(
        name = "%s.update" % name,
        additional_update_targets = snapshot_targets,
        tags = ["snapshot", "manual"],
    )
