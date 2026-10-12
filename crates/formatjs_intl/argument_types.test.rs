#![cfg(feature = "compiled_data")]
use formatjs_intl::{Intl, IntlCache, MessageCatalog};
use std::sync::Arc;

fn intl() -> Intl {
    let mut catalog = MessageCatalog::new();
    catalog
        .insert("en", std::collections::HashMap::new())
        .unwrap();
    Intl::try_new(["en"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap()
}

#[test]
fn preserves_verbatim_selectors() {
    struct Choice;
    impl formatjs_intl::VerbatimSource for Choice {
        fn as_verbatim(&self) -> &str {
            "yes"
        }
    }
    let intl = intl();
    let result = formatjs_intl::formatted_message!(&intl,
        default_message: "{choice, select, yes {Selected} other {Other}}",
        values: {choice: formatjs_intl::Verbatim::new(&Choice)}
    );
    assert_eq!(result.as_str(), "Selected");
}

#[test]
fn formats_checked_roles_and_evaluates_each_value_once() {
    let intl = intl();
    let mut calls = 0;
    let result = formatjs_intl::format_message!(&intl,
        default_message: "{n, plural, other {{n, number}}}",
        values: {n: {calls += 1; 2_i64}}
    );
    assert_eq!(result, "2");
    assert_eq!(calls, 1);
    assert_eq!(
        formatjs_intl::format_message!(&intl,
            default_message: "<b>Hello</b>",
            values: {b: |parts| Ok(parts)}
        ),
        "Hello"
    );
    assert_eq!(
        formatjs_intl::format_message!(&intl,
            default_message: "{s, select, true {Yes} other {No}}",
            values: {s: true}
        ),
        "Yes"
    );
    let date = formatjs_icu_messageformat::DateTimeValue::from_unix_millis(0);
    let result = formatjs_intl::format_message!(&intl,
        default_message: "{d, date} {d, time}", values: {d: date});
    assert!(!result.contains("{d"));
    let result = formatjs_intl::formatted_message!(&intl,
        default_message: "{n, number}", values: {n: 2_i32});
    assert_eq!(result.as_str(), "2");
    assert_eq!(
        formatjs_intl::format_message!(&intl,
            default_message: "'{escaped}' '{n, number}' {name}", values: {name: "Ada"}
        ),
        "{escaped} {n, number} Ada"
    );
}
