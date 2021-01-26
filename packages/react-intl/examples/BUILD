load("@npm//parcel:index.bzl", "parcel")

parcel(
    name = "examples",
    data = glob(["**/*"]) + [
        "//packages/ecma402-abstract:dist",
        "//packages/intl-datetimeformat:add-all-tz",
        "//packages/intl-datetimeformat:dist",
        "//packages/intl-datetimeformat:locale-data",
        "//packages/intl-getcanonicallocales:dist",
        "//packages/intl-locale:dist",
        "//packages/intl-messageformat-parser:dist",
        "//packages/intl-messageformat:dist",
        "//packages/intl-numberformat:dist",
        "//packages/intl-numberformat:locale-data",
        "//packages/intl-pluralrules",
        "//packages/react-intl:dist",
        "@npm//core-js",
    ],
    templated_args = [
        "--log-level",
        "verbose",
        "-p",
        "3000",
        "$(rootpath index.html)",
    ],
)
