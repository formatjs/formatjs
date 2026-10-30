use formatjs_intl_relativetimeformat::{Error, Options, registry::Registry};
use serde_json::{Value, json};
const EN: &str = include_str!(env!("FORMATJS_RELATIVE_EN"));
fn loaded() -> Registry {
    let mut value = Registry::default();
    value.add_locale_data(EN).unwrap();
    value
}
fn options(value: Value) -> Options {
    serde_json::from_value(value).unwrap()
}
#[test]
fn negative_zero_named_forms_and_number_parts_keep_distinct_semantics() {
    let registry = loaded();
    let model = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    assert_eq!(model.format("-0", "days").unwrap(), "0 days ago");
    assert_eq!(model.format("0", "day").unwrap(), "in 0 days");
    assert_eq!(
        model.format("1e+21", "second").unwrap(),
        "in 1,000,000,000,000,000,000,000 seconds"
    );
    let parts = serde_json::to_value(model.format_to_parts("1234.5", "day").unwrap()).unwrap();
    assert_eq!(
        parts,
        json!([
            {"type":"literal","value":"in "},
            {"type":"integer","value":"1","unit":"day"},
            {"type":"group","value":",","unit":"day"},
            {"type":"integer","value":"234","unit":"day"},
            {"type":"decimal","value":".","unit":"day"},
            {"type":"fraction","value":"5","unit":"day"},
            {"type":"literal","value":" days"}
        ])
    );
    let auto = registry
        .create(&["en".into()], &options(json!({"numeric":"auto"})))
        .unwrap();
    assert_eq!(auto.format("-0", "day").unwrap(), "today");
    assert_eq!(auto.format("-1", "day").unwrap(), "yesterday");
    assert_eq!(auto.format_to_parts("1", "day").unwrap()[0].unit, None);
}
#[test]
fn plural_selection_shares_rounding_but_uses_relative_locale_rules() {
    let mut data: Value = serde_json::from_str(EN).unwrap();
    data["plurals"]["cardinal"]["one"] = json!("i = 2 and v = 0");
    let mut registry = Registry::default();
    registry.add_locale_data(&data.to_string()).unwrap();
    let model = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    assert_eq!(model.format("1.9996", "day").unwrap(), "in 2 day");
    assert_eq!(model.format("1.9994", "day").unwrap(), "in 1.999 days");
    assert_eq!(model.format("1", "day").unwrap(), "in 1 days");
    assert_eq!(
        serde_json::to_value(model.format_to_parts("1.9996", "day").unwrap()).unwrap(),
        json!([
            {"type":"literal","value":"in "},
            {"type":"integer","value":"2","unit":"day"},
            {"type":"literal","value":" day"}
        ])
    );
}
#[test]
fn numeric_text_survives_single_repeated_and_prefixed_slots() {
    for (pattern, expected) in [
        ("{0} days ago", "1,234.5 days ago"),
        ("{0}🗓️", "1,234.5🗓️"),
        ("{0}|{0}|{0}", "1,234.5|1,234.5|1,234.5"),
        ("in {0} days", "in 1,234.5 days"),
        ("{0}", "1,234.5"),
    ] {
        let mut data: Value = serde_json::from_str(EN).unwrap();
        data["data"]["day"]["future"]["other"] = json!(pattern);
        let mut registry = Registry::default();
        registry.add_locale_data(&data.to_string()).unwrap();
        let model = registry
            .create(&["en".into()], &Options::default())
            .unwrap();
        assert_eq!(model.format("1234.5", "day").unwrap(), expected);
        assert_eq!(model.format_number(1234.5, "day").unwrap(), expected);
    }
}
#[test]
fn repeated_slots_and_empty_named_forms_keep_part_boundaries() {
    let mut data: Value = serde_json::from_str(EN).unwrap();
    data["data"]["day"]["future"]["other"] = json!("{0}|{0}");
    data["data"]["day"]["0"] = json!("");
    let mut registry = Registry::default();
    registry.add_locale_data(&data.to_string()).unwrap();
    let model = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    assert_eq!(model.format("2", "day").unwrap(), "2|2");
    assert_eq!(
        serde_json::to_value(model.format_to_parts("2", "day").unwrap()).unwrap(),
        json!([
            {"type":"integer","value":"2","unit":"day"},
            {"type":"literal","value":"|"},
            {"type":"integer","value":"2","unit":"day"}
        ])
    );
    let auto = registry
        .create(&["en".into()], &options(json!({"numeric":"auto"})))
        .unwrap();
    assert_eq!(auto.format("0", "day").unwrap(), "");
    assert_eq!(
        serde_json::to_value(auto.format_to_parts("0", "day").unwrap()).unwrap(),
        json!([
            {"type":"literal","value":""}
        ])
    );
}
#[test]
fn resolution_stays_fixed_but_fields_follow_later_registration() {
    let mut registry = loaded();
    let old = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    let resolution = registry
        .resolve(&["en-u-nu-arab".into()], &Options::default())
        .unwrap();
    let mut replacement: Value = serde_json::from_str(EN).unwrap();
    replacement["data"]["day"]["future"]["other"] = json!("later {0} days");
    registry.add_locale_data(&replacement.to_string()).unwrap();
    let new = registry
        .create_resolved(&resolution, &Options::default())
        .unwrap();
    drop(registry);
    assert_eq!(old.format("2", "day").unwrap(), "in 2 days");
    assert_eq!(new.format("2", "day").unwrap(), "later ٢ days");
    assert_eq!(new.resolved_options().locale, "en-u-nu-arab");
}
#[test]
fn repeated_construction_keeps_number_systems_and_options_independent() {
    let registry = loaded();
    for _ in 0..3 {
        for (system, digit) in [("latn", "3"), ("arab", "٣")] {
            let requested = ["en".into()];
            let always = registry
                .create(&requested, &options(json!({"numberingSystem":system})))
                .unwrap();
            let auto = registry
                .create(
                    &requested,
                    &options(json!({"numeric":"auto", "numberingSystem":system})),
                )
                .unwrap();
            assert_eq!(
                always.format("-3", "day").unwrap(),
                format!("{digit} days ago")
            );
            assert_eq!(auto.format("-1", "day").unwrap(), "yesterday");
            assert_eq!(always.resolved_options().numbering_system, system);
            assert_eq!(auto.resolved_options().numeric, "auto");
            for invalid in [json!({"style":"invalid"}), json!({"numeric":"invalid"})] {
                assert!(matches!(
                    registry.create(&requested, &options(invalid)),
                    Err(Error::InvalidOption(_))
                ));
            }
        }
    }
}
#[test]
fn replacement_number_symbols_do_not_change_existing_instances() {
    let mut registry = loaded();
    let requested = ["en".into()];
    let resolution = registry.resolve(&requested, &Options::default()).unwrap();
    let old = registry
        .create_resolved(&resolution, &Options::default())
        .unwrap();
    let mut replacement: Value = serde_json::from_str(EN).unwrap();
    replacement["number"]["data"]["numbers"]["symbols"]["latn"]["group"] = json!("!");
    registry.add_locale_data(&replacement.to_string()).unwrap();
    let new = registry
        .create_resolved(&resolution, &Options::default())
        .unwrap();
    drop(registry);
    assert_eq!(old.format("1234", "day").unwrap(), "in 1,234 days");
    assert_eq!(new.format("1234", "day").unwrap(), "in 1!234 days");
}
#[test]
fn malformed_pack_is_atomic_and_short_style_and_plural_fallbacks_work() {
    let mut registry = loaded();
    let before = registry.available_locales().to_vec();
    let mut data: Value = serde_json::from_str(EN).unwrap();
    data["data"]["day"]["future"]["one"] = Value::Null;
    assert!(registry.add_locale_data(&data.to_string()).is_err());
    assert_eq!(registry.available_locales(), before);
    let mut data: Value = serde_json::from_str(EN).unwrap();
    data["data"].as_object_mut().unwrap().remove("day-short");
    data["data"]["day"]["future"]
        .as_object_mut()
        .unwrap()
        .remove("one");
    registry.add_locale_data(&data.to_string()).unwrap();
    let model = registry
        .create(&["en".into()], &options(json!({"style":"short"})))
        .unwrap();
    assert_eq!(model.format("1", "day").unwrap(), "in 1 days");
}
#[test]
fn registry_is_empty_until_loaded_and_validation_rejects_nonfinite_numbers() {
    let mut registry = Registry::default();
    assert!(matches!(
        registry.create(&[], &Options::default()),
        Err(Error::MissingLocale)
    ));
    registry.add_locale_data(EN).unwrap();
    let model = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    for value in ["NaN", "Infinity", "-Infinity", "not a number"] {
        assert!(matches!(
            model.format(value, "day"),
            Err(Error::InvalidNumber)
        ))
    }
    for unit in ["DAY", "Day", "dayss", "weekday", ""] {
        assert!(matches!(model.format("1", unit), Err(Error::InvalidUnit)))
    }
    for value in [
        json!({"numeric":"yes"}),
        json!({"style":"narrower"}),
        json!({"localeMatcher":"other"}),
        json!({"numberingSystem":"bad!"}),
    ] {
        assert!(registry.create(&["en".into()], &options(value)).is_err());
    }
}
