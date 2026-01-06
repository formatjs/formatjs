"""Rules for verifying translation file completeness and correctness.

This module provides the `formatjs_verify_test` rule for creating test targets that
verify translation files against source messages. The verification ensures translation
files are complete, don't have extra keys, and maintain structural compatibility with
the source messages.

Verification tests are essential in i18n workflows to catch translation errors early
in the development process, preventing runtime errors and ensuring translation quality.

For more information about the FormatJS CLI and its verification features, see:
https://formatjs.github.io/docs/tooling/cli
"""

def _formatjs_verify_test_impl(ctx):
    """Implementation of the formatjs_verify_test rule."""

    # Get the FormatJS CLI toolchain
    toolchain = ctx.toolchains["@rules_formatjs//formatjs_cli:toolchain_type"]
    formatjs_cli = toolchain.formatjs_cli_info.cli

    # Create a wrapper script
    script = ctx.actions.declare_file(ctx.label.name + ".sh")

    # Build command args
    cmd_args = ["verify"]
    if ctx.attr.source_locale:
        cmd_args.extend(["--source-locale", ctx.attr.source_locale])
    if ctx.attr.check_missing_keys:
        cmd_args.append("--missing-keys")
    if ctx.attr.check_extra_keys:
        cmd_args.append("--extra-keys")
    if ctx.attr.check_structural_equality:
        cmd_args.append("--structural-equality")

    for trans_file in ctx.files.translations:
        cmd_args.append(trans_file.short_path)

    cli_path = formatjs_cli.short_path

    # Create script that runs the verify command
    expected_code = ctx.attr.expected_exit_code
    if expected_code == 0:
        # Normal case: fail if CLI fails
        script_content = """#!/bin/bash
set -euo pipefail
exec "{cli}" {args}
""".format(
            cli = cli_path,
            args = " ".join(['"%s"' % arg for arg in cmd_args]),
        )
    else:
        # Negative test: expect CLI to fail with specific exit code
        script_content = """#!/bin/bash
set -uo pipefail
"{cli}" {args}
actual_exit=$?
if [ $actual_exit -eq {expected} ]; then
    exit 0
else
    echo "Expected exit code {expected} but got $actual_exit" >&2
    exit 1
fi
""".format(
            cli = cli_path,
            args = " ".join(['"%s"' % arg for arg in cmd_args]),
            expected = expected_code,
        )

    ctx.actions.write(
        output = script,
        content = script_content,
        is_executable = True,
    )

    # Create runfiles with the CLI and translation files
    runfiles = ctx.runfiles(
        files = ctx.files.translations + [formatjs_cli],
    )

    return [
        DefaultInfo(
            executable = script,
            runfiles = runfiles,
        ),
        testing.ExecutionInfo({
            "requires-network": "0",
        }),
    ]

formatjs_verify_test = rule(
    implementation = _formatjs_verify_test_impl,
    attrs = {
        "translations": attr.label_list(
            allow_files = [".json"],
            mandatory = True,
            doc = """List of translation JSON files to verify.

            Must include the source locale file (typically first in the list).
            Can reference `formatjs_extract` targets directly using label syntax (`:messages`).

            Example:
            ```starlark
            translations = [
                "messages/en.json",  # source locale
                "messages/fr.json",
                "messages/es.json",
            ]
            ```
            """,
        ),
        "source_locale": attr.string(
            doc = """Source locale identifier (e.g., 'en', 'en-US').

            If not provided, the first file in `translations` is used as the source.
            This parameter helps identify which file is the source when translations
            are not in alphabetical order.
            """,
        ),
        "check_missing_keys": attr.bool(
            default = True,
            doc = """Whether to fail if translation files are missing message IDs that exist in the source.

            Disable for partial translations. Default: True.
            """,
        ),
        "check_extra_keys": attr.bool(
            default = True,
            doc = """Whether to fail if translation files contain message IDs not in the source.

            Useful for detecting stale translations. Default: True.
            """,
        ),
        "check_structural_equality": attr.bool(
            default = True,
            doc = """Whether to fail if message format structures don't match between source and translations.

            For example, if source has `{count, plural, ...}` but translation has plain text.
            Default: True.
            """,
        ),
        "expected_exit_code": attr.int(
            default = 0,
            doc = """Expected exit code from the verify command.

            Set to 1 for negative tests that expect verification to fail.
            Useful for testing that incomplete translations are properly detected.
            Default: 0 (expect success).
            """,
        ),
    },
    test = True,
    toolchains = ["@rules_formatjs//formatjs_cli:toolchain_type"],
    doc = """Test rule that verifies translation files are valid and complete.

    This rule creates a test target that uses the FormatJS CLI to verify translation
    files against a source locale. It can detect missing translations, extra keys, and
    structural mismatches in ICU MessageFormat strings.

    ## Verification Checks

    The test performs the following checks (each can be enabled/disabled):

    - **Missing Keys** (`check_missing_keys`): Ensures all message IDs in the source
      locale exist in translation files. Missing keys indicate incomplete translations.

    - **Extra Keys** (`check_extra_keys`): Detects message IDs in translation files
      that don't exist in the source. Extra keys may indicate outdated translations.

    - **Structural Equality** (`check_structural_equality`): Validates that ICU
      MessageFormat syntax is compatible between source and translations. For example,
      if source uses `{count, plural, ...}`, translation must too.

    ## Usage Examples

    ### Basic verification of translations:
    ```starlark
    formatjs_verify_test(
        name = "verify_translations",
        translations = [
            "messages/en.json",  # source locale (first file)
            "messages/fr.json",
            "messages/es.json",
        ],
    )
    ```

    ### Specify source locale explicitly:
    ```starlark
    formatjs_verify_test(
        name = "verify_translations",
        translations = [
            "messages/en.json",
            "messages/fr.json",
            "messages/de.json",
        ],
        source_locale = "en",
    )
    ```

    ### Only check for missing keys:
    ```starlark
    formatjs_verify_test(
        name = "check_complete",
        translations = [
            ":messages",  # extracted source messages
            "translations/fr.json",
        ],
        check_missing_keys = True,
        check_extra_keys = False,
        check_structural_equality = False,
    )
    ```

    ### Negative test - expect validation to fail:
    ```starlark
    formatjs_verify_test(
        name = "test_incomplete_translations_fail",
        translations = [
            "test_data/en.json",
            "test_data/incomplete-fr.json",
        ],
        expected_exit_code = 1,  # Expect failure
    )
    ```

    ## Integration with Extraction

    Use with `formatjs_extract` to verify translations against extracted messages:
    ```starlark
    formatjs_extract(
        name = "source_messages",
        srcs = glob(["src/**/*.tsx"]),
    )

    formatjs_verify_test(
        name = "verify_fr",
        translations = [
            ":source_messages",
            "translations/fr.json",
        ],
    )
    ```

    ## Test Output

    The FormatJS CLI provides detailed error messages about any verification failures,
    including which keys are missing or extra, and what structural differences exist.

    ## See Also

    - `formatjs_extract`: Extract source messages for verification
    - `formatjs_compile`: Compile verified translations for production use
    - `formatjs_aggregate`: Aggregate messages from multiple sources
    - FormatJS CLI documentation: https://formatjs.github.io/docs/tooling/cli
    """,
)
