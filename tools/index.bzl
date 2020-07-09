"Custom macro"

load("@build_bazel_rules_nodejs//:index.bzl", "copy_to_bin", "generated_file_test")
load("@npm//@microsoft/api-extractor:index.bzl", "api_extractor")
load("@npm//ts-node:index.bzl", "ts_node")

def generate_src_file(name, args, data, src):
    """Generate a source file.

    Args:
        name: target name
        args: args to generate src file binary
        data: dependent data labels
        src: src file to generate
    """
    tmp_filename = "%s-gen.tmp" % name
    ts_node(
        name = tmp_filename[:tmp_filename.rindex(".")],
        outs = [tmp_filename],
        args = args,
        data = data,
    )

    generated_file_test(
        name = name,
        src = src,
        generated = tmp_filename,
    )

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
