load("@package_metadata//licenses/rules:license.bzl", "license")
load("@package_metadata//purl:purl.bzl", "purl")
load("@package_metadata//rules:package_metadata.bzl", "package_metadata")

package_metadata(
    name = "package_metadata",
    purl = purl.bazel(
        module_name(),
        module_version(),
    ),
    visibility = ["//visibility:public"],
)

license(
    name = "license",
    kind = "@package_metadata//licenses/spdx:Apache-2.0",
    text = "LICENSE",
)
