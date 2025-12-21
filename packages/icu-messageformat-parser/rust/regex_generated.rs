// @generated from regex-gen.ts
use once_cell::sync::Lazy;
use regex::Regex;

/// Unicode Space Separator regex pattern
pub static SPACE_SEPARATOR_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]").expect("Failed to compile SPACE_SEPARATOR_REGEX")
});

/// Unicode White Space regex pattern
pub static WHITE_SPACE_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"[\t-\r \x85\u200E\u200F\u2028\u2029]").expect("Failed to compile WHITE_SPACE_REGEX")
});
