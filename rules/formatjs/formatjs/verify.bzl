"""Rules for verifying translation file completeness and correctness.

This module provides the `formatjs_verify_test` macro for creating test targets that
verify translation files against source messages. The verification ensures translation
files are complete, don't have extra keys, and maintain structural compatibility with
the source messages.

Verification tests are essential in i18n workflows to catch translation errors early
in the development process, preventing runtime errors and ensuring translation quality.
"""

load("@rules_shell//shell:sh_test.bzl", "sh_test")

def formatjs_verify_test(
        name,
        translations,
        source_locale = None,
        check_missing_keys = True,
        check_extra_keys = True,
        check_structural_equality = True,
        expected_exit_code = 0,
        **kwargs):
    """Create a test that verifies translation files are valid and complete.

    This macro creates a test target that uses the FormatJS CLI to verify translation
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

    ## Usage Patterns

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
        tags = ["manual"],  # Don't run in default test suite
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

    On success:
    ```
    ✓ Translation verification passed
    ```

    On failure (missing keys):
    ```
    Error: Missing keys in fr.json: app.title, app.subtitle
    ```

    ## See Also

    - `formatjs_extract`: Extract source messages for verification
    - `formatjs_compile`: Compile verified translations for production use

    Args:
        name: Name of the test target. The test can be run with `bazel test //path/to:name`.

        translations: List of translation JSON files to verify. Must include the source
            locale file (typically first in the list). Can reference `formatjs_extract`
            targets directly using label syntax (`:messages`).

        source_locale: Source locale identifier (e.g., "en", "en-US"). If not provided,
            the first file in `translations` is used as the source. This parameter helps
            identify which file is the source when translations are not in alphabetical order.

        check_missing_keys: Whether to fail if translation files are missing message IDs
            that exist in the source (default: True). Disable for partial translations.

        check_extra_keys: Whether to fail if translation files contain message IDs not
            in the source (default: True). Useful for detecting stale translations.

        check_structural_equality: Whether to fail if message format structures don't
            match between source and translations (default: True). For example, if source
            has `{count, plural, ...}` but translation has plain text.

        expected_exit_code: Expected exit code from the verify command (default: 0).
            Set to 1 for negative tests that expect verification to fail. Useful for
            testing that incomplete translations are properly detected.

        **kwargs: Additional arguments passed to the underlying `sh_test` rule, such as
            `size`, `timeout`, `tags`, or `visibility`.
    """

    # Build verify command arguments
    verify_flags = []
    if source_locale:
        verify_flags.append("--source-locale")
        verify_flags.append(source_locale)
    if check_missing_keys:
        verify_flags.append("--missing-keys")
    if check_extra_keys:
        verify_flags.append("--extra-keys")
    if check_structural_equality:
        verify_flags.append("--structural-equality")

    flags_str = " ".join(verify_flags)

    # Create the test script content with all translation files as arguments
    file_args = " ".join(["$$TRANS_FILE_%d" % i for i in range(len(translations))])

    # Handle expected exit codes
    if expected_exit_code == 0:
        # Normal case: expect success
        script_content = """#!/bin/bash
set -euo pipefail
export BAZEL_BINDIR=.
$$FORMATJS_CLI verify {flags} {args}
echo "✓ Translation verification passed"
""".format(flags = flags_str, args = file_args)
    else:
        # Negative test case: expect failure with specific exit code
        script_content = """#!/bin/bash
set -uo pipefail
export BAZEL_BINDIR=.
set +e
$$FORMATJS_CLI verify {flags} {args}
ACTUAL_EXIT_CODE=$$?
set -e

if [ $$ACTUAL_EXIT_CODE -eq {expected_code} ]; then
    echo "✓ Translation verification failed as expected (exit code {expected_code})"
    exit 0
else
    echo "✗ Expected exit code {expected_code}, but got $$ACTUAL_EXIT_CODE"
    exit 1
fi
""".format(flags = flags_str, args = file_args, expected_code = expected_exit_code)

    script_name = name + "_test.sh"
    native.genrule(
        name = name + "_script",
        outs = [script_name],
        cmd = "cat > $@ << 'EOF'\n%s\nEOF\nchmod +x $@" % script_content,
    )

    # Set up env vars for the test
    env_vars = {
        "FORMATJS_CLI": "$(rootpath @rules_formatjs//formatjs_cli:cli)",
    }
    for i, t in enumerate(translations):
        env_vars["TRANS_FILE_%d" % i] = "$(rootpath %s)" % t

    sh_test(
        name = name,
        srcs = [script_name],
        data = translations + ["@rules_formatjs//formatjs_cli:cli"],
        env = env_vars,
        **kwargs
    )
