"""Publishable calendar packages generated from shared DateTimeFormat sources."""

load("@bazel_lib//lib:copy_file.bzl", "copy_file")
load("//packages/intl-datetimeformat:calendar_registry.bzl", "CALENDARS")
load("//packages/intl-datetimeformat:locales.generated.bzl", "ALL_LOCALES")
load("//tools:compile.bzl", "formatjs_library")
load("//tools:index.bzl", "ts_run_binary")

def _calendar_source_impl(ctx):
    ctx.actions.write(ctx.outputs.out, ctx.attr.content)

_calendar_source = rule(
    implementation = _calendar_source_impl,
    attrs = {
        "content": attr.string(mandatory = True),
        "out": attr.output(mandatory = True),
    },
)

def calendar_package(calendar, version):
    """Generate one optional calendar npm package with its own release version."""
    if calendar not in CALENDARS:
        fail("Unknown calendar: %s; add it to //packages/intl-datetimeformat:calendar_registry.bzl" % calendar)
    package = "intl-datetimeformat-calendar-" + calendar
    _calendar_source(
        name = "calendar_entry",
        out = "index.ts",
        content = "export {default} from '#packages/intl-datetimeformat/calendar-data/%s.js'\n" % calendar,
    )
    copy_file(
        name = "calendar_license",
        src = "//packages/intl-datetimeformat:LICENSE.md",
        out = "LICENSE.md",
    )
    _calendar_source(
        name = "calendar_readme",
        out = "README.md",
        content = _README.format(calendar = calendar),
    )
    formatjs_library(
        name = package,
        package_name = "@formatjs/" + package,
        srcs = ["index.ts"],
        description = calendar + " calendar data for the Intl.DateTimeFormat polyfill",
        extra_npm_srcs = [":locale-data"],
        license = "MIT",
        package_peer_deps = ["//:node_modules/@formatjs/intl-datetimeformat"],
        package_types = "index.d.ts",
        repository = "formatjs/formatjs.git",
        type = "module",
        types = True,
        version = version,
        exports = {
            ".": "./index.js",
            "./locale-data/*": "./locale-data/*",
        },
        deps = [
            "//packages/intl-datetimeformat:lib",
            "//packages/intl-datetimeformat:types",
        ],
        visibility = ["//visibility:public"],
    )

    ts_run_binary(
        name = "locale-data",
        srcs = [
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
            "//packages/intl-datetimeformat:calendar_cldr_raw",
        ],
        outs = ["locale-data/%s.%s" % (locale, extension) for locale in ALL_LOCALES for extension in [
            "js",
            "d.ts",
        ]],
        args = ["--cldrFile packages/intl-datetimeformat/cldr-raw/%s.json" % locale for locale in ALL_LOCALES] + [
            "--calendar",
            calendar,
            "--outDir",
            "packages/%s/locale-data" % package,
        ],
        tool = "//packages/intl-datetimeformat/scripts:cldr",
        visibility = ["//visibility:public"],
    )

_README = """# @formatjs/intl-datetimeformat-calendar-{calendar}

Optional {calendar} calendar arithmetic and locale data for `@formatjs/intl-datetimeformat`.
Requires the DateTimeFormat polyfill's calendar registration APIs (7.7.0 or newer).

```ts
import '@formatjs/intl-datetimeformat/polyfill-force.js'
import '@formatjs/intl-datetimeformat/locale-data/en.js'
import '@formatjs/intl-datetimeformat-calendar-{calendar}'
import '@formatjs/intl-datetimeformat-calendar-{calendar}/locale-data/en.js'
```

Install only the calendars you need. Locale modules may load before or after the polyfill.
"""
