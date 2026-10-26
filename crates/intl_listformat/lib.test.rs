use formatjs_intl_listformat::{
    ListFormat, LocalePatterns, Options, Style, Type, registry::Registry,
};
use serde_json::{Value, json};
use std::sync::Arc;

fn pack(locale: &str, pair: &str) -> Value {
    let templates =
        json!({"pair":pair,"start":"{0}, {1}","middle":"{0}, {1}","end":"{0}, and {1}"});
    let styles = json!({"long":templates,"short":templates,"narrow":templates});
    json!({"formatVersion":1,"locale":locale,"data":{"conjunction":styles,"disjunction":styles,"unit":styles}})
}
fn units(values: &[&str]) -> Vec<Vec<u16>> {
    values
        .iter()
        .map(|value| value.encode_utf16().collect())
        .collect()
}
fn formatter() -> ListFormat {
    ListFormat::new(
        Arc::new(LocalePatterns::from_json(&pack("en", "{0} and {1}").to_string()).unwrap()),
        Options::default(),
    )
}

#[test]
fn ported_english_lengths_and_parts() {
    let formatter = formatter();
    for (list, expected) in [
        (vec![], ""),
        (vec![""], ""),
        (vec!["A"], "A"),
        (vec!["A", "B"], "A and B"),
        (vec!["A", "B", "C"], "A, B, and C"),
        (vec!["A", "B", "C", "D"], "A, B, C, and D"),
        (vec!["{1}", "😀"], "{1} and 😀"),
    ] {
        assert_eq!(
            String::from_utf16(&formatter.format(&units(&list))).unwrap(),
            expected
        );
    }
    let parts = formatter.format_to_parts(&units(&["", "B"]));
    assert_eq!(parts.len(), 3);
    assert_eq!(parts[0].kind, "element");
    assert!(parts[0].value.is_empty());
    assert_eq!(parts[1].kind, "literal");
    assert_eq!(String::from_utf16(&parts[1].value).unwrap(), " and ");
    assert_eq!(formatter.format_to_parts(&units(&[""])).len(), 1);
}

#[test]
fn preserves_utf16_and_large_lists_without_recursion() {
    let formatter = formatter();
    let input = vec![vec![0xd800], vec![0xdc00, 0, 0x0061]];
    let parts = formatter.format_to_parts(&input);
    assert_eq!(parts[0].value, input[0]);
    assert_eq!(parts[2].value, input[1]);
    let list = vec![vec![0x0061]; 20_000];
    let parts = formatter.format_to_parts(&list);
    assert_eq!(
        parts.iter().filter(|part| part.kind == "element").count(),
        list.len()
    );
    assert_eq!(parts.len(), 2 * list.len() - 1);
}

#[test]
fn deconstructs_reversed_placeholders_and_retains_literal_boundaries() {
    let data =
        LocalePatterns::from_json(&pack("en", "before {1} between {0} after").to_string()).unwrap();
    let formatter = ListFormat::new(
        Arc::new(data),
        Options {
            kind: Type::Unit,
            style: Style::Narrow,
        },
    );
    assert_eq!(
        String::from_utf16(&formatter.format(&units(&["A", "B"]))).unwrap(),
        "before B between A after"
    );
    assert_eq!(formatter.format_to_parts(&units(&["A", "B"])).len(), 5);
}

#[test]
fn rejects_incomplete_invalid_or_duplicate_templates_before_registration() {
    let mut registry = Registry::default();
    for pattern in ["{0}", "{0}{0}{1}", "{2}{1}", "{0}{1}}", "}{0}{1}"] {
        assert!(
            registry
                .add_locale_data(&pack("fr", pattern).to_string())
                .is_err()
        );
        assert!(registry.available_locales().is_empty());
    }
    let mut invalid = pack("fr", "{0} et {1}");
    invalid["data"]["unit"]
        .as_object_mut()
        .unwrap()
        .remove("narrow");
    assert!(registry.add_locale_data(&invalid.to_string()).is_err());
    assert!(registry.default_locale().is_none());
}

#[test]
fn lazy_packs_aliases_replacement_and_owned_instances() {
    let mut registry = Registry::default();
    assert!(registry.negotiate(&["en".into()], false).is_err());
    let mut english = pack("en", "{0} and {1}");
    english["aliases"] = json!(["en-US"]);
    registry.add_locale_data(&english.to_string()).unwrap();
    assert!(registry.supported_locales(&["fr".into()]).is_empty());
    assert_eq!(
        registry
            .negotiate(&["en-US-u-nu-latn".into()], true)
            .unwrap(),
        "en-US"
    );
    let old = registry.create("en-US", &Options::default()).unwrap();
    registry
        .add_locale_data(&pack("fr", "{0} et {1}").to_string())
        .unwrap();
    assert_eq!(
        registry.supported_locales(&["fr-u-nu-latn".into()]),
        ["fr-u-nu-latn"]
    );
    registry
        .add_locale_data(&pack("en-US", "{0} & {1}").to_string())
        .unwrap();
    registry.add_locale_data(&english.to_string()).unwrap();
    let new = registry.create("en-US", &Options::default()).unwrap();
    drop(registry);
    assert_eq!(
        String::from_utf16(&old.format(&units(&["A", "B"]))).unwrap(),
        "A and B"
    );
    assert_eq!(
        String::from_utf16(&new.format(&units(&["A", "B"]))).unwrap(),
        "A & B"
    );
    assert_eq!(new.resolved_options().locale, "en-US");
}
