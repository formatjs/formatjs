load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo", "LinkablePackageInfo")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary", "npm_package_bin")
load("@npm_bazel_typescript//:index.bzl", "ts_project")
load("@build_bazel_rules_nodejs//internal/golden_file_test:golden_file_test.bzl", "golden_file_test")
load("@bazel_skylib//rules:copy_file.bzl", "copy_file")

def _generate_package_json(ctx):
    "A macro to generate package.json file"
    args = ctx.actions.args()
    args.add_all("--template", ctx.files._template)
    args.add("--name", ctx.attr.module_name)
    args.add("--out", ctx.outputs.out)
    args.add("--description", ctx.attr.description)
    args.add("--license", ctx.attr.license)
    ctx.actions.run(
        outputs = [ctx.outputs.out],
        inputs = ctx.files._template,
        arguments = [args],
        executable = ctx.executable._generate,
    )

generate_package_json = rule(
    implementation = _generate_package_json,
    attrs = {
        "out": attr.output(
            doc = "Result package.json",
            mandatory = True,
        ),
        "module_name": attr.string(mandatory = True),
        "description": attr.string(mandatory = True),
        "license": attr.string(default = "MIT"),
        "_template": attr.label(
            default = Label("//tools:package.template.json"),
            allow_single_file = True,
        ),
        "_generate": attr.label(
            default = Label("//tools:generate-package-json"),
            executable = True,
            cfg = "host",
        ),
    },
)

def rollup_dts(name, package_json, outs):
    copy_file(
        name = "%s-extractor-config-copy" % name,
        src = "//:api-extractor.json",
        out = "api-extractor.json",
    )

    copy_file(
        name = "%s-tsconfig-copy" % name,
        src = "//:tsconfig.json",
        out = "tsconfig.json",
    )

    npm_package_bin(
        name = name,
        tool = "@npm//@microsoft/api-extractor/bin:api-extractor",
        package = "@microsoft/api-extractor",
        package_bin = "api-extractor",
        data = [
            ":api-extractor.json",
            package_json,
            ":tsconfig.json",
            ":lib",
        ],
        outs = outs,
        args = ["run --local --config $(execpath :api-extractor.json)"],
    )

def cldr_gen(name, **kwargs):
    ts_project(
        name = "%s-lib" % name,
        srcs = [
            "scripts/%s.ts" % name,
        ],
        declaration=True,
        source_map=True,
        **kwargs
    )

    nodejs_binary(
        name = "%s-bin" % name,
        entry_point = ":scripts/%s.js" % name,
    )

    native.genrule(
        name = "%s-gen" % name,
        outs = [
            "generated/%s.ts" % name,
        ],
        cmd = "$(location %s-bin) --out $@" % name,
        tools = [":%s-bin" % name],
    )

    golden_file_test(
        name = name,
        actual = "generated/%s.ts" % name,
        golden = "src/%s.ts" % name,
    )

# From https://github.com/bazelbuild/rules_nodejs/issues/1830
# From https://github.com/bazelbuild/rules_nodejs/blob/master/internal/js_library/js_library.bzl
# js_library still doesn't quite do what we want :( so this is a tweak of that
def _ts_monorepo_subpackage_impl(ctx):
    ts_project = ctx.attr.ts_project
    ts_project_files = ts_project[DefaultInfo].files.to_list() + ts_project[DeclarationInfo].declarations.to_list()
    files = []

    is_all_sources = ts_project_files[0].is_source
    for src in ts_project_files:
        if src.is_source:
            dst = ctx.actions.declare_file(src.basename, sibling = src)
            copy_file(ctx, src, dst)
            files.append(dst)
        else:
            files.append(src)

    files_depset = depset(files)

    result = [
        DefaultInfo(
            files = files_depset,
            runfiles = ctx.runfiles(files = ts_project_files),
        ),
        ts_project[DeclarationInfo],
    ]

    path = "/".join([p for p in [ctx.bin_dir.path, ctx.label.workspace_root, ctx.label.package] if p])
    result.append(LinkablePackageInfo(
        package_name = ctx.attr.package_name,
        path = path,
        files = files_depset,
    ))
    return result

_ts_monorepo_subpackage = rule(
    _ts_monorepo_subpackage_impl,
    attrs = {
        "package_name": attr.string(
            mandatory = True,
            doc = "Package name in package.json",
        ),
        "ts_project": attr.label(
            mandatory = True,
            doc = "Label for ts_project",
        ),
    },
)

def ts_monorepo_subpackage(
        name,
        package_name = "",
        **kwargs):
    if package_name:
        ts_project(
            name = "%s-lib" % name,
            **kwargs
        )
        _ts_monorepo_subpackage(
            name = name,
            ts_project = ":%s-lib" % name,
            package_name = package_name,
        )
    else:
        ts_project(
            name = name,
            **kwargs
        )
