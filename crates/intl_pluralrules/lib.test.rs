use formatjs_intl_pluralrules::{Error, LocaleRules};

const EN: &str = r#"{"locale":"en","cardinal":{"one":"i = 1 and v = 0"},"ordinal":{"one":"n % 10 = 1 and n % 100 != 11","two":"n % 10 = 2 and n % 100 != 12","few":"n % 10 = 3 and n % 100 != 13"},"ranges":{"cardinal":{"one_other":"other","one_one":"other"}}}"#;

#[test]
fn english_cardinal_and_ordinal_cases() {
    let rules = LocaleRules::from_json(EN).unwrap();
    for (value, expected) in [
        ("0", "other"),
        ("1", "one"),
        ("2", "other"),
        ("-1", "one"),
        ("1.0", "other"),
        ("1.00", "other"),
        ("1.5", "other"),
        ("Infinity", "other"),
        ("-Infinity", "other"),
        ("NaN", "other"),
    ] {
        assert_eq!(
            rules.select_rounded(value, 0, false).unwrap(),
            expected,
            "{value}"
        );
    }
    for (value, expected) in [
        ("1", "one"),
        ("2", "two"),
        ("3", "few"),
        ("4", "other"),
        ("11", "other"),
        ("12", "other"),
        ("13", "other"),
        ("21", "one"),
        ("22", "two"),
        ("23", "few"),
        ("101", "one"),
    ] {
        assert_eq!(
            rules.select_rounded(value, 0, true).unwrap(),
            expected,
            "{value}"
        );
    }
    assert_eq!(rules.categories(false), ["one", "other"]);
    assert_eq!(rules.categories(true), ["one", "two", "few", "other"]);
}

#[test]
fn packs_own_their_data_without_shared_global_state() {
    let rules = {
        let bytes = String::from(EN);
        LocaleRules::from_json(&bytes).unwrap()
    };
    let chinese = LocaleRules::from_json(r#"{"locale":"zh","cardinal":{},"ordinal":{}}"#).unwrap();
    assert_eq!(rules.locale(), "en");
    assert_eq!(chinese.locale(), "zh");
    assert_eq!(rules.select_rounded("1", 0, false).unwrap(), "one");
    assert_eq!(chinese.select_rounded("1", 0, false).unwrap(), "other");
}

#[test]
fn range_matrix_and_nonfinite_endpoints() {
    let rules = LocaleRules::from_json(EN).unwrap();
    assert_eq!(
        rules.select_range_rounded("1", "1", 0, 0, false).unwrap(),
        "one"
    );
    assert_eq!(
        rules.select_range_rounded("1", "2", 0, 0, false).unwrap(),
        "other"
    );
    assert_eq!(
        rules
            .select_range_rounded("Infinity", "1", 0, 0, false)
            .unwrap(),
        "one"
    );
    assert!(matches!(
        rules.select_range_rounded("NaN", "1", 0, 0, false),
        Err(Error::InvalidRange)
    ));
    assert!(LocaleRules::from_json(r#"{"locale":"en","cardinal":{},"ordinal":{},"ranges":{"cardinal":{"one_other":"invalid"}}}"#).is_err());
}

#[test]
fn compact_exponent_is_preserved() {
    let rules = LocaleRules::from_json(
        r#"{"locale":"fr","cardinal":{"one":"i = 0,1","many":"e = 6"},"ordinal":{}}"#,
    )
    .unwrap();
    assert_eq!(rules.select_rounded("2000000", 0, false).unwrap(), "other");
    assert_eq!(rules.select_rounded("2000000", 6, false).unwrap(), "many");
}
