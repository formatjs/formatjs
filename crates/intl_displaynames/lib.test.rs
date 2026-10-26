use formatjs_intl_displaynames::{
    DisplayNames, Error, Fallback, LanguageDisplay, LocaleNames, Options, Style, Type,
    canonical_code, registry::Registry,
};
use serde_json::{Value, json};
use std::sync::Arc;

fn pack(locale: &str) -> Value {
    let language = json!({"long":{"en":"English","en-GB":"British English","zh-Hans":"简体中文"},"short":{"en-GB":"UK English"},"narrow":{}});
    let region = json!({"long":{"GB":"United Kingdom","US":"United States","SG":"新加坡"},"short":{"GB":"UK"},"narrow":{}});
    let empty = json!({"long":{},"short":{},"narrow":{}});
    json!({"formatVersion":1,"locale":locale,"data":{"types":{"language":{"dialect":language,"standard":language},"region":region,"script":empty,"currency":empty,"calendar":empty,"dateTimeField":empty},"patterns":{"locale":"{0}（{1}）"}}})
}
fn formatter(options: Options) -> DisplayNames {
    DisplayNames::new(
        Arc::new(LocaleNames::from_json(&pack("en").to_string()).unwrap()),
        options,
    )
}

#[test]
fn canonical_codes_follow_each_grammar_and_ascii_case_rule() {
    for (kind, code, expected) in [
        (Type::Language, "EN", "en"),
        (Type::Language, "iw", "he"),
        (Type::Language, "sh", "sr-Latn"),
        (Type::Region, "us", "US"),
        (Type::Region, "419", "419"),
        (Type::Script, "lATN", "Latn"),
        (Type::Currency, "usd", "USD"),
        (Type::Calendar, "ISLAMIC-CIVIL", "islamic-civil"),
        (Type::DateTimeField, "weekOfYear", "weekOfYear"),
    ] {
        assert_eq!(canonical_code(kind, code).unwrap(), expected);
    }
    for (kind, codes) in [
        (
            Type::Language,
            vec![
                "root",
                "abcd",
                "a",
                "en-u-ca-gregory",
                "en-x-private",
                "en-1901-1901",
                "en\n",
                "éé",
            ],
        ),
        (Type::Region, vec!["US\n", "USA", "U1", "１２３"]),
        (Type::Script, vec!["Latn\n", "Lat", "L4tn", "Ｌａｔｎ"]),
        (Type::Currency, vec!["US", "USD\n", "U1D", "ＵＳＤ"]),
        (
            Type::Calendar,
            vec![
                "",
                "abc_efg",
                "ab",
                "abc--def",
                "abc-defghijkl",
                "gregory\n",
            ],
        ),
        (
            Type::DateTimeField,
            vec!["YEAR", "weekofyear", "year\n", "timezone"],
        ),
    ] {
        for code in codes {
            assert_eq!(
                canonical_code(kind, code),
                Err(Error::InvalidCode),
                "{kind:?}/{code}"
            );
        }
    }
}

#[test]
fn ported_language_styles_region_composition_and_fallbacks() {
    let dialect = formatter(Options::default());
    assert_eq!(
        dialect.of("en-gb").unwrap().as_deref(),
        Some("British English")
    );
    assert_eq!(
        dialect.of("zh-hANs-sG").unwrap().as_deref(),
        Some("简体中文（新加坡）")
    );
    assert_eq!(
        dialect.of("zh-Hans-XY").unwrap().as_deref(),
        Some("简体中文（XY）")
    );
    let short = formatter(Options {
        style: Style::Short,
        ..Options::default()
    });
    assert_eq!(short.of("en-GB").unwrap().as_deref(), Some("UK English"));
    assert_eq!(
        short.of("en-US").unwrap().as_deref(),
        Some("English（United States）")
    );
    let none = formatter(Options {
        fallback: Fallback::None,
        ..Options::default()
    });
    assert!(none.of("zh-Hans-XY").unwrap().is_none());
    assert!(none.of("xx-US").unwrap().is_none());
    let currency = formatter(Options {
        kind: Type::Currency,
        ..Options::default()
    });
    assert_eq!(currency.of("zzz").unwrap().as_deref(), Some("ZZZ"));
    assert!(currency.resolved_options().language_display.is_none());
    assert_eq!(
        dialect.resolved_options().language_display,
        Some(LanguageDisplay::Dialect)
    );
}

#[test]
fn loaded_maps_are_owned_atomic_and_do_not_change_existing_instances() {
    let mut registry = Registry::default();
    assert!(registry.negotiate(&["en".into()], false).is_err());
    let mut initial = pack("en");
    initial["aliases"] = json!(["en-US"]);
    registry.add_locale_data(&initial.to_string()).unwrap();
    let old = registry.create("en-US", &Options::default()).unwrap();
    assert_eq!(old.resolved_options().locale, "en-US");
    let mut changed = pack("en-US");
    changed["data"]["types"]["language"]["dialect"]["long"]["en"] = json!("changed");
    registry.add_locale_data(&changed.to_string()).unwrap();
    registry.add_locale_data(&initial.to_string()).unwrap();
    let new = registry.create("en-US", &Options::default()).unwrap();
    let mut invalid = pack("fr");
    invalid["data"]["patterns"]["locale"] = json!("{0}");
    assert!(registry.add_locale_data(&invalid.to_string()).is_err());
    assert!(registry.supported_locales(&["fr".into()]).is_empty());
    drop(registry);
    assert_eq!(old.of("en").unwrap().as_deref(), Some("English"));
    assert_eq!(new.of("en").unwrap().as_deref(), Some("changed"));
}
