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
        name = "locale-data-json",
        srcs = [
            "//:node_modules/fs-extra",
            "//:node_modules/minimist",
            "//packages/intl-datetimeformat:calendar_cldr_raw",
        ],
        outs = ["locale-data-json/%s.json" % locale for locale in ALL_LOCALES],
        args = ["--cldrFile packages/intl-datetimeformat/cldr-raw/%s.json" % locale for locale in ALL_LOCALES] + [
            "--calendar",
            calendar,
            "--outDir",
            "packages/%s/locale-data-json" % package,
        ],
        tool = "//packages/intl-datetimeformat/scripts:cldr-calendar",
        visibility = ["//visibility:public"],
    )

    ts_run_binary(
        name = "locale-data",
        srcs = [":locale-data-json"],
        outs = ["locale-data/%s.%s" % (locale, extension) for locale in ALL_LOCALES for extension in ["js", "d.ts"]],
        args = ["--input packages/%s/locale-data-json/%s.json" % (package, locale) for locale in ALL_LOCALES] + [
            "--outDir",
            "packages/%s/locale-data" % package,
            "--method",
            "__addCalendarLocaleData",
            "--queue",
            "__FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__",
        ],
        tool = "//packages/intl-datetimeformat/scripts:emit-locale-data",
        visibility = ["//visibility:public"],
    )

_README = """# @formatjs/intl-datetimeformat-calendar-{calendar}

See [Optional calendars](https://formatjs.io/docs/polyfills/intl-datetimeformat/#optional-calendars).
"""
