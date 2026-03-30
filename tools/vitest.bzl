"Vitest test macros for Bazel."

load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_file", "write_source_files")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("@npm//:vitest/package_json.bzl", vitest_bin = "bin")
load("//tools:tsconfig.bzl", "ESNEXT_TSCONFIG")

# Test tsconfig: ESNext with skipLibCheck, Node types, and relaxed side-effect imports
TEST_TSCONFIG = ESNEXT_TSCONFIG | {
    "compilerOptions": ESNEXT_TSCONFIG["compilerOptions"] | {
        "noUncheckedSideEffectImports": False,
        "skipLibCheck": True,
        "types": ["node"],
    },
}

# Common test deps added to all vitest targets
VITEST_DEPS = [
    "//:node_modules/vitest",
    "//:node_modules/vite",
    "//:node_modules/@types/node",
]

VITEST_DOM_DEPS = ["//:node_modules/happy-dom"]

def vitest_runner(
        name,
        srcs = [],
        deps = [],
        data = [],
        size = "small",
        flaky = False,
        tags = [],
        no_copy_to_bin = [],
        fixtures = [],
        dom = False,
        snapshots = [],
        test_timeout = None,
        config = None,
        **kwargs):
    """Run vitest tests with snapshot support. Does NOT include type-checking.

    Type-checking should be done via a separate ts_project target in the
    BUILD file so gazelle can manage its deps.

    Args:
        name: target name
        srcs: source and test files
        deps: dependencies
        data: additional data dependencies (e.g., binaries)
        size: test size (default: "small")
        flaky: whether the test is flaky
        tags: tags for the target
        no_copy_to_bin: files not to copy to bin
        fixtures: fixture files
        dom: whether to run in a DOM environment (adds happy-dom)
        snapshots: snapshot files
        test_timeout: custom timeout in milliseconds
        config: custom vitest config file
        **kwargs: additional arguments passed to vitest_test
    """

    deps = deps + VITEST_DEPS + (VITEST_DOM_DEPS if dom else [])
    deps = list(set(deps))

    # Use the shared base config for Bazel sandbox compatibility (preserveSymlinks).
    # Packages with custom configs must also include resolve.preserveSymlinks: true.
    base_config = "//tools:vitest_config_mjs"
    actual_config = config if config else base_config

    vitest_bin.vitest_test(
        name = name,
        data = srcs + deps + data + snapshots + fixtures + [actual_config],
        size = size,
        flaky = flaky,
        tags = tags,
        no_copy_to_bin = no_copy_to_bin,
        args = [
            "run",
            "--config",
            "$(rootpath %s)" % actual_config,
        ] + (["--dom"] if dom else []) + (["--testTimeout ", test_timeout] if test_timeout else []),
        **kwargs
    )

    # Filter out snapshot files from srcs
    srcs_no_snapshots = [src for src in srcs if "/__snapshots__/" not in src]

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

        # Note: data dependencies (like Rust binaries) are not available in snapshot update mode
        # due to js_run_binary limitations. Tests should conditionally skip tests that require
        # data dependencies when they can't be resolved.
        vitest_bin.vitest(
            name = snapshot_target_name,
            srcs = srcs_no_snapshots + fixtures + deps,
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

def vitest(
        name,
        srcs = [],
        deps = [],
        data = [],
        size = "small",
        flaky = False,
        tags = [],
        no_copy_to_bin = [],
        fixtures = [],
        dom = False,
        snapshots = [],
        test_timeout = None,
        config = None,
        **kwargs):
    """DEPRECATED: Use vitest_runner + explicit ts_project instead.

    Legacy macro that combines type-checking and test execution. Kept for
    backwards compatibility during migration.

    Args:
        name: target name
        srcs: source and test files
        deps: dependencies
        data: additional data dependencies
        size: test size
        flaky: whether the test is flaky
        tags: tags
        no_copy_to_bin: files not to copy to bin
        fixtures: fixture files
        dom: whether to run in a DOM environment
        snapshots: snapshot files
        test_timeout: custom timeout in milliseconds
        config: custom vitest config file
        **kwargs: additional arguments
    """

    all_deps = deps + VITEST_DEPS + (VITEST_DOM_DEPS if dom else [])
    all_deps = list(set(all_deps))

    # Filter out snapshot files from srcs
    srcs_no_snapshots = [src for src in srcs if "/__snapshots__/" not in src]

    # Type check only with tsgo (fast, parallel)
    ts_project(
        name = "%s_typecheck" % name,
        srcs = srcs_no_snapshots,
        tsconfig = TEST_TSCONFIG,
        resolve_json_module = True,
        declaration = True,
        no_emit = True,
        testonly = True,
        deps = all_deps,
        transpiler = tsgo_bin.tsgo,
    )

    vitest_runner(
        name = name,
        srcs = srcs,
        deps = deps,
        data = data,
        size = size,
        flaky = flaky,
        tags = tags,
        no_copy_to_bin = no_copy_to_bin,
        fixtures = fixtures,
        dom = dom,
        snapshots = snapshots,
        test_timeout = test_timeout,
        config = config,
        **kwargs
    )
