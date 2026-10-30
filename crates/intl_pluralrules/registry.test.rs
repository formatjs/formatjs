use formatjs_intl_pluralrules::{Error, instance::Options, registry::Registry};

#[test]
fn late_explicit_data_overrides_aliases_without_changing_existing_instances() {
    let mut registry = Registry::default();
    assert!(registry.available_locales().is_empty());
    assert!(matches!(
        registry.create("en", &Options::default()),
        Err(Error::MissingLocale)
    ));
    registry
        .add_locale_data(
            r#"{"locale":"en","aliases":["en-US"],"cardinal":{"one":"n = 1"},"ordinal":{}}"#,
        )
        .unwrap();
    let initial = registry.create("en-US", &Options::default()).unwrap();
    assert_eq!(initial.resolved_options().locale, "en-US");
    assert_eq!(initial.select("1").unwrap(), "one");
    registry
        .add_locale_data(r#"{"locale":"en-US","cardinal":{},"ordinal":{}}"#)
        .unwrap();
    registry
        .add_locale_data(
            r#"{"locale":"en","aliases":["en-US"],"cardinal":{"one":"n = 1"},"ordinal":{}}"#,
        )
        .unwrap();
    assert_eq!(
        registry
            .create("en-US", &Options::default())
            .unwrap()
            .select("1")
            .unwrap(),
        "other"
    );
    assert_eq!(initial.select("1").unwrap(), "one");
    assert_eq!(registry.default_locale(), Some("en"));
    assert_eq!(registry.available_locales(), ["en", "en-US"]);
    drop(registry);
    assert_eq!(initial.select("1").unwrap(), "one");
}

#[test]
fn fallback_availability_is_canonical_and_registration_is_atomic() {
    let mut registry = Registry::default();
    registry
        .add_locale_data(r#"{"locale":"sh","aliases":["sr-Latn-RS"],"cardinal":{},"ordinal":{}}"#)
        .unwrap();
    assert_eq!(
        registry.available_locales(),
        ["sr-Latn", "sr-Latn-RS", "sr", "sr-RS"]
    );
    assert_eq!(registry.default_locale(), Some("sr-Latn"));
    for pack in [
        r#"{"formatVersion":2,"locale":"fr","cardinal":{},"ordinal":{}}"#,
        r#"{"locale":"fr","aliases":["invalid!"],"cardinal":{},"ordinal":{}}"#,
    ] {
        let before = registry.available_locales().to_vec();
        assert!(registry.add_locale_data(pack).is_err());
        assert_eq!(registry.available_locales(), before);
        assert_eq!(registry.default_locale(), Some("sr-Latn"));
    }
}

#[test]
fn traditional_chinese_uses_chinese_rules_before_default_locale() {
    let mut registry = Registry::default();
    registry
        .add_locale_data(r#"{"locale":"en","cardinal":{"one":"i = 1 and v = 0"},"ordinal":{}}"#)
        .unwrap();
    registry
        .add_locale_data(r#"{"locale":"zh","cardinal":{},"ordinal":{}}"#)
        .unwrap();
    for lookup in [false, true] {
        let locale = registry.negotiate(&["zh-TW".into()], lookup).unwrap();
        assert_eq!(locale, "zh");
        let rules = registry.create(&locale, &Options::default()).unwrap();
        assert_eq!(rules.select("1").unwrap(), "other");
    }
    assert_eq!(registry.negotiate(&["aa".into()], false).unwrap(), "en");
}
