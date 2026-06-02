"Macro for TypeScript compilation + rolldown bundling + npm packaging."

load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:@typescript/native-preview/package_json.bzl", tsgo_bin = "bin")
load("//tools:index.bzl", "generate_ide_tsconfig_json", "no_internal_imports_test", "package_exports_test", "package_json_test")
load("//tools:oxc_transpiler.bzl", "oxc_transpiler")
load("//tools:package_json.bzl", "formatjs_package_json", "generate_package_json")
load("//tools:rolldown.bzl", "rolldown_bundle")
load("//tools:tsconfig.bzl", "packages_tsconfig")

_PACKAGE_JSON_UNSET = "__FORMATJS_PACKAGE_JSON_UNSET__"

def _formatjs_package(
        package_name,
        entry_points,
        deps,
        external_packages,
        npm_package_name,
        package_json,
        extra_npm_srcs,
        allow_overwrites):
    """Rolldown bundling + npm packaging + validation tests (private).

    Generates:
    - rolldown_bundle per entry point (dts=True, esm, es2020)
    - js_library(name = {package_name}) with bundles + package.json
    - npm_package(name = "pkg")
    - no_internal_imports_test
    - package_json_test
    - package_exports_test
    - generate_ide_tsconfig_json()
    """
    effective_npm_name = npm_package_name or ("@formatjs/%s" % package_name)

    # package.json is exposed to rolldown so entry points can do
    # `import './package.json' with {type: 'json'}` (used to inject plugin
    # name/version into bundled output). Kept out of the `:srcs` copy_to_bin
    # — and therefore out of `:lib` — because including the package's own
    # package.json in the test sandbox shadows the root `//:package.json` and
    # breaks `#packages/*` subpath import resolution at runtime.
    for entry in entry_points:
        rolldown_bundle(
            name = "%s-bundle" % entry.replace(".ts", ""),
            srcs = [":srcs", package_json],
            dts = True,
            entry_point = entry,
            external = external_packages,
            format = "esm",
            output = "%s.js" % entry.replace(".ts", ""),
            target = "es2020",
            deps = deps,
        )

    bundles = [":%s-bundle" % entry.replace(".ts", "") for entry in entry_points]
    replace_prefixes = {
        "%s-bundle/" % entry.replace(".ts", ""): ""
        for entry in entry_points
    }

    js_library(
        name = package_name,
        srcs = bundles + [package_json],
        visibility = ["//visibility:public"],
    )

    npm_pkg_kwargs = {}
    if allow_overwrites:
        npm_pkg_kwargs["allow_overwrites"] = True

    npm_package(
        name = "pkg",
        srcs = [
            "LICENSE.md",
            "README.md",
            package_json,
        ] + bundles + extra_npm_srcs,
        package = effective_npm_name,
        replace_prefixes = replace_prefixes,
        visibility = ["//visibility:public"],
        **npm_pkg_kwargs
    )

    no_internal_imports_test(
        name = "no_internal_imports_test",
        data = bundles,
    )

    package_json_test(
        name = "package_json_test",
        bundles = bundles,
        package_json = package_json,
    )

    package_exports_test(
        name = "package_exports_test",
        pkg = ":pkg",
    )

def _partition_deps(deps):
    """Split a combined deps list into (npm, internal).

    npm: labels under //:node_modules/ — externalized at bundle time.
    internal: every other label — internal cross-package references.

    The new gazelle_ts_plugin emits a single combined `deps` attr; the macro
    re-splits so rolldown can externalize npm packages while bundling internal
    references inline.
    """
    npm_deps = []
    internal_deps = []
    for d in deps:
        if "//:node_modules/" in d:
            npm_deps.append(d)
        else:
            internal_deps.append(d)
    return npm_deps, internal_deps

def _with_tsconfig_types(tsconfig, tsconfig_types):
    if not tsconfig_types:
        return tsconfig

    compiler_options = dict(tsconfig.get("compilerOptions", {}))
    seen = {}
    types = []
    for type_name in compiler_options.get("types", []) + tsconfig_types:
        if type_name in seen:
            continue
        seen[type_name] = True
        types.append(type_name)
    compiler_options["types"] = types

    merged = dict(tsconfig)
    merged["compilerOptions"] = compiler_options
    return merged

