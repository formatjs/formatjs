"""Generate npm package.json files from Bazel dependency labels."""

load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("//tools:index.bzl", "ts_run_binary")
load("//tools:package_json_policy.bzl", "PACKAGE_JSON_SORT_EXPORTS", "PACKAGE_JSON_SORT_FIRST")

_DEPENDENCY_FIELDS = [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
]

_ROOT_VERSION_FIELDS = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
]

_GENERATED_PACKAGE_PREFIX = "@formatjs_generated/"
_ROOT_PACKAGE_JSON_SYNC_VISIBILITY = ["//:__pkg__"]

_UNSET = "__FORMATJS_PACKAGE_JSON_UNSET__"

def _set_field(fields, package_json_field, value):
    if value != _UNSET:
        fields[package_json_field] = value

def _package_json_fields(
        package_name = None,
        version = _UNSET,
        private = _UNSET,
        description = _UNSET,
        keywords = _UNSET,
        homepage = _UNSET,
        bugs = _UNSET,
        license = _UNSET,
        author = _UNSET,
        contributors = _UNSET,
        repository = _UNSET,
        type = _UNSET,
        main = _UNSET,
        module = _UNSET,
        types = _UNSET,
        exports = _UNSET,
        side_effects = _UNSET,
        files = _UNSET,
        os = _UNSET,
        cpu = _UNSET,
        libc = _UNSET,
        bin = _UNSET,
        engines = _UNSET,
        scripts = _UNSET,
        browserslist = _UNSET,
        alias = _UNSET,
        git_head = _UNSET):
    if not package_name:
        fail("package_name is required")
    if git_head != _UNSET:
        fail("git_head must not be set in generated package.json metadata")

    fields = {
        "name": package_name,
    }
    _set_field(fields, "version", version)
    _set_field(fields, "private", private)
    _set_field(fields, "description", description)
    _set_field(fields, "keywords", keywords)
    _set_field(fields, "homepage", homepage)
    _set_field(fields, "bugs", bugs)
    _set_field(fields, "license", license)
    _set_field(fields, "author", author)
    _set_field(fields, "contributors", contributors)
    _set_field(fields, "repository", repository)
    _set_field(fields, "type", type)
    _set_field(fields, "main", main)
    _set_field(fields, "module", module)
    _set_field(fields, "types", types)
    _set_field(fields, "exports", exports)
    _set_field(fields, "sideEffects", side_effects)
    _set_field(fields, "files", files)
    _set_field(fields, "os", os)
    _set_field(fields, "cpu", cpu)
    _set_field(fields, "libc", libc)
    _set_field(fields, "bin", bin)
    _set_field(fields, "engines", engines)
    _set_field(fields, "scripts", scripts)
    _set_field(fields, "browserslist", browserslist)
    _set_field(fields, "alias", alias)
    return fields

def _metadata_file_impl(ctx):
    ctx.actions.write(
        output = ctx.outputs.out,
        content = ctx.attr.content,
    )
    return [DefaultInfo(files = depset([ctx.outputs.out]))]

_metadata_file = rule(
    implementation = _metadata_file_impl,
    attrs = {
        "content": attr.string(mandatory = True),
        "out": attr.output(mandatory = True),
    },
)

def _npm_package_name(label):
    text = str(label)
    tail = None
    for marker in ["//:node_modules/", ":node_modules/"]:
        index = text.find(marker)
        if index != -1:
            tail = text[index + len(marker):]
            break

    if tail == None:
        return None

    if ":" in tail:
        tail = tail.split(":", 1)[0]
    tail = tail.strip("/")

    if not tail:
        return None
    if tail.startswith(_GENERATED_PACKAGE_PREFIX):
        return None
    return tail

def _npm_package_names(labels, attr_name, require_npm = False):
    result = []
    seen = {}
    for label in labels:
        package_name = _npm_package_name(label)
        if not package_name:
            if require_npm:
                fail("%s must contain only npm package labels, got %s" % (attr_name, label))
            continue
        if package_name in seen:
            continue
        seen[package_name] = True
        result.append(package_name)
    return result

def _check_classified_deps(names_by_field):
    owner = {}
    for field, names in names_by_field.items():
        for package_name in names:
            owner[package_name] = field
    return owner

def _check_dependency_version_overrides(dependency_version_overrides, names_by_field):
    if not dependency_version_overrides:
        return

    dependency_owner = {}
    for field, names in names_by_field.items():
        for package_name in names:
            dependency_owner[package_name] = field

    unused = [
        package_name
        for package_name in sorted(dependency_version_overrides.keys())
        if package_name not in dependency_owner
    ]
    if unused:
        fail(
            "dependency_version_overrides contains unused override(s): %s. " %
            ", ".join(unused) +
            "Override keys must match generated dependency names: %s" %
            ", ".join(sorted(dependency_owner.keys())),
        )

