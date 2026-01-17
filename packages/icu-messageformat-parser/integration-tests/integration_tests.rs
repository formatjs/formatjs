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

use formatjs_icu_messageformat_parser::{Locale, Parser, ParserOptions};
use pretty_assertions::assert_eq;
use runfiles::{Runfiles, rlocation};
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
    let expected_output: Value = serde_json::from_str(sections[2]).unwrap_or_else(|e| {
        panic!(
            "Failed to parse expected output JSON in {}: {}",
            path.display(),
            e
        )
    });

    (message, options_json, expected_output)
}

/// Converts JSON options to ParserOptions
fn json_to_parser_options(options_json: &Value) -> ParserOptions {
    let mut options = ParserOptions::default();

    if let Some(obj) = options_json.as_object() {
        if let Some(ignore_tag) = obj.get("ignoreTag").and_then(|v| v.as_bool()) {
            options.ignore_tag = ignore_tag;
        }
        if let Some(requires_other_clause) =
            obj.get("requiresOtherClause").and_then(|v| v.as_bool())
        {
            options.requires_other_clause = requires_other_clause;
        }
        if let Some(should_parse_skeletons) =
            obj.get("shouldParseSkeletons").and_then(|v| v.as_bool())
        {
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
    if options_json
        .as_object()
        .map_or(true, |obj| !obj.contains_key("captureLocation"))
    {
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

            // Serialize the Rust AST to JSON for comparison
            let rust_ast_json = serde_json::to_value(&ast)
                .unwrap_or_else(|e| panic!("Failed to serialize Rust AST to JSON: {}", e));

            // Get expected AST from the "val" field
            let expected_ast = expected_output.get("val").unwrap_or_else(|| {
                panic!(
                    "Test case {} missing 'val' field in expected output",
                    test_file_name
                )
            });

            // Compare the AST structures using pretty_assertions
            assert_eq!(
                rust_ast_json, *expected_ast,
                "Test case {} AST mismatch",
                test_file_name
            );
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

            // Serialize the error to JSON for comparison
            let rust_err_json = serde_json::to_value(&err)
                .unwrap_or_else(|e| panic!("Failed to serialize Rust error to JSON: {}", e));

            // Compare error details using pretty_assertions for nice diff output
            if let Some(expected_err_obj) = expected_err {
                if !expected_err_obj.is_null() {
                    // Compare error kind if present
                    if let Some(expected_kind) = expected_err_obj.get("kind") {
                        let rust_kind = rust_err_json
                            .get("kind")
                            .expect("Rust error should have 'kind' field");
                        assert_eq!(
                            rust_kind, expected_kind,
                            "Test case {} error kind mismatch",
                            test_file_name
                        );
                    }

                    // Compare error message if present
                    if let Some(expected_message) = expected_err_obj.get("message") {
                        let rust_message = rust_err_json
                            .get("message")
                            .expect("Rust error should have 'message' field");
                        assert_eq!(
                            rust_message, expected_message,
                            "Test case {} error message mismatch",
                            test_file_name
                        );
                    }

                    // Compare error location if present
                    if let Some(expected_location) = expected_err_obj.get("location") {
                        let rust_location = rust_err_json
                            .get("location")
                            .expect("Rust error should have 'location' field");
                        assert_eq!(
                            rust_location, expected_location,
                            "Test case {} error location mismatch",
                            test_file_name
                        );
                    }
                }
            }
        }
    }
}

/// Main integration test that runs all test cases.
/// Reads the list of test files from test_list.txt and runs each one.
#[test]
fn integration_test() {
    // Use Bazel runfiles library to locate the test list file
    // See: https://github.com/bazelbuild/rules_crates/blob/main/crates/runfiles/runfiles.rs
    let runfiles = Runfiles::create().expect("Failed to create runfiles");

    let test_list_path = rlocation!(
        runfiles,
        "_main/packages/icu-messageformat-parser/integration-tests/test_list.txt"
    )
    .expect("Failed to locate test_list.txt in runfiles");

    // Read the list of test files
    let test_list_content = fs::read_to_string(&test_list_path)
        .unwrap_or_else(|e| panic!("Failed to read test list file {:?}: {}", test_list_path, e));

    let test_files: Vec<&str> = test_list_content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();

    eprintln!("Running {} integration tests", test_files.len());

    let mut failed_tests = Vec::new();
    let mut passed_tests = 0;

    // Run each test and collect failures
    for test_file in test_files {
        match std::panic::catch_unwind(|| {
            run_integration_test(test_file);
        }) {
            Ok(_) => {
                passed_tests += 1;
            }
            Err(e) => {
                let error_msg = if let Some(s) = e.downcast_ref::<String>() {
                    s.clone()
                } else if let Some(s) = e.downcast_ref::<&str>() {
                    s.to_string()
                } else {
                    "Unknown error".to_string()
                };
                failed_tests.push((test_file.to_string(), error_msg));
            }
        }
    }

    // Print summary
    eprintln!(
        "\n{} tests run: {} passed, {} failed",
        passed_tests + failed_tests.len(),
        passed_tests,
        failed_tests.len()
    );

    // If any tests failed, report them and panic
    if !failed_tests.is_empty() {
        eprintln!("\n❌ Failed tests:");
        for (test_name, error) in &failed_tests {
            eprintln!("\n  • {}", test_name);
            eprintln!("    {}", error.lines().collect::<Vec<_>>().join("\n    "));
        }
        panic!("{} test(s) failed", failed_tests.len());
    }
}
