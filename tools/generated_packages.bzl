"Linking helpers for generated npm package labels."

load("@aspect_rules_js//npm:defs.bzl", "npm_link_package")
load("//tools:dist_packages_registry.bzl", "RELEASE_PLEASE_NPM_PACKAGES")
load("//tools:generated_packages_registry.bzl", "GENERATED_PACKAGES")
load("//tools:workspace_package_link_deps.bzl", "WORKSPACE_PACKAGE_LINK_DEPS")

def link_all_generated_packages():
    """Create npm_link_package entries for all @formatjs_generated packages.

    Called from the root BUILD.bazel to symlink generated packages into
    node_modules/@formatjs_generated/*.
    """
    for pkg in GENERATED_PACKAGES:
        npm_link_package(
            name = "node_modules/@formatjs_generated/%s" % pkg["name"],
            src = pkg["target"],
        )

def link_all_workspace_packages():
    """Create root node_modules links for Bazel-generated workspace packages."""
    for pkg in RELEASE_PLEASE_NPM_PACKAGES:
        npm_link_package(
            name = "node_modules/%s" % pkg["name"],
            src = pkg["pkg"],
            deps = WORKSPACE_PACKAGE_LINK_DEPS.get(pkg["name"], {}),
        )