def formatjs_package_json(
        name = "package_json",
        package_name = None,
        version = _UNSET,
        private = _UNSET,
        description = _UNSET,
        keywords = _UNSET,
        homepage = _UNSET,
        bugs = _UNSET,
        license = _UNSET,
        author = _UNSET,
        contributors = _UNSET,
        repository = _UNSET,
        type = _UNSET,
        main = _UNSET,
        module = _UNSET,
        types = _UNSET,
        exports = _UNSET,
        side_effects = _UNSET,
        files = _UNSET,
        os = _UNSET,
        cpu = _UNSET,
        libc = _UNSET,
        bin = _UNSET,
        engines = _UNSET,
        scripts = _UNSET,
        browserslist = _UNSET,
        alias = _UNSET,
        git_head = _UNSET,
        deps = [],
        peer_deps = [],
        peer_dependencies_meta = _UNSET,
        optional_deps = [],
        dependency_version_overrides = {},
        root_package_json = "//:root_package_json",
        out = "package.json",
        tags = [],
        visibility = None):
    """Generate a package.json file for npm packaging.

    Static package metadata comes from package.json field attrs. Dependency
    sections are generated from Bazel labels, with version ranges read from
    dependency_version_overrides or the root package.json.

    Args:
        name: Bazel target name.
        package_name: package.json name field.
        deps: Bazel deps that should become package.json dependencies. Non-npm
            labels and @formatjs_generated labels are ignored.
        peer_deps: npm labels that should become peerDependencies.
        peer_dependencies_meta: package.json peerDependenciesMeta field.
        optional_deps: npm labels that should become optionalDependencies.
        dependency_version_overrides: package-name to version-range overrides.
        root_package_json: source of default package version ranges.
        out: output path, normally "package.json".
        tags: tags applied to generated targets.
        visibility: target visibility.
    """
    fields = _package_json_fields(
        alias = alias,
        author = author,
        bin = bin,
        browserslist = browserslist,
        bugs = bugs,
        contributors = contributors,
        cpu = cpu,
        description = description,
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
        os = os,
        package_name = package_name,
        private = private,
        repository = repository,
        scripts = scripts,
        side_effects = side_effects,
        type = type,
        types = types,
        version = version,
    )
    _set_field(fields, "peerDependenciesMeta", peer_dependencies_meta)

    for field in _ROOT_VERSION_FIELDS:
        if field in fields:
            fail("%s must come from Bazel label attrs, not fields" % field)

    peer_names = _npm_package_names(peer_deps, "peer_deps", require_npm = True)
    optional_names = _npm_package_names(optional_deps, "optional_deps", require_npm = True)

    classified = _check_classified_deps({
        "peerDependencies": peer_names,
        "optionalDependencies": optional_names,
    })

    dependency_names = [
        package_name
        for package_name in _npm_package_names(deps, "deps")
        if package_name not in classified
    ]
    _check_dependency_version_overrides(dependency_version_overrides, {
        "dependencies": dependency_names,
        "peerDependencies": peer_names,
        "optionalDependencies": optional_names,
    })

    metadata_name = "%s_metadata" % name
    _metadata_file(
        name = metadata_name,
        content = json.encode_indent({
            "fields": fields,
            "dependencies": dependency_names,
            "peerDependencies": peer_names,
            "optionalDependencies": optional_names,
            "dependencyVersionOverrides": dependency_version_overrides,
            "sortExports": PACKAGE_JSON_SORT_EXPORTS,
            "sortFirst": PACKAGE_JSON_SORT_FIRST,
        }, indent = "  "),
        out = "%s.json" % metadata_name,
        tags = tags,
    )

    ts_run_binary(
        name = name,
        srcs = [
            root_package_json,
            ":%s" % metadata_name,
            "//:node_modules/minimist",
        ],
        outs = [out],
        args = [
            "--root-package-json",
            "$(rootpath %s)" % root_package_json,
            "--metadata",
            "$(rootpath :%s)" % metadata_name,
            "--out",
            "$(rootpath %s)" % out,
        ],
        tags = tags,
        tool = "//tools:generate-package-json",
        visibility = visibility,
    )

def generate_package_json(
        name = "generated_package_json",
        package_name = None,
        version = _UNSET,
        private = _UNSET,
        description = _UNSET,
        keywords = _UNSET,
        homepage = _UNSET,
        bugs = _UNSET,
        license = _UNSET,
        author = _UNSET,
        contributors = _UNSET,
        repository = _UNSET,
        type = _UNSET,
        main = _UNSET,
        module = _UNSET,
        types = _UNSET,
        exports = _UNSET,
        side_effects = _UNSET,
        files = _UNSET,
        os = _UNSET,
        cpu = _UNSET,
        libc = _UNSET,
        bin = _UNSET,
        engines = _UNSET,
        scripts = _UNSET,
        browserslist = _UNSET,
        alias = _UNSET,
        peer_dependencies_meta = _UNSET,
        git_head = _UNSET,
        deps = [],
        peer_deps = [],
        optional_deps = [],
        dependency_version_overrides = {},
        tags = [],
        visibility = None):
    """Generate package JSON for root write_source_files verification."""
    sync_visibility = visibility or _ROOT_PACKAGE_JSON_SYNC_VISIBILITY
    formatjs_package_json(
        name = name,
        alias = alias,
        author = author,
        bin = bin,
        browserslist = browserslist,
        bugs = bugs,
        contributors = contributors,
        cpu = cpu,
        description = description,
        deps = deps,
        dependency_version_overrides = dependency_version_overrides,
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
        optional_deps = optional_deps,
        os = os,
        out = "generated_package.json",
        package_name = package_name,
        peer_deps = peer_deps,
        peer_dependencies_meta = peer_dependencies_meta,
        private = private,
        repository = repository,
        scripts = scripts,
        side_effects = side_effects,
        tags = tags,
        type = type,
        types = types,
        version = version,
        visibility = sync_visibility,
    )
    write_source_files(
        name = "package_json_sync",
        files = {
            "package.json": ":%s" % name,
        },
        suggested_update_target = "//:package_json_sync",
        tags = tags,
        visibility = sync_visibility,
    )
