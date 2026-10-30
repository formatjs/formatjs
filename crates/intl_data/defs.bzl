"""Prepare selected locale records with the owning Rust crate on the execution platform."""

load("//packages/intl-numberformat:locales.generated.bzl", "ALL_LOCALES")

LocaleSelectionInfo = provider(fields = ["value"])

def _locales_impl(ctx):
    return [LocaleSelectionInfo(value = ctx.build_setting_value)]

locales = rule(implementation = _locales_impl, build_setting = config.string_list(flag = True))

def _compile_impl(ctx):
    module = ctx.actions.declare_file(ctx.label.name + ".rs")
    packs = ctx.actions.declare_directory(ctx.label.name + ".packs")
    args = ctx.actions.args()
    args.add("--module", module)
    args.add("--packs", packs.path)
    args.add("--type", ctx.attr.data_type)
    args.add_all(ctx.attr._locales[LocaleSelectionInfo].value, before_each = "--locale")
    args.add_all(ctx.attr._known_locales, before_each = "--known-locale")
    args.add_all(ctx.files.srcs, before_each = "--input")
    args.add_all(ctx.files.patches, before_each = "--patch")
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")
    ctx.actions.run(
        executable = ctx.executable.tool,
        inputs = ctx.files.srcs + ctx.files.patches,
        outputs = [module, packs],
        arguments = [args],
        mnemonic = "CompileIntlLocaleData",
        progress_message = "Compile Rust locale data %{label}",
    )
    return [DefaultInfo(files = depset([module, packs])), OutputGroupInfo(module = depset([module]))]

compiled_locale_data = rule(
    implementation = _compile_impl,
    attrs = {
        "srcs": attr.label_list(allow_files = True, cfg = "exec"),
        "patches": attr.label_list(allow_files = True, cfg = "exec"),
        "tool": attr.label(executable = True, cfg = "exec", mandatory = True),
        "data_type": attr.string(mandatory = True),
        "_locales": attr.label(default = "//crates/intl_data:locales"),
        "_known_locales": attr.string_list(default = ALL_LOCALES),
    },
)

def _compiled_impl(ctx):
    return []

compiled_data = rule(implementation = _compiled_impl, build_setting = config.bool(flag = True))
