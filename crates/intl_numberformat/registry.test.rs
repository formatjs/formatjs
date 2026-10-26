use formatjs_intl_numberformat::{Error, registry::Registry};
use serde_json::{Value, json};

fn pack(locale: &str) -> Value {
    let mut pack: Value = serde_json::from_str(include_str!(env!("FORMATJS_NUMBER_EN"))).unwrap();
    pack["locale"] = json!(locale);
    pack["aliases"] = json!([]);
    pack
}

#[test]
fn registration_is_on_demand_and_existing_records_keep_their_payload() {
    let mut registry = Registry::default();
    assert!(matches!(
        registry.negotiate(&["en".into()], true),
        Err(Error::MissingLocale)
    ));
    registry.add_locale_data(&pack("en").to_string()).unwrap();
    let existing = registry.get("en").unwrap();
    assert!(registry.supported_locales(&["fr".into()]).is_empty());
    registry.add_locale_data(&pack("fr").to_string()).unwrap();
    assert_eq!(registry.negotiate(&["fr-CA".into()], true).unwrap(), "fr");
    let mut replacement = pack("en");
    replacement["data"]["nu"] = json!(["arab"]);
    registry.add_locale_data(&replacement.to_string()).unwrap();
    assert!(
        existing
            .numbering_systems()
            .iter()
            .any(|value| value == "latn")
    );
    assert_eq!(registry.get("en").unwrap().numbering_systems(), ["arab"]);
    assert_eq!(registry.default_locale(), Some("en"));
}

#[test]
fn invalid_aliases_reject_the_whole_registration() {
    let mut registry = Registry::default();
    registry.add_locale_data(&pack("en").to_string()).unwrap();
    let before = registry.available_locales().to_vec();
    let mut invalid = pack("fr");
    invalid["data"]["numbers"]["aliases"]["latn"] = json!("latn");
    assert!(registry.add_locale_data(&invalid.to_string()).is_err());
    assert_eq!(registry.available_locales(), before);
    assert!(matches!(registry.get("fr"), Err(Error::MissingLocale)));
    invalid["data"]["numbers"]["aliases"]["latn"] = json!("missing");
    assert!(registry.add_locale_data(&invalid.to_string()).is_err());
    assert_eq!(registry.available_locales(), before);
}

#[test]
fn explicit_aliases_and_parents_survive_later_pack_loads() {
    let mut registry = Registry::default();
    registry
        .add_locale_data(&pack("en-US").to_string())
        .unwrap();
    let mut english = pack("en");
    english["aliases"] = json!(["en-US"]);
    registry.add_locale_data(&english.to_string()).unwrap();
    assert_eq!(registry.get("en-US").unwrap().locale(), "en-US");
    registry
        .add_locale_data(&pack("zh-Hant-HK").to_string())
        .unwrap();
    assert_eq!(registry.get("zh-HK").unwrap().locale(), "zh-Hant-HK");
    assert_eq!(
        registry
            .negotiate(&["zh-HK-u-nu-hanidec".into()], true)
            .unwrap(),
        "zh-HK"
    );
}
