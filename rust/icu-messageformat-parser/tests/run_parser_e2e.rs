#![allow(non_snake_case)]
use icu_messageformat_parser::{AstElement, Error, Parser, ParserOptions};
use serde::Serialize;
use serde_json::Value;
use std::{fs, path::PathBuf};
use testing::fixture;

#[derive(Debug)]
struct TestFixtureSections {
    message: String,
    snapshot_options: ParserOptions,
    expected: String,
}

#[derive(Debug, PartialEq, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Snapshot<'a> {
    val: Option<Vec<AstElement<'a>>>,
    err: Option<Error>,
}

fn read_sections<'a>(file: PathBuf) -> TestFixtureSections {
    let input = fs::read_to_string(file).expect("Should able to read fixture");

    let input: Vec<&str> = input.split("\n---\n").collect();

    TestFixtureSections {
        message: input.get(0).expect("").to_string(),
        snapshot_options: serde_json::from_str(input.get(1).expect(""))
            .expect("Should able to deserialize options"),
        expected: input.get(2).expect("").to_string(),
    }
}

#[cfg_attr(feature = "utf16", fixture("tests/fixtures/treat_unicode_nbsp_as_whitespace"))]
#[cfg_attr(feature = "utf16", fixture("tests/fixtures/trivial_2"))]
#[fixture("tests/fixtures/uppercase_tag_1")]
#[fixture("tests/fixtures/expect_number_arg_skeleton_token_1")]
#[fixture("tests/fixtures/self_closing_tag_1")]
#[fixture("tests/fixtures/self_closing_tag_2")]
#[fixture("tests/fixtures/date_arg_skeleton_with_j")]
#[fixture("tests/fixtures/date_arg_skeleton_with_jj")]
#[fixture("tests/fixtures/date_arg_skeleton_with_jjj")]
#[fixture("tests/fixtures/date_arg_skeleton_with_jjjj")]
#[fixture("tests/fixtures/date_arg_skeleton_with_jjjjj")]
#[fixture("tests/fixtures/date_arg_skeleton_with_jjjjjj")]
#[fixture("tests/fixtures/date_arg_skeleton_with_capital_J")]
#[fixture("tests/fixtures/date_arg_skeleton_with_capital_JJ")]
#[fixture("tests/fixtures/negative_offset_1")]
#[fixture("tests/fixtures/simple_date_and_time_arg_1")]
#[fixture("tests/fixtures/select_arg_with_nested_arguments")]
#[fixture("tests/fixtures/expect_number_arg_skeleton_token_option_1")]
#[fixture("tests/fixtures/less_than_sign_1")]
#[fixture("tests/fixtures/unmatched_open_close_tag_1")]
#[fixture("tests/fixtures/unmatched_open_close_tag_2")]
#[fixture("tests/fixtures/basic_argument_1")]
#[fixture("tests/fixtures/basic_argument_2")]
#[fixture("tests/fixtures/date_arg_skeleton_1")]
#[fixture("tests/fixtures/date_arg_skeleton_2")]
#[fixture("tests/fixtures/date_arg_skeleton_3")]
#[fixture("tests/fixtures/number_arg_skeleton_2")]
#[fixture("tests/fixtures/number_arg_skeleton_3")]
#[fixture("tests/fixtures/number_arg_style_1")]
#[fixture("tests/fixtures/expect_number_arg_style_1")]
#[fixture("tests/fixtures/expect_arg_format_1")]
#[fixture("tests/fixtures/trivial_1")]
#[fixture("tests/fixtures/simple_number_arg_1")]
#[fixture("tests/fixtures/simple_argument_1")]
#[fixture("tests/fixtures/simple_argument_2")]
#[fixture("tests/fixtures/ignore_tags_1")]
#[fixture("tests/fixtures/ignore_tag_number_arg_1")]
#[fixture("tests/fixtures/unclosed_argument_1")]
#[fixture("tests/fixtures/unclosed_argument_2")]
#[fixture("tests/fixtures/unclosed_number_arg_1")]
#[fixture("tests/fixtures/unclosed_number_arg_2")]
#[fixture("tests/fixtures/unclosed_number_arg_3")]
#[fixture("tests/fixtures/unclosed_quoted_string_1")]
#[fixture("tests/fixtures/unclosed_quoted_string_2")]
#[fixture("tests/fixtures/unclosed_quoted_string_3")]
#[fixture("tests/fixtures/unclosed_quoted_string_4")]
#[fixture("tests/fixtures/unclosed_quoted_string_5")]
#[fixture("tests/fixtures/unclosed_quoted_string_6")]
#[fixture("tests/fixtures/unescaped_string_literal_1")]
#[fixture("tests/fixtures/not_quoted_string_1")]
#[fixture("tests/fixtures/not_quoted_string_2")]
#[fixture("tests/fixtures/left_angle_bracket_1")]
#[fixture("tests/fixtures/malformed_argument_1")]
#[fixture("tests/fixtures/invalid_close_tag_1")]
#[fixture("tests/fixtures/invalid_closing_tag_1")]
#[fixture("tests/fixtures/invalid_closing_tag_2")]
#[fixture("tests/fixtures/invalid_tag_1")]
#[fixture("tests/fixtures/invalid_tag_2")]
#[fixture("tests/fixtures/invalid_tag_3")]
#[fixture("tests/fixtures/double_apostrophes_1")]
#[fixture("tests/fixtures/quoted_string_1")]
#[fixture("tests/fixtures/quoted_string_2")]
#[fixture("tests/fixtures/quoted_string_3")]
#[fixture("tests/fixtures/quoted_string_4")]
#[fixture("tests/fixtures/quoted_string_5")]
#[fixture("tests/fixtures/number_skeleton_1")]
#[fixture("tests/fixtures/number_skeleton_2")]
#[fixture("tests/fixtures/number_skeleton_3")]
#[fixture("tests/fixtures/number_skeleton_4")]
#[fixture("tests/fixtures/number_skeleton_5")]
#[fixture("tests/fixtures/number_skeleton_6")]
#[fixture("tests/fixtures/number_skeleton_7")]
#[fixture("tests/fixtures/number_skeleton_8")]
#[fixture("tests/fixtures/number_skeleton_9")]
#[fixture("tests/fixtures/number_skeleton_10")]
#[fixture("tests/fixtures/number_skeleton_11")]
#[fixture("tests/fixtures/number_skeleton_12")]
#[fixture("tests/fixtures/empty_argument_1")]
#[fixture("tests/fixtures/empty_argument_2")]
#[fixture("tests/fixtures/duplicate_select_selectors")]
#[fixture("tests/fixtures/duplicate_plural_selectors")]
#[fixture("tests/fixtures/plural_arg_1")]
#[fixture("tests/fixtures/plural_arg_2")]
#[fixture("tests/fixtures/plural_arg_with_escaped_nested_message")]
#[fixture("tests/fixtures/plural_arg_with_offset_1")]
#[fixture("tests/fixtures/open_close_tag_1")]
#[fixture("tests/fixtures/open_close_tag_2")]
#[fixture("tests/fixtures/open_close_tag_3")]
#[fixture("tests/fixtures/open_close_tag_with_args")]
#[fixture("tests/fixtures/open_close_tag_with_nested_arg")]
#[fixture("tests/fixtures/escaped_pound_1")]
#[fixture("tests/fixtures/escaped_multiple_tags_1")]
#[fixture("tests/fixtures/invalid_arg_format_1")]
#[fixture("tests/fixtures/incomplete_nested_message_in_tag")]
#[fixture("tests/fixtures/not_escaped_pound_1")]
#[fixture("tests/fixtures/not_self_closing_tag_1")]
#[fixture("tests/fixtures/nested_1")]
#[fixture("tests/fixtures/nested_tags_1")]
#[fixture("tests/fixtures/numeric_tag_1")]
#[fixture("tests/fixtures/quoted_pound_sign_1")]
#[fixture("tests/fixtures/quoted_pound_sign_2")]
#[fixture("tests/fixtures/quoted_tag_1")]
#[fixture("tests/fixtures/select_arg_1")]
#[fixture("tests/fixtures/selectordinal_1")]
fn parser_tests(file: PathBuf) {
    let fixture_sections = read_sections(file);
    let options = ParserOptions {
        capture_location: true,
        ..fixture_sections.snapshot_options
    };

    let mut parser = Parser::new(
        &fixture_sections.message,
        &options
    );

    let parsed_result = parser.parse();
    let parsed_result_snapshot = match parsed_result {
        Ok(parsed_result) => Snapshot {
            val: Some(parsed_result),
            err: None,
        },
        Err(err) => Snapshot {
            val: None,
            err: Some(err),
        },
    };

    let parsed_result_str = serde_json::to_string_pretty(&parsed_result_snapshot)
        .expect("Should able to serialize parsed result");

    let input: Value = serde_json::from_str(&parsed_result_str).unwrap();
    let expected: Value = serde_json::from_str(&fixture_sections.expected).unwrap();

    similar_asserts::assert_eq!(input, expected);
}
