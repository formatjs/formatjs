"""Optional DateTimeFormat calendars and their CLDR package/file mappings."""

CALENDAR_FILES = {
    "buddhist": ["buddhist", "buddhist"],
    "chinese": ["chinese", "chinese"],
    "coptic": ["coptic", "coptic"],
    "dangi": ["dangi", "dangi"],
    "ethioaa": ["ethiopic", "ethiopic-amete-alem"],
    "ethiopic": ["ethiopic", "ethiopic"],
    "hebrew": ["hebrew", "hebrew"],
    "indian": ["indian", "indian"],
    "islamic-civil": ["islamic", "islamic-civil"],
    "islamic-tbla": ["islamic", "islamic-tbla"],
    "islamic-umalqura": ["islamic", "islamic-umalqura"],
    "japanese": ["japanese", "japanese"],
    "persian": ["persian", "persian"],
    "roc": ["roc", "roc"],
}

CALENDARS = CALENDAR_FILES.keys()

def _calendar_registry_impl(ctx):
    ctx.actions.write(ctx.outputs.out, json.encode({
        "calendars": CALENDAR_FILES,
        "packages": sorted(ctx.attr.packages),
        "implementations": sorted([f.basename[:-3] for f in ctx.files.implementations]),
        "entrypoints": sorted([f.basename[:-3] for f in ctx.files.entrypoints]),
    }))

calendar_registry = rule(
    implementation = _calendar_registry_impl,
    attrs = {
        "implementations": attr.label_list(allow_files = True),
        "entrypoints": attr.label_list(allow_files = True),
        "out": attr.output(mandatory = True),
        "packages": attr.string_list(),
    },
)
