"""Expose local source names without exporting source files."""

def _source_inventory_impl(ctx):
    ctx.actions.write(ctx.outputs.out, json.encode(sorted(ctx.attr.names)))

source_inventory = rule(
    implementation = _source_inventory_impl,
    attrs = {
        "names": attr.string_list(mandatory = True),
        "out": attr.output(mandatory = True),
    },
)
