"""Build definitions for intl-datetimeformat package."""

load("@rules_cc//cc:find_cc_toolchain.bzl", "find_cc_toolchain", "use_cc_toolchain")
load("//packages/intl-datetimeformat:defs.bzl", "ZONES")
load("//packages/intl-datetimeformat:hermetic_llvm.bzl", "with_hermetic_llvm")

ZIC_FILES = [
    "africa",
    "antarctica",
    "asia",
    "australasia",
    "etcetera",
    "europe",
    "northamerica",
    "southamerica",
]

_NODE_TOOLCHAIN_TYPE = "@rules_nodejs//nodejs:toolchain_type"

def _hermetic_llvm_toolchain_contract_impl(ctx):
    cc_toolchain = find_cc_toolchain(ctx)
    if cc_toolchain.compiler != "clang" or "llvm_toolchains" not in cc_toolchain.toolchain_id:
        fail("timezone tools require hermetic LLVM, got compiler=%s toolchain_id=%s" % (
            cc_toolchain.compiler,
            cc_toolchain.toolchain_id,
        ))

    return []

_hermetic_llvm_toolchain_contract = rule(
    implementation = _hermetic_llvm_toolchain_contract_impl,
    toolchains = use_cc_toolchain(),
)

_hermetic_llvm_toolchain_contract_with_cfg, _hermetic_llvm_toolchain_contract_with_cfg_internal = with_hermetic_llvm(
    _hermetic_llvm_toolchain_contract,
)

def _generate_tz_data_impl(ctx):
    outputs = []
    zones = []
    for zone in ctx.attr.zones:
        output = ctx.actions.declare_file("%s/zdump/%s" % (ctx.attr.output_dir, zone))
        outputs.append(output)
        zones.append({
            "name": zone,
            "output": output.path,
        })

    manifest = ctx.actions.declare_file("%s_manifest.json" % ctx.label.name)
    backward = ctx.actions.declare_file("%s/backward" % ctx.attr.output_dir)
    ctx.actions.write(
        output = manifest,
        content = json.encode({
            "backward": {
                "output": backward.path,
                "source": ctx.file.backward.path,
            },
            "sources": [ctx.file.backward.path] + [source.path for source in ctx.files.srcs],
            "zones": zones,
        }),
    )

    work_dir = ctx.actions.declare_directory("%s_work" % ctx.label.name)
    node = ctx.toolchains[_NODE_TOOLCHAIN_TYPE].nodeinfo.node
    ctx.actions.run(
        executable = node,
        arguments = [
            "--disable-warning=ExperimentalWarning",
            "--experimental-transform-types",
            ctx.file._generator.path,
            manifest.path,
            ctx.executable._zic.path,
            ctx.executable._zdump.path,
            work_dir.path,
        ],
        inputs = depset(ctx.files.srcs + [ctx.file.backward, ctx.file._generator, manifest]),
        outputs = outputs + [backward, work_dir],
        tools = [
            ctx.attr._zdump[DefaultInfo].files_to_run,
            ctx.attr._zic[DefaultInfo].files_to_run,
        ],
        mnemonic = "GenerateTimezoneData",
        progress_message = "Generating IANA timezone data",
    )

    return [
        DefaultInfo(files = depset(outputs + [backward])),
        OutputGroupInfo(
            backward = depset([backward]),
            zdumps = depset(outputs),
        ),
    ]

_generate_tz_data = rule(
    implementation = _generate_tz_data_impl,
    attrs = {
        "backward": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
        "llvm_toolchain_contract": attr.label(
            cfg = "exec",
            mandatory = True,
        ),
        "output_dir": attr.string(mandatory = True),
        "srcs": attr.label_list(
            allow_files = True,
            mandatory = True,
        ),
        "zones": attr.string_list(mandatory = True),
        "_generator": attr.label(
            allow_single_file = [".ts"],
            default = "//packages/intl-datetimeformat/tzdata:generator.ts",
        ),
        "_zdump": attr.label(
            cfg = "exec",
            default = "@iana_tzcode//:zdump",
            executable = True,
        ),
        "_zic": attr.label(
            cfg = "exec",
            default = "@iana_tzcode//:zic",
            executable = True,
        ),
    },
    toolchains = [_NODE_TOOLCHAIN_TYPE],
)

def generate_tz_data(name):
    """Generate zdump data with execution tools pinned to hermetic LLVM."""
    contract_name = "%s_llvm_toolchain" % name
    _hermetic_llvm_toolchain_contract_with_cfg(
        name = contract_name,
    )
    _generate_tz_data(
        name = name,
        backward = "@iana_tzdata//:backward",
        llvm_toolchain_contract = ":%s" % contract_name,
        output_dir = name,
        srcs = ["@iana_tzdata//:%s" % zic_file for zic_file in ZIC_FILES],
        zones = ZONES,
    )
