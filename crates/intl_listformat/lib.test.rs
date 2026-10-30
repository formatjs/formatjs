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
fn scriptless_alias_prefers_likely_script_in_either_registration_order() {
    let simplified = pack("zh-Hans-HK", "{0} simplified {1}").to_string();
    let traditional = pack("zh-Hant-HK", "{0} traditional {1}").to_string();
    for order in [[&simplified, &traditional], [&traditional, &simplified]] {
        let mut registry = Registry::default();
        for data in order {
            registry.add_locale_data(data).unwrap();
        }
        let locale = registry.negotiate(&["zh-HK".into()], false).unwrap();
        assert_eq!(
            String::from_utf16(
                &registry
                    .create(&locale, &Options::default())
                    .unwrap()
                    .format(&units(&["A", "B"]))
            )
            .unwrap(),
            "A traditional B"
        );
        registry
            .add_locale_data(&pack("zh-HK", "{0} explicit {1}").to_string())
            .unwrap();
        registry.add_locale_data(&traditional).unwrap();
        assert_eq!(
            String::from_utf16(
                &registry
                    .create("zh-HK", &Options::default())
                    .unwrap()
                    .format(&units(&["A", "B"]))
            )
            .unwrap(),
            "A explicit B"
        );
    }
}

#[test]
fn both_constructors_retain_selected_type_and_style_without_registry() {
    let mut data = pack("en", "{0} and {1}");
    let kinds = [
        (Type::Conjunction, "conjunction"),
        (Type::Disjunction, "disjunction"),
        (Type::Unit, "unit"),
    ];
    let styles = [
        (Style::Long, "long"),
        (Style::Short, "short"),
        (Style::Narrow, "narrow"),
    ];
    for (_, kind) in kinds {
        for (_, style) in styles {
            data["data"][kind][style]["pair"] = json!(format!("{kind}/{style}:{{0}}|{{1}}"));
        }
    }
    let rules = Arc::new(LocalePatterns::from_json(&data.to_string()).unwrap());
    let mut registry = Registry::default();
    registry.add_locale_data(&data.to_string()).unwrap();
    let mut models = Vec::new();
    for (kind, kind_name) in kinds {
        for (style, style_name) in styles {
            let options = Options { kind, style };
            let expected = format!("{kind_name}/{style_name}:A|B");
            models.push((
                ListFormat::new(rules.clone(), options.clone()),
                expected.clone(),
            ));
            models.push((registry.create("en", &options).unwrap(), expected));
        }
    }
    drop(rules);
    drop(registry);
    for (model, expected) in models {
        assert_eq!(
            String::from_utf16(&model.format(&units(&["A", "B"]))).unwrap(),
            expected
        );
    }
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
        formatter.format(&list),
        parts
            .iter()
            .flat_map(|part| part.value.iter().copied())
            .collect::<Vec<_>>()
    );
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
    let raw = vec![vec![0xd800], vec![0xdc00, 0x0061]];
    assert_eq!(
        formatter.format(&raw),
        "before "
            .encode_utf16()
            .chain([0xdc00, 0x0061])
            .chain(" between ".encode_utf16())
            .chain([0xd800])
            .chain(" after".encode_utf16())
            .collect::<Vec<_>>()
    );
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

#[test]
fn late_locale_registration_changes_nonexact_best_fit() {
    let mut registry = Registry::default();
    registry
        .add_locale_data(&pack("en-US", "{0} and {1}").to_string())
        .unwrap();
    let requested = ["en-AU".into()];
    assert_eq!(registry.negotiate(&requested, false).unwrap(), "en-US");
    let retained = registry.create("en-US", &Options::default()).unwrap();
    registry
        .add_locale_data(&pack("en-GB", "{0} plus {1}").to_string())
        .unwrap();
    let matched = registry.negotiate(&requested, false).unwrap();
    assert_eq!(matched, "en-GB");
    let fresh = registry.create(&matched, &Options::default()).unwrap();
    assert_eq!(
        String::from_utf16(&fresh.format(&units(&["A", "B"]))).unwrap(),
        "A plus B"
    );
    assert_eq!(
        String::from_utf16(&retained.format(&units(&["A", "B"]))).unwrap(),
        "A and B"
    );
}

