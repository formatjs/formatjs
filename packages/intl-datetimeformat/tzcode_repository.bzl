"""Repository rule for the pinned IANA tzcode sources."""

def _tzcode_repository_impl(ctx):
    ctx.download_and_extract(
        url = ctx.attr.urls,
        sha256 = ctx.attr.sha256,
    )

    version = ctx.read(ctx.path("version")).strip()
    ctx.file(
        "tzdir.h",
        content = """#ifndef TZDEFAULT
# define TZDEFAULT \"/etc/localtime\" /* default zone */
#endif
#ifndef TZDIR
# define TZDIR \"/usr/share/zoneinfo\" /* TZif directory */
#endif
""",
    )
    ctx.file(
        "version.h",
        content = """static char const PKGVERSION[]=\"(tzcode) \";
static char const TZVERSION[]=\"%s\";
static char const REPORT_BUGS_TO[]=\"tz@iana.org\";
""" % version,
    )
    ctx.file(
        "BUILD.bazel",
        content = ctx.read(ctx.path(ctx.attr.build_file)),
    )

tzcode_repository = repository_rule(
    implementation = _tzcode_repository_impl,
    attrs = {
        "build_file": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
        "sha256": attr.string(mandatory = True),
        "urls": attr.string_list(mandatory = True),
    },
)
