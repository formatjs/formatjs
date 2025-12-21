//! Integration tests for ICU MessageFormat Parser
//!
//! This test suite reads test case files from the integration-tests/test_cases directory
//! and validates that the Rust parser produces the same output as the TypeScript parser.
//!
//! Each test case file has the format:
//! ```
//! <message string>
//! ---
//! <parser options JSON>
//! ---
//! <expected output JSON>
//! ```

use icu_messageformat_parser::{Parser, ParserOptions, Locale};
use serde_json::Value;
use std::fs;
use std::path::Path;

/// Reads a test case file and returns (message, options, expected_output)
fn read_test_case(path: &Path) -> (String, Value, Value) {
    let content = fs::read_to_string(path)
        .unwrap_or_else(|e| panic!("Failed to read test case {}: {}", path.display(), e));

    let sections: Vec<&str> = content.split("\n---\n").collect();
    assert_eq!(
        sections.len(),
        3,
        "Test case file {} should have 3 sections separated by '\\n---\\n'",
        path.display()
    );

    let message = sections[0].to_string();
    let options_json: Value = serde_json::from_str(sections[1])
        .unwrap_or_else(|e| panic!("Failed to parse options JSON in {}: {}", path.display(), e));
    let expected_output: Value = serde_json::from_str(sections[2])
        .unwrap_or_else(|e| panic!("Failed to parse expected output JSON in {}: {}", path.display(), e));

    (message, options_json, expected_output)
}

/// Converts JSON options to ParserOptions
fn json_to_parser_options(options_json: &Value) -> ParserOptions {
    let mut options = ParserOptions::default();

    if let Some(obj) = options_json.as_object() {
        if let Some(ignore_tag) = obj.get("ignoreTag").and_then(|v| v.as_bool()) {
            options.ignore_tag = ignore_tag;
        }
        if let Some(requires_other_clause) = obj.get("requiresOtherClause").and_then(|v| v.as_bool()) {
            options.requires_other_clause = requires_other_clause;
        }
        if let Some(should_parse_skeletons) = obj.get("shouldParseSkeletons").and_then(|v| v.as_bool()) {
            options.should_parse_skeletons = should_parse_skeletons;
        }
        if let Some(capture_location) = obj.get("captureLocation").and_then(|v| v.as_bool()) {
            options.capture_location = capture_location;
        }
        if let Some(locale_str) = obj.get("locale").and_then(|v| v.as_str()) {
            options.locale = Some(locale_str.parse::<Locale>().expect("Invalid locale"));
        }
    }

    // Default to capturing location for integration tests (to match TypeScript behavior)
    if options_json.as_object().map_or(true, |obj| !obj.contains_key("captureLocation")) {
        options.capture_location = true;
    }

    options
}

/// Runs a single integration test
fn run_integration_test(test_file_name: &str) {
    // When running with bazel, test files are available via runfiles
    // Try to find the test case file in the runfiles directory
    let test_path = Path::new("packages/icu-messageformat-parser/integration-tests/test_cases")
        .join(test_file_name);

    // If that doesn't work, try relative path (for development)
    let test_path = if test_path.exists() {
        test_path
    } else {
        Path::new("test_cases").join(test_file_name)
    };

    let (message, options_json, expected_output) = read_test_case(&test_path);
    let options = json_to_parser_options(&options_json);

    // Parse the message
    let result = Parser::new(&message, options).parse();

    // Compare results
    match result {
        Ok(ast) => {
            // Check that expected output has no error
            // In the test case format, errors are indicated by err being an object (not null)
            let expected_err = expected_output.get("err");
            let has_error = expected_err.map_or(false, |v| v.is_object());
            if has_error {
                panic!(
                    "Test case {} expected an error {:?} but parsing succeeded with AST: {:?}",
                    test_file_name, expected_err, ast
                );
            }

            // For now, we'll do a basic validation that parsing succeeded
            // In the future, we can add full AST comparison with JSON serialization
            // TODO: Implement Serialize for all AST types and compare JSON output
        }
        Err(err) => {
            // Check that an error was expected
            // In the test case format, success is indicated by err being null
            let expected_err = expected_output.get("err");
            let expects_success = expected_err.map_or(true, |v| v.is_null());
            if expects_success {
                panic!(
                    "Test case {} failed with error {:?} but success was expected",
                    test_file_name, err
                );
            }

            // Basic error validation - just check that an error occurred
            // TODO: Add more detailed error comparison
        }
    }
}

// Generate a test for each test case file
// For now, we'll test a few key cases manually
// In the future, we can use a build script to generate tests for all files

#[test]
fn test_plural_arg_with_offset_1() {
    run_integration_test("plural_arg_with_offset_1.txt");
}

#[test]
fn test_basic_argument_1() {
    run_integration_test("basic_argument_1.txt");
}

#[test]
fn test_basic_argument_2() {
    run_integration_test("basic_argument_2.txt");
}

#[test]
fn test_simple_argument_1() {
    run_integration_test("simple_argument_1.txt");
}

#[test]
fn test_simple_number_arg_1() {
    run_integration_test("simple_number_arg_1.txt");
}

#[test]
fn test_date_arg_skeleton_1() {
    run_integration_test("date_arg_skeleton_1.txt");
}

#[test]
fn test_select_arg_1() {
    run_integration_test("select_arg_1.txt");
}

#[test]
fn test_plural_arg_1() {
    run_integration_test("plural_arg_1.txt");
}

#[test]
fn test_selectordinal_1() {
    run_integration_test("selectordinal_1.txt");
}

#[test]
fn test_open_close_tag_1() {
    run_integration_test("open_close_tag_1.txt");
}

#[test]
fn test_quoted_tag_1() {
    run_integration_test("quoted_tag_1.txt");
}

#[test]
fn test_double_apostrophes_1() {
    run_integration_test("double_apostrophes_1.txt");
}

#[test]
fn test_escaped_pound_1() {
    run_integration_test("escaped_pound_1.txt");
}

#[test]
fn test_escaped_multiple_tags_1() {
    run_integration_test("escaped_multiple_tags_1.txt");
}

#[test]
fn test_ignore_tags_1() {
    run_integration_test("ignore_tags_1.txt");
}

#[test]
fn test_empty_argument_1() {
    run_integration_test("empty_argument_1.txt");
}

#[test]
fn test_invalid_arg_format_1() {
    run_integration_test("invalid_arg_format_1.txt");
}

#[test]
fn test_invalid_closing_tag_1() {
    run_integration_test("invalid_closing_tag_1.txt");
}

#[test]
fn test_duplicate_plural_selectors() {
    run_integration_test("duplicate_plural_selectors.txt");
}

#[test]
fn test_duplicate_select_selectors() {
    run_integration_test("duplicate_select_selectors.txt");
}
