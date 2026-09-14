"""Pinned Playwright 1.63 browser archives for the editor's host tests."""

_BROWSER_VERSION = "153.0.8010.12"
_ARCHIVES = {
    "linux": (
        "linux64/chrome-headless-shell-linux64.zip",
        "sha256-qdoCiGGgz3if8lwv7UX18ar5ae2SR4NbanghpPevnR0=",
        "linux",
        "sha256-68dPxblIMBdqPCkUrpa9i8f2qR9PM4kCMPhKFy7mHMw=",
    ),
    "macos": (
        "mac-arm64/chrome-headless-shell-mac-arm64.zip",
        "sha256-idgKbSbM0Mz9UeItnhKXKDhirysM2R3OB0WbNcoAWfI=",
        "mac",
        "sha256-F+0Vovpg08dBgb78sr33ybsojRmyo7mJO5S2PyziYOQ=",
    ),
}

def _host_browsers_impl(ctx):
    chromium, chromium_integrity, ffmpeg, ffmpeg_integrity = _ARCHIVES[ctx.attr.platform]
    ctx.download_and_extract(
        url = "https://cdn.playwright.dev/builds/cft/%s/%s" % (_BROWSER_VERSION, chromium),
        integrity = chromium_integrity,
        output = "chromium_headless_shell-1243",
    )
    ctx.download_and_extract(
        url = "https://cdn.playwright.dev/dbazure/download/playwright/builds/ffmpeg/1011/ffmpeg-%s.zip" % ffmpeg,
        integrity = ffmpeg_integrity,
        output = "ffmpeg-1011",
    )
    ctx.file("BUILD.bazel", '''
load("@bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
copy_to_directory(
    name = "browsers",
    srcs = glob(["chromium_headless_shell-1243/**", "ffmpeg-1011/**"]),
    root_paths = ["."],
    include_external_repositories = ["*"],
    visibility = ["//visibility:public"],
)
''')

host_browsers = repository_rule(
    implementation = _host_browsers_impl,
    attrs = {"platform": attr.string(mandatory = True, values = ["linux", "macos"])},
)
