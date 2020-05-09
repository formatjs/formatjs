load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo")
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

def _rollup_dts(ctx):
    tsconfig = ctx.actions.declare_file("tsconfig.json")
    copy_tsconfig_args = ctx.actions.args()
    copy_tsconfig_args.add_all(ctx.files.tsconfig_json + [tsconfig])
    ctx.actions.run_shell(
        outputs = [tsconfig],
        inputs = ctx.files.tsconfig_json,
        arguments = [copy_tsconfig_args],
        command = "cp -rf $1 $2",
        progress_message = "Copy tsconfig.json file to sandbox",
    )

    api_extractor_config = ctx.actions.declare_file("api-extractor.json")
    copy_api_extractor_config_args = ctx.actions.args()
    copy_api_extractor_config_args.add_all(ctx.files._api_extractor_json + [api_extractor_config])
    ctx.actions.run_shell(
        outputs = [api_extractor_config],
        inputs = ctx.files._api_extractor_json,
        arguments = [copy_api_extractor_config_args],
        command = "cp -rf $1 $2",
        progress_message = "Copy api-extractor.json file to sandbox",
    )

    deps_files_depsets = []

    for dep in ctx.attr.deps:
        # Collect whatever is in the "data"
        deps_files_depsets.append(dep.data_runfiles.files)

        # Only collect DefaultInfo files (not transitive)
        deps_files_depsets.append(dep.files)

        # Include all transitive declarations
        if DeclarationInfo in dep:
            deps_files_depsets.append(dep[DeclarationInfo].transitive_declarations)

    inputs = depset([tsconfig, api_extractor_config] + ctx.files.package_json, transitive = deps_files_depsets)
    args = ctx.actions.args()
    args.add("--config", api_extractor_config)
    ctx.actions.run(
        outputs = [ctx.outputs.out],
        inputs = inputs,
        arguments = [args],
        executable = ctx.executable._api_extractor_bin,
    )

rollup_dts = rule(
    implementation = _rollup_dts,
    attrs = {
        "out": attr.output(
            doc = "Result rollup'ed d.ts file",
            mandatory = True,
        ),
        "deps": attr.label_list(
            allow_files = True,
            doc = "List of transitive deps",
        ),
        "package_json": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
        "tsconfig_json": attr.label(
            default = Label("//:tsconfig.json"),
            allow_single_file = True,
        ),
        "_api_extractor_json": attr.label(
            default = Label("//:api-extractor.json"),
            allow_single_file = True,
        ),
        "_api_extractor_bin": attr.label(
            default = Label("//tools:api-extractor"),
            executable = True,
            cfg = "host",
        ),
    },
)
