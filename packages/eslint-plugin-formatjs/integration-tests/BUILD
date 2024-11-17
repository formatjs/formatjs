load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:eslint/package_json.bzl", eslint_bin = "bin")

npm_link_all_packages()

eslint_bin.eslint_test(
    name = "lint_test",
    args = [
        "--config",
        "$(location eslint.config.mjs)",
    ],
    data = [
        "eslint.config.mjs",
        "fixture.ts",
        ":node_modules/eslint-plugin-formatjs",
    ],
    node_options = [
        "--experimental-vm-modules",
    ],
)
