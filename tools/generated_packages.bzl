"Linking helper for @formatjs_generated packages."

load("@aspect_rules_js//npm:defs.bzl", "npm_link_package")
load("//tools:generated_packages_registry.bzl", "GENERATED_PACKAGES")

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
