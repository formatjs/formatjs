load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:index.bzl", "generate_src_file")

npm_link_all_packages(name = "node_modules")

TEST_CASES = glob(["test_cases/*"])

# [ts_script(
#     name = "gen_parser_test_%s" % f.split("/")[-1],
#     outs = ["%s.tmp" % f.split("/")[-1]],
#     args = [
#         "--input",
#         f
#     ],
#     data = [
#         ":node_modules/@formatjs/icu-messageformat-parser",
#         "//:node_modules/lodash",
#         f
#     ],
#     entry_point = "run-parser.ts",
# ) for f in TEST_CASES]

[generate_src_file(
    name = "gen_parser_test_%s" % f.split("/")[-1],
    src = f,
    args = [
        "--input %s/%s" % (
            package_name(),
            f,
        ),
    ],
    data = [
        ":node_modules/@formatjs/icu-messageformat-parser",
        "//:node_modules/lodash",
        f,
    ],
    entry_point = "run-parser.ts",
) for f in TEST_CASES]
