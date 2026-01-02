pub mod date_time_pattern_generator;
pub mod error;
pub mod manipulator;
pub mod parser;
pub mod printer;
pub mod regex_generated;
pub mod time_data_generated;
pub mod types;

// Re-export time data
pub use time_data_generated::TIME_DATA;

// Re-export regex patterns
pub use regex_generated::{SPACE_SEPARATOR_REGEX, WHITE_SPACE_REGEX};

// Re-export date time pattern generator functions
pub use date_time_pattern_generator::get_best_pattern;

// Re-export printer functions
pub use printer::{print_ast, print_date_time_skeleton};

// Re-export manipulator functions and types
pub use manipulator::{
    hoist_selectors, is_structurally_same, ManipulatorError, StructuralComparisonError,
    StructuralComparisonResult,
};

// Re-export parser types and functions
pub use parser::{Parser, ParserOptions, Position};

// Re-export icu::locale::Locale for convenience
pub use icu::locale::Locale;

// Re-export error types
pub use error::{ErrorKind, Location, LocationDetails, ParserError};

// Re-export common types
pub use types::{
    ArgumentElement, DateElement, LiteralElement, MessageFormatElement, NumberElement,
    PluralElement, PoundElement, SelectElement, Skeleton, SkeletonType, TagElement, TimeElement,
    Type,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_data_has_entries() {
        assert!(!TIME_DATA.is_empty());
    }

    #[test]
    fn test_time_data_has_001() {
        let data = TIME_DATA.get("001");
        assert!(data.is_some());
    }
}
