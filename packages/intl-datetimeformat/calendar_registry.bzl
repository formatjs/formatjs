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
    content = json.encode({"calendars": CALENDAR_FILES, "packages": sorted(ctx.attr.packages)})
    if ctx.attr.typescript:
        content = "export const calendarFiles: Record<string, [string, string]> = %s;\nexport const calendars: string[] = Object.keys(calendarFiles);\n" % json.encode(CALENDAR_FILES)
    ctx.actions.write(ctx.outputs.out, content)

calendar_registry = rule(
    implementation = _calendar_registry_impl,
    attrs = {
        "out": attr.output(mandatory = True),
        "packages": attr.string_list(),
        "typescript": attr.bool(),
    },
)
