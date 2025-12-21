pub mod time_data_generated;
pub mod date_time_pattern_generator;

// Re-export time data
pub use time_data_generated::TIME_DATA;

// Re-export date time pattern generator functions
pub use date_time_pattern_generator::get_best_pattern;

// Re-export icu::locale::Locale for convenience
pub use icu::locale::Locale;

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
