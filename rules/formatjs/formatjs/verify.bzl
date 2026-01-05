"""Rules for verifying message translations using FormatJS CLI"""

def formatjs_verify_test(
        name,
        translations,
        source_locale = None,
        check_missing_keys = True,
        check_extra_keys = True,
        check_structural_equality = True,
        expected_exit_code = 0,
        **kwargs):
    """Verify that translation files are valid and complete.

    This test rule uses the formatjs CLI's verify command to check that:
    - All message IDs in the source locale exist in translation files (if check_missing_keys=True)
    - Translation files don't contain extra message IDs (if check_extra_keys=True)
    - Message formats are structurally valid (if check_structural_equality=True)

    The translations list must include the source locale file. The source locale is identified
    either by the source_locale parameter (e.g., "en") or defaults to the first file in the list.

    Args:
        name: Name of the test target
        translations: List of translation JSON files to verify (must include source locale)
        source_locale: Source locale identifier (e.g., "en"). If not provided, uses the first file.
        check_missing_keys: Whether to check for missing keys in target locale (default: True)
        check_extra_keys: Whether to check for extra keys in target locale (default: True)
        check_structural_equality: Whether to check structural equality of messages (default: True)
        expected_exit_code: Expected exit code from the verify command (default: 0 for success, 1 for expected failures)
        **kwargs: Additional arguments passed to the underlying test rule
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

    native.sh_test(
        name = name,
        srcs = [script_name],
        data = translations + ["@rules_formatjs//formatjs_cli:cli"],
        env = env_vars,
        **kwargs
    )
