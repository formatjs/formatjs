use formatjs_icu_messageformat_parser::*;

#[test]
fn test_time_data_has_entries() {
    assert!(!TIME_DATA.is_empty());
}

#[test]
fn test_time_data_has_001() {
    let data = TIME_DATA.get("001");
    assert!(data.is_some());
}