#[test]
fn adjacent_fields_preserve_empty_elements_without_literal_parts() {
    let mut data = pack("en", "{0}{1}");
    for name in ["start", "middle", "end"] {
        data["data"]["conjunction"]["long"][name] = json!("{0}{1}");
    }
    let formatter = ListFormat::new(
        Arc::new(LocalePatterns::from_json(&data.to_string()).unwrap()),
        Options::default(),
    );
    let list = units(&["", "B", ""]);
    assert_eq!(formatter.format(&list), units(&["B"])[0]);
    let parts = formatter.format_to_parts(&list);
    assert_eq!(
        parts
            .iter()
            .map(|part| (part.kind, String::from_utf16(&part.value).unwrap()))
            .collect::<Vec<_>>(),
        [
            ("element", "".into()),
            ("element", "B".into()),
            ("element", "".into())
        ]
    );
}

#[test]
fn decorated_reversed_chain_retains_each_literal_boundary() {
    let mut data = pack("en", "{0} and {1}");
    data["data"]["conjunction"]["long"]["start"] = json!("s[{0}|{1}]");
    data["data"]["conjunction"]["long"]["middle"] = json!("m({1}/{0})");
    data["data"]["conjunction"]["long"]["end"] = json!("e<{0}:{1}>");
    let formatter = ListFormat::new(
        Arc::new(LocalePatterns::from_json(&data.to_string()).unwrap()),
        Options::default(),
    );
    let list = units(&["A", "B", "C", "D"]);
    assert_eq!(
        String::from_utf16(&formatter.format(&list)).unwrap(),
        "s[A|m(e<C:D>/B)]"
    );
    assert_eq!(
        formatter
            .format_to_parts(&list)
            .iter()
            .map(|part| (part.kind, String::from_utf16(&part.value).unwrap()))
            .collect::<Vec<_>>(),
        [
            ("literal", "s["),
            ("element", "A"),
            ("literal", "|"),
            ("literal", "m("),
            ("literal", "e<"),
            ("element", "C"),
            ("literal", ":"),
            ("element", "D"),
            ("literal", ">"),
            ("literal", "/"),
            ("element", "B"),
            ("literal", ")"),
            ("literal", "]")
        ]
        .map(|(kind, value)| (kind, value.to_owned()))
    );
}

#[test]
fn join_plan_matches_selected_templates_and_rejects_nonconstant_shapes() {
    for locale in ["en", "es", "he"] {
        for (start, middle, end, admitted) in [
            ("{0}, {1}", "{0}, {1}", "{0}, and {1}", true),
            ("{0}{1}", "{0}{1}", "{0}😀{1}", true),
            ("{0}; {1}", "{0}, {1}", "{0} & {1}", false),
            ("prefix{0}{1}", "{0}, {1}", "{0} & {1}", false),
            ("{0}, {1}", "{0}, {1}", "{1} & {0}", false),
            ("{0}, {1}", "{0}, {1}", "{0}{1}suffix", false),
            ("{0}, {1}", "{0}, {1}", "{0} y {1}", locale != "es"),
            ("{0}, {1}", "{0}, {1}", "{0} o {1}", locale != "es"),
            ("{0}, {1}", "{0}, {1}", "{0} ו{1}", locale != "he"),
        ] {
            let mut data = pack(locale, "{1} pair {0}");
            for kind in ["conjunction", "disjunction", "unit"] {
                for style in ["long", "short", "narrow"] {
                    data["data"][kind][style]["start"] = json!(start);
                    data["data"][kind][style]["middle"] = json!(middle);
                    data["data"][kind][style]["end"] = json!(end);
                }
            }
            let model = ListFormat::new(
                Arc::new(LocalePatterns::from_json(&data.to_string()).unwrap()),
                Options::default(),
            );
            let plan = model.join_plan();
            assert_eq!(plan.is_some(), admitted, "{locale}/{start}/{middle}/{end}");
            if let Some(plan) = plan {
                for length in [3, 5, 8, 9, 16, 32, 256, 1025] {
                    let list: Vec<Vec<u16>> = (0..length)
                        .map(|i| match i % 4 {
                            0 => vec![],
                            1 => vec![0xd800],
                            2 => vec![0xdc00, 0],
                            _ => vec![0x61],
                        })
                        .collect();
                    let mut joined = Vec::new();
                    for (index, value) in list.iter().enumerate() {
                        if index > 0 {
                            joined.extend(
                                if index == length - 1 {
                                    &plan.last_separator
                                } else {
                                    &plan.separator
                                }
                                .encode_utf16(),
                            );
                        }
                        joined.extend(value);
                    }
                    assert_eq!(model.format(&list), joined);
                }
            }
        }
    }
}
