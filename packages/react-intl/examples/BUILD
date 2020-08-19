load("@npm//parcel:index.bzl", "parcel")

parcel(
    name = "examples",
    data = glob(["**/*"]) + [
        "//packages/react-intl:dist",
        "//packages/intl-messageformat:dist",
        "//packages/intl-messageformat-parser:dist",
        "//packages/ecma402-abstract:dist",
        "//packages/intl-pluralrules",
        "@npm//core-js",
    ],
    templated_args = [
        "--log-level",
        "verbose",
        "$(rootpath index.html)",
    ],
)
