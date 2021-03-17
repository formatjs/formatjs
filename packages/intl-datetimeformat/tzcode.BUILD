load("@rules_cc//cc:defs.bzl", "cc_binary", "cc_library")

genrule(
    name = "version",
    srcs = [],
    outs = ["version.h"],
    cmd = "echo 'static char const PKGVERSION[]=\"(tzcode) \";\
    static char const TZVERSION[]=\"2021a\";\
    static char const REPORT_BUGS_TO[]=\"tz@iana.org\";' > $@",
)

cc_binary(
    name = "zic",
    srcs = [
        "private.h",
        "tzfile.h",
        "zic.c",
        ":version.h",
    ],
    visibility = ["@tzdata//:__pkg__"],
)

cc_library(
    name = "localtime",
    srcs = [
        "localtime.c",
        "private.h",
        "tzfile.h",
        ":version.h",
    ],
)

cc_library(
    name = "asctime",
    srcs = [
        "asctime.c",
        "private.h",
    ],
)

cc_library(
    name = "strftime",
    srcs = [
        "private.h",
        "strftime.c",
        ":version.h",
    ],
)

cc_binary(
    name = "zdump",
    srcs = [
        "private.h",
        "zdump.c",
        ":version.h",
    ],
    copts = ["-DNETBSD_INSPIRED=0"],
    visibility = ["@tzdata//:__pkg__"],
    deps = [
        ":asctime",
        ":localtime",
        ":strftime",
    ],
)
