# formatjs_verify_test Tests

This directory contains comprehensive tests for the `formatjs_verify_test` rule.

## Test Files

- **en.json**: Source locale with 3 messages (greeting, farewell, count)
- **es.json**: Complete Spanish translation
- **fr.json**: Complete French translation
- **de_missing_keys.json**: German translation missing the "count" key
- **it_extra_keys.json**: Italian translation with an extra "extra_key" key
- **ja_invalid_format.json**: Japanese translation with structurally incorrect messages

## Test Cases

### Passing Tests (run with `bazel test //tests_verify:all`)

1. **test_valid_translations**: Verifies that complete, valid translations pass all checks
   - Tests: en.json, es.json, fr.json
   - Expected: ✅ Pass

2. **test_only_missing_keys**: Tests that we can selectively check only for missing keys
   - Tests: en.json, it_extra_keys.json (has extra keys)
   - Checks: `check_missing_keys=True`, others disabled
   - Expected: ✅ Pass (extra keys ignored)

3. **test_only_extra_keys**: Tests that we can selectively check only for extra keys
   - Tests: en.json, de_missing_keys.json (missing keys)
   - Checks: `check_extra_keys=True`, others disabled
   - Expected: ✅ Pass (missing keys ignored)

4. **test_no_checks**: Tests that disabling all checks allows any translations
   - Tests: en.json, de_missing_keys.json, it_extra_keys.json
   - Checks: All disabled
   - Expected: ✅ Pass

5. **test_multiple_translations**: Verifies checking multiple translations at once
   - Tests: en.json, es.json, fr.json
   - Expected: ✅ Pass

6. **test_with_source_locale**: Tests explicit source_locale parameter
   - Tests: en.json, es.json, fr.json
   - Expected: ✅ Pass

### Negative Tests (use `expected_exit_code=1`)

These tests verify error detection by expecting the formatjs verify command to fail:

7. **test_missing_keys_fails**: Verifies detection of missing translation keys
   - Tests: en.json, de_missing_keys.json
   - Expected exit code: 1
   - Output: "Missing translation keys for locale de_missing_keys: count"
   - Result: ✅ Pass (failure detected correctly)

8. **test_extra_keys_fails**: Verifies detection of extra translation keys
   - Tests: en.json, it_extra_keys.json
   - Expected exit code: 1
   - Output: "Extra translation keys for locale it_extra_keys: extra_key"
   - Result: ✅ Pass (failure detected correctly)

9. **test_invalid_format_fails**: Verifies detection of structural format mismatches
   - Tests: en.json, ja_invalid_format.json
   - Expected exit code: 1
   - Output: "These translation keys for locale ja_invalid_format are structurally different from en"
   - Result: ✅ Pass (failure detected correctly)

## Running Tests

```bash
# Run all tests (including negative tests)
bazel test //tests_verify:all

# Run a specific test
bazel test //tests_verify:test_valid_translations

# Run a negative test with verbose output
bazel test //tests_verify:test_missing_keys_fails --test_output=all
bazel test //tests_verify:test_extra_keys_fails --test_output=all
bazel test //tests_verify:test_invalid_format_fails --test_output=all
```

## Test Coverage

These tests verify:

- ✅ Complete, valid translations pass verification
- ✅ Missing keys are detected (using `expected_exit_code=1`)
- ✅ Extra keys are detected (using `expected_exit_code=1`)
- ✅ Structural format mismatches are detected (using `expected_exit_code=1`)
- ✅ Individual checks can be enabled/disabled independently
- ✅ Multiple translations can be verified simultaneously
- ✅ Source locale parameter works correctly
- ✅ The `expected_exit_code` parameter allows testing for expected failures

## Using `expected_exit_code`

The `expected_exit_code` parameter allows you to write tests that verify translations **should** fail validation:

```starlark
# Test that incomplete translations are properly detected
formatjs_verify_test(
    name = "test_incomplete_translation",
    source_locale = "en",
    translations = [
        "en.json",
        "incomplete.json",  # Missing some keys
    ],
    expected_exit_code = 1,  # We expect this to fail
    formatjs_cli = "//:formatjs_cli",
)
```

When `expected_exit_code` is set to a non-zero value:

- The test **passes** if the verify command exits with that code
- The test **fails** if the verify command exits with a different code
- Error messages from the verify command are still displayed
