"Custom macro"

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin")
load("@npm//@microsoft/api-extractor:index.bzl", "api_extractor")

def rollup_dts(name, package_name, package_json, types):
    """Macro for @microsoft/api-extractor.

    Args:
        name: target name
        package_name: package name from package.json
        package_json: package.json file
        types: filegroup that contains generated d.ts
    """
    native.genrule(
        name = "copy-tsconfig-%s" % package_name,
        srcs = ["//:tsconfig.json"],
        outs = ["tsconfig.json"],
        cmd = "cp $< $@",
    )

    native.genrule(
        name = "copy-api-extractor-%s" % package_name,
        srcs = ["//:api-extractor.json"],
        outs = ["api-extractor.json"],
        cmd = "cp $< $@",
    )

    copy_to_bin(
        name = "copy-package-json-%s" % package_name,
        srcs = [package_json],
    )

    api_extractor(
        name = name,
        outs = ["%s.d.ts" % package_name],
        args = [
            "run",
            "--local",
            "-c",
            "$(@D)/api-extractor.json",
        ],
        data = [
            "api-extractor.json",
            "tsconfig.json",
            ":copy-package-json-%s" % package_name,
            "//:setup-api-extractor",
        ] + types,
    )
