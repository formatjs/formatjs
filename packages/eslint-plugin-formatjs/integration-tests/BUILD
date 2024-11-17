load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:eslint/package_json.bzl", eslint_bin = "bin")

npm_link_all_packages()

eslint_bin.eslint_test(
    name = "lint_test",
    args = [
        "--config",
        "eslint.config.mjs",
        "fixture.js",
    ],
    chdir = package_name(),
    data = [
        "eslint.config.mjs",
        "fixture.js",
        ":node_modules/eslint-plugin-formatjs",
    ],
    expected_exit_code = 1,
    node_options = [
        "--experimental-vm-modules",
    ],
)
