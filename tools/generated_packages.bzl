"Registry of all @formatjs_generated packages and linking helper."

load("@aspect_rules_js//npm:defs.bzl", "npm_link_package")

# All @formatjs_generated packages. Add new entries here when creating a new
# generated package. The "name" is the npm package suffix under the
# @formatjs_generated scope; "target" is the Bazel label of the npm_package.
GENERATED_PACKAGES = [
    # CLDR sub-packages
    # {"name": "cldr.core", "target": "//packages/generated/cldr/core:pkg"},
    # {"name": "cldr.locale", "target": "//packages/generated/cldr/locale:pkg"},
    # {"name": "cldr.number", "target": "//packages/generated/cldr/number:pkg"},
    # {"name": "cldr.supported-values", "target": "//packages/generated/cldr/supported-values:pkg"},
    # {"name": "cldr.supported-locales", "target": "//packages/generated/cldr/supported-locales:pkg"},
    # Timezone
    # {"name": "tz", "target": "//packages/generated/tz:pkg"},
    # Unicode
    # {"name": "unicode", "target": "//packages/generated/unicode:pkg"},
]

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