def formatjs_library(
        name,
        srcs,
        deps = [],
        entry_points = ["index.ts"],
        types = False,
        tsconfig = None,
        tsconfig_types = [],
        npm_package_name = None,
        package_name = None,
        version = _PACKAGE_JSON_UNSET,
        private = _PACKAGE_JSON_UNSET,
        description = _PACKAGE_JSON_UNSET,
        keywords = _PACKAGE_JSON_UNSET,
        homepage = _PACKAGE_JSON_UNSET,
        bugs = _PACKAGE_JSON_UNSET,
        license = _PACKAGE_JSON_UNSET,
        author = _PACKAGE_JSON_UNSET,
        contributors = _PACKAGE_JSON_UNSET,
        repository = _PACKAGE_JSON_UNSET,
        type = _PACKAGE_JSON_UNSET,
        main = _PACKAGE_JSON_UNSET,
        module = _PACKAGE_JSON_UNSET,
        package_types = _PACKAGE_JSON_UNSET,
        exports = _PACKAGE_JSON_UNSET,
        side_effects = _PACKAGE_JSON_UNSET,
        files = _PACKAGE_JSON_UNSET,
        os = _PACKAGE_JSON_UNSET,
        cpu = _PACKAGE_JSON_UNSET,
        libc = _PACKAGE_JSON_UNSET,
        bin = _PACKAGE_JSON_UNSET,
        engines = _PACKAGE_JSON_UNSET,
        scripts = _PACKAGE_JSON_UNSET,
        browserslist = _PACKAGE_JSON_UNSET,
        alias = _PACKAGE_JSON_UNSET,
        peer_dependencies_meta = _PACKAGE_JSON_UNSET,
        git_head = _PACKAGE_JSON_UNSET,
        package_peer_deps = [],
        package_optional_deps = [],
        package_dependency_version_overrides = {},
        extra_npm_srcs = [],
        allow_overwrites = False,
        visibility = None,
        **typecheck_only_kwargs):
    """TypeScript compilation + optional npm packaging.

    For npm-published packages (with package.json): rolldown bundling + npm_package.
    For internal packages (no package.json): oxc per-file transpilation.

    Generates:
    - copy_to_bin(name = "srcs") for sandbox compatibility
    - js_library(name = "lib") wrapping sources + deps
    - ts_project(name = "typecheck") for type checking (tsgo, no emit)
    - Optionally ts_project(name = "types") with emit_declaration_only
    - If package.json exists: rolldown bundles, npm_package, and validation tests
    - If no package.json: oxc per-file transpilation

    Args:
        name: target name (e.g. "dist")
        srcs: source files (gazelle-managed)
        deps: combined dependency list (gazelle-managed). Includes both npm
            packages (//:node_modules/...) and internal references
            (//packages/...). The macro auto-partitions them: npm packages
            become externalized at bundle time, internals become project
            references for IDE tsconfig.
        entry_points: list of .ts entry points to bundle
        types: if True, generate a "types" ts_project with emit_declaration_only
        tsconfig: optional tsconfig dict override (defaults to packages_tsconfig())
        npm_package_name: npm package name for publishing (default "@formatjs/{dir_name}")
        package_name: optional package.json name field. If provided, package
            metadata is generated from the package field attrs when no
            checked-in source manifest exists; otherwise the generated manifest
            is compared with the checked-in package.json.
        package_peer_deps: npm labels that should become peerDependencies.
        package_optional_deps: npm labels that should become optionalDependencies.
        package_dependency_version_overrides: package-name to version-range overrides.
        extra_npm_srcs: additional files for npm_package (iife bundles, locale-data, etc.)
        allow_overwrites: passed to npm_package (default False)
        visibility: visibility for the js_library target
    """

    # Pre-existing manual `ts_project(no_emit = True, ...)` rules in some
    # BUILDs get rewritten to `formatjs_library(...)` by `# gazelle:map_kind ts_library`.
    # Detect that pattern (typecheck-only — no library/bundle output) and
    # forward straight to ts_project so the macro keeps emitting the same
    # underlying rule.
    if typecheck_only_kwargs.get("no_emit"):
        ts_project(
            name = name,
            srcs = srcs,
            deps = deps,
            tsconfig = _with_tsconfig_types(tsconfig, tsconfig_types) if tsconfig else None,
            visibility = visibility,
            **typecheck_only_kwargs
        )
        return

    # Older gazelle_ts emitted these (composite/declaration/source_map) on
    # every library when `ts_project_references` defaulted to true; the new
    # ts_library abstract kind never emits them. Pop defensively in case a
    # downgrade or hand-edit reintroduces them — the macro has its own
    # bundling pipeline (rolldown for published, oxc for internal) so the
    # stock ts_project flags don't apply.
    for _ignored in ("composite", "declaration", "declaration_map", "source_map"):
        typecheck_only_kwargs.pop(_ignored, None)

    if typecheck_only_kwargs:
        fail(
            "formatjs_library got unexpected kwargs: %s. Only typecheck-only " +
            "ts_project shimming (no_emit=True) accepts extra kwargs." %
            list(typecheck_only_kwargs.keys()),
        )

    npm_deps, project_references = _partition_deps(deps)
    all_deps = deps
    effective_tsconfig = _with_tsconfig_types(tsconfig or packages_tsconfig(), tsconfig_types)
    source_package_json = native.glob(["package.json"], allow_empty = True)
    has_source_package_json = bool(source_package_json)
    generated_package_json = package_name != None
    has_package_json = generated_package_json or has_source_package_json
    package_json_label = "package.json" if has_source_package_json else ":package_json"

    if package_name != None:
        if has_source_package_json:
            generate_package_json(
                alias = alias,
                author = author,
                bin = bin,
                browserslist = browserslist,
                bugs = bugs,
                contributors = contributors,
                cpu = cpu,
                description = description,
                deps = deps,
                engines = engines,
                exports = exports,
                files = files,
                git_head = git_head,
                homepage = homepage,
                keywords = keywords,
                libc = libc,
                license = license,
                main = main,
                module = module,
                optional_deps = package_optional_deps,
                os = os,
                package_name = package_name,
                peer_dependencies_meta = peer_dependencies_meta,
                peer_deps = package_peer_deps,
                private = private,
                repository = repository,
                scripts = scripts,
                side_effects = side_effects,
                type = type,
                types = package_types,
                version = version,
                dependency_version_overrides = package_dependency_version_overrides,
            )
        else:
            formatjs_package_json(
                alias = alias,
                author = author,
                bin = bin,
                browserslist = browserslist,
                bugs = bugs,
                contributors = contributors,
                cpu = cpu,
                description = description,
                deps = deps,
                engines = engines,
                exports = exports,
                files = files,
                git_head = git_head,
                homepage = homepage,
                keywords = keywords,
                libc = libc,
                license = license,
                main = main,
                module = module,
                optional_deps = package_optional_deps,
                os = os,
                package_name = package_name,
                peer_dependencies_meta = peer_dependencies_meta,
                peer_deps = package_peer_deps,
                private = private,
                repository = repository,
                scripts = scripts,
                side_effects = side_effects,
                type = type,
                types = package_types,
                version = version,
                dependency_version_overrides = package_dependency_version_overrides,
            )
    elif has_source_package_json:
        fail("formatjs_library() packages with package.json must pass package_name and package field attrs")

    copy_to_bin(
        name = "srcs",
        srcs = srcs,
    )

    ts_project(
        name = "typecheck",
        srcs = [":srcs"] + ([package_json_label] if has_package_json else []),
        declaration = True,
        no_emit = True,
        resolve_json_module = True,
        transpiler = tsgo_bin.tsgo,
        tsconfig = effective_tsconfig,
        deps = all_deps,
    )

    if has_package_json:
        # Published package: use :srcs for lib, rolldown for bundling
        js_library(
            name = "lib",
            srcs = [":srcs"],
            deps = all_deps,
            visibility = visibility,
        )
    else:
        # Internal package: oxc per-file transpilation
        # The js_library name matches the directory name so that
        # //packages/foo/bar resolves to the :bar target.
        lib_name = native.package_name().split("/")[-1]

        ts_project(
            name = "%s-esm" % lib_name,
            srcs = [":srcs"],
            declaration = True,
            tsconfig = effective_tsconfig,
            resolve_json_module = True,
            deps = all_deps + ["//:node_modules/oxc-transform"],
            transpiler = oxc_transpiler,
            declaration_transpiler = oxc_transpiler,
        )

        js_library(
            name = lib_name,
            srcs = [":%s-esm" % lib_name] + source_package_json,
            visibility = visibility,
        )

        # Alias so formatjs_test's :lib reference works. Public visibility
        # because cross-package deps may chain through :name → :lib →
        # :lib_name and Bazel checks every alias hop.
        native.alias(
            name = "lib",
            actual = ":%s" % lib_name,
            visibility = visibility or ["//visibility:public"],
        )

    if types:
        ts_project(
            name = "types",
            srcs = [":srcs"],
            declaration = True,
            emit_declaration_only = True,
            resolve_json_module = True,
            transpiler = tsgo_bin.tsgo,
            tsconfig = effective_tsconfig,
            visibility = ["//visibility:public"],
            deps = all_deps,
        )

    # Auto-generate npm packaging if package.json exists
    if has_package_json:
        # Compute external packages for rolldown (only node_modules deps are externalized).
        # Exclude @formatjs_generated — generated data is bundled inline, not externalized.
        external_packages = [
            dep.split("node_modules/")[1]
            for dep in npm_deps
            if "@formatjs_generated" not in dep
        ]

        package_dir_name = native.package_name().split("/")[-1]
        _formatjs_package(
            package_name = package_dir_name,
            entry_points = entry_points,
            deps = all_deps,
            external_packages = external_packages,
            npm_package_name = npm_package_name,
            package_json = package_json_label,
            extra_npm_srcs = extra_npm_srcs,
            allow_overwrites = allow_overwrites,
        )

    generate_ide_tsconfig_json(
        composite = not has_package_json,
        project_references = project_references,
        tsconfig_types = tsconfig_types,
    )
