use formatjs_intl_collator::{CaseFirst, Collator, Options, Sensitivity, Usage, supported_locales};
fn units(value: &str) -> Vec<u16> {
    value.encode_utf16().collect()
}
fn model(locale: &str, options: Options) -> Collator {
    Collator::new(&[locale.into()], &options).unwrap()
}
#[test]
fn sensitivity_numeric_case_and_punctuation_port_ts_examples() {
    let base = model(
        "en",
        Options {
            sensitivity: Some(Sensitivity::Base),
            ..Default::default()
        },
    );
    assert_eq!(base.compare(&units("resume"), &units("résumé")), 0);
    let accent = model(
        "en",
        Options {
            sensitivity: Some(Sensitivity::Accent),
            ..Default::default()
        },
    );
    assert_eq!(accent.compare(&units("resume"), &units("résumé")), -1);
    let numeric = model(
        "en",
        Options {
            numeric: Some(true),
            ..Default::default()
        },
    );
    assert_eq!(numeric.compare(&units("item2"), &units("item10")), -1);
    assert_eq!(numeric.compare(&units("n000"), &units("n0")), 0);
    assert_eq!(
        numeric.compare(
            &units(&format!("n{}", "9".repeat(1000))),
            &units(&format!("n1{}", "0".repeat(1000)))
        ),
        -1
    );
    for (first, expected) in [(CaseFirst::Upper, -1), (CaseFirst::Lower, 1)] {
        assert_eq!(
            model(
                "en",
                Options {
                    case_first: Some(first),
                    ..Default::default()
                }
            )
            .compare(&units("A"), &units("a")),
            expected
        );
    }
    assert_eq!(
        model(
            "en",
            Options {
                ignore_punctuation: Some(true),
                ..Default::default()
            }
        )
        .compare(&units("a—b"), &units("ab")),
        0
    );
}
#[test]
fn locale_resolution_preserves_only_effective_extensions() {
    let model = model("en-u-kn-true-kf-upper", Options::default());
    let resolved = model.resolved_options();
    assert_eq!(resolved.locale, "en-u-kf-upper-kn");
    assert!(resolved.numeric);
    assert_eq!(resolved.case_first, CaseFirst::Upper);
    let resolved = Collator::new(
        &["en-u-kn-kf-upper".into()],
        &Options {
            numeric: Some(false),
            case_first: Some(CaseFirst::Lower),
            ..Default::default()
        },
    )
    .unwrap()
    .resolved_options();
    assert_eq!(resolved.locale, "en");
    assert!(!resolved.numeric);
    assert_eq!(resolved.case_first, CaseFirst::Lower);
    assert_eq!(
        supported_locales(&["en-US-u-kn".into(), "zz-ZZ".into()]).unwrap(),
        ["en-US-u-kn"]
    );
    assert!(Collator::new(&["en_US".into()], &Options::default()).is_err());
    assert!(
        Collator::new(
            &[],
            &Options {
                collation: Some("phonebook".into()),
                ..Default::default()
            }
        )
        .is_err()
    );
}
#[test]
fn search_is_independent_of_sort_collation_and_thai_default_is_variable() {
    let sort = model("de", Options::default());
    assert_eq!(sort.compare(&units("Ä"), &units("AE")), -1);
    let search = model(
        "de-u-co-phonebk",
        Options {
            usage: Usage::Search,
            collation: Some("phonebk".into()),
            ..Default::default()
        },
    );
    assert_eq!(search.resolved_options().locale, "de");
    assert_eq!(search.resolved_options().collation, "default");
    assert_eq!(search.compare(&units("AE"), &units("Ä")), -1);
    let thai = model("th", Options::default());
    assert!(thai.resolved_options().ignore_punctuation);
    assert_eq!(thai.compare(&units("a-b"), &units("ab")), 0);
}
#[test]
fn contractions_prefixes_normalization_and_lone_surrogates() {
    assert_eq!(
        model("es-u-co-trad", Options::default()).compare(&units("cz"), &units("ch")),
        -1
    );
    assert_eq!(
        model("es", Options::default()).compare(&units("cz"), &units("ch")),
        1
    );
    let model = model("en", Options::default());
    assert_eq!(model.compare(&units("l·"), &units("lz")), -1);
    assert_eq!(model.compare(&units("é"), &units("e\u{301}")), 0);
    assert_eq!(model.compare(&[0xd800], &[0xdc00]), -1);
    assert_ne!(model.compare(&[0xd800], &[0xfffd]), 0);
    assert_eq!(model.compare(&[0xd800, 0x61], &[0xd800, 0x61]), 0);
}

#[test]
fn comparison_keys_honor_sensitivity_and_consistency() {
    let numeric = model(
        "en",
        Options {
            numeric: Some(true),
            ..Default::default()
        },
    );
    assert_eq!(numeric.compare(&units("x"), &units("x1")), -1);
    assert_eq!(numeric.compare(&units("x"), &units("x2")), -1);
    assert_eq!(numeric.compare(&units("x1"), &units("x2")), -1);
    for first in [CaseFirst::Upper, CaseFirst::Lower] {
        for sensitivity in [Sensitivity::Base, Sensitivity::Accent] {
            assert_eq!(
                model(
                    "en",
                    Options {
                        case_first: Some(first),
                        sensitivity: Some(sensitivity),
                        ..Default::default()
                    }
                )
                .compare(&units("a"), &units("A")),
                0
            );
        }
        let collator = model(
            "en",
            Options {
                case_first: Some(first),
                ..Default::default()
            },
        );
        assert_eq!(collator.compare(&units("Å"), &units("A\u{30a}")), 0);
        assert_eq!(
            collator.compare(&units("å"), &units("Å")),
            collator.compare(&units("å"), &units("A\u{30a}"))
        );
        assert_ne!(collator.compare(&units("å"), &units("Å")), 0);
    }
}

#[test]
fn sensitivity_preserves_primary_tailorings_and_ignores_secondary_only_accents() {
    for sensitivity in [Sensitivity::Base, Sensitivity::Case] {
        let collator = model(
            "sv",
            Options {
                sensitivity: Some(sensitivity),
                ..Default::default()
            },
        );
        assert_eq!(collator.compare(&units("z"), &units("ä")), -1);
        assert_ne!(collator.compare(&units("a"), &units("ä")), 0);
    }
    let search = model(
        "de",
        Options {
            usage: Usage::Search,
            sensitivity: Some(Sensitivity::Base),
            ..Default::default()
        },
    );
    assert_eq!(search.compare(&units("AE"), &units("Ä")), 0);
}
