use formatjs_intl_locale::{Locale, LocaleOptions, validate_option};

fn locale(tag: &str) -> Locale {
    Locale::new(tag, &LocaleOptions::default()).unwrap()
}

#[test]
fn canonicalizes_before_overrides_and_preserves_extensions() {
    assert_eq!(
        locale("iw-BU-u-ca-islamicc").as_str(),
        "he-MM-u-ca-islamic-civil"
    );
    let result = Locale::new(
        "de-1901-u-nu-latn-x-private",
        &LocaleOptions {
            variants: Some("FONIPA".to_owned()),
            numeric: Some(true),
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(result.as_str(), "de-fonipa-u-kn-nu-latn-x-private");
    assert!(result.numeric());
    assert_eq!(result.variants().as_deref(), Some("fonipa"));
    assert_eq!(result.base_name(), "de-fonipa");
}

#[test]
fn validates_options_without_accepting_duplicate_variants() {
    for (key, value) in [
        ("language", "abcd"),
        ("script", "ABC"),
        ("region", "1234"),
        ("variants", "1901-1901"),
        ("variants", "fonipa-FONIPA"),
        ("variants", ""),
        ("calendar", "ab"),
        ("hourCycle", "H12"),
        ("caseFirst", "Upper"),
        ("firstDayOfWeek", "08"),
        ("numberingSystem", "foo_bar"),
    ] {
        assert!(validate_option(key, value).is_err(), "{key} {value}");
    }
    for (key, value) in [
        ("language", "abcde"),
        ("script", "latn"),
        ("region", "419"),
        ("variants", "1901-fonipa"),
        ("calendar", "islamic-civil"),
        ("firstDayOfWeek", "0"),
    ] {
        assert!(validate_option(key, value).is_ok(), "{key} {value}");
    }
    for tag in ["", "root", "en_US", "abcd", "en-1901-1901", "x-private"] {
        assert!(
            Locale::new(tag, &LocaleOptions::default()).is_err(),
            "{tag}"
        );
    }
}

#[test]
fn keyword_options_are_canonical_and_restricted() {
    let result = Locale::new(
        "en-u-ca-buddhist-co-phonebk",
        &LocaleOptions {
            calendar: Some("islamicc".to_owned()),
            first_day_of_week: Some("7".to_owned()),
            numbering_system: Some("ARAB".to_owned()),
            numeric: Some(false),
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(result.keyword("ca"), Some("islamic-civil"));
    assert_eq!(result.keyword("fw"), Some("sun"));
    assert!(!result.numeric());
    assert_eq!(result.calendars(), ["islamic-civil"]);
    assert_eq!(
        result.collations(&[], false, |_| panic!("restricted collation probed")),
        ["phonebk"]
    );
    assert_eq!(
        result.numbering_systems_with(|| panic!("restricted numbering system probed")),
        ["arab"]
    );
    assert!(locale("en-u-kn").numeric());
    assert!(!locale("en-u-kn-true-foo").numeric());
}

#[test]
fn maximizes_known_tags_without_inventing_unknown_language_matches() {
    for (tag, expected) in [
        ("en", "en-Latn-US"),
        ("en-Shaw", "en-Shaw-GB"),
        ("en-Arab", "en-Arab-US"),
        ("und-Thai", "th-Thai-TH"),
        ("und-419", "es-Latn-419"),
        ("und-AT", "de-Latn-AT"),
        ("und-Cyrl-RO", "bg-Cyrl-RO"),
        ("und-AQ", "en-Latn-AQ"),
        ("it-Kana-CA", "it-Kana-CA"),
        ("abcde-Armn", "abcde-Armn"),
    ] {
        for suffix in ["", "-fonipa", "-a-extend-u-co-phonebk-x-private"] {
            assert_eq!(
                locale(&format!("{tag}{suffix}")).maximize().to_string(),
                format!("{expected}{suffix}")
            );
        }
    }
}

#[test]
fn minimizes_maximized_components_preserving_variants_and_extensions() {
    for (tag, expected) in [
        ("und", "en"),
        ("und-Thai", "th"),
        ("und-419", "es-419"),
        ("und-150", "en-150"),
        ("und-AT", "de-AT"),
        ("aae-Latn-IT", "aae"),
        ("aae-Thai-CO", "aae-Thai-CO"),
        ("und-CW", "pap"),
        ("und-US", "en"),
        ("zh-Hant", "zh-TW"),
        ("zh-Hani", "zh-Hani"),
    ] {
        assert_eq!(locale(tag).minimize().to_string(), expected, "{tag}");
    }
    assert_eq!(
        locale("und-fonipa-u-nu-arab").minimize().to_string(),
        "en-fonipa-u-nu-arab"
    );
}

#[test]
fn preferences_respect_region_override_subdivision_and_explicit_region() {
    assert_eq!(locale("ja").calendars(), ["gregory", "japanese"]);
    assert_eq!(
        locale("ar-EG").calendars(),
        [
            "gregory",
            "coptic",
            "islamic",
            "islamic-civil",
            "islamic-tbla"
        ]
    );
    assert_eq!(
        locale("en-US-u-rg-gbzzzz").week_info(),
        locale("en-GB").week_info()
    );
    assert_eq!(
        locale("en-u-sd-gbeng").week_info(),
        locale("en-GB").week_info()
    );
    assert_eq!(
        locale("en-US-u-sd-gbeng").week_info(),
        locale("en-US").week_info()
    );
    assert_eq!(
        locale("en-US-u-rg-qqzzzz").week_info(),
        locale("en-US").week_info()
    );
    assert_eq!(locale("en-US-u-fw-sun").week_info().first_day, 7);
    assert_eq!(locale("en-US-u-fw-mon").week_info().first_day, 1);
    assert_eq!(
        locale("en-US-u-fw-xyz").week_info(),
        locale("en-US").week_info()
    );
}

#[test]
fn info_uses_explicit_regions_and_script_metadata_not_extension_spelling() {
    assert_eq!(
        locale("ar-EG").time_zones(),
        Some(vec!["Africa/Cairo".to_owned()])
    );
    assert_eq!(locale("ar").time_zones(), None);
    assert_eq!(locale("ar-u-rg-egzzzz").time_zones(), None);
    assert_eq!(
        locale("ar-u-ca-gregory").text_info().direction.as_deref(),
        Some("rtl")
    );
    assert_eq!(
        locale("en-Arab").text_info().direction.as_deref(),
        Some("rtl")
    );
    assert_eq!(
        locale("ar-Latn").text_info().direction.as_deref(),
        Some("ltr")
    );
    assert_eq!(locale("und-Zzzz").text_info().direction, None);
    assert_eq!(locale("abcde").text_info().direction, None);
}

#[test]
fn runtime_preferences_are_uncached_and_owned() {
    let value = locale("en");
    assert_eq!(value.numbering_systems(Some("arab")), ["arab"]);
    assert_eq!(value.numbering_systems(None), ["latn"]);
    let values = [
        "phonebk".to_owned(),
        "emoji".to_owned(),
        "emoji".to_owned(),
        "search".to_owned(),
    ];
    assert_eq!(
        value.collations(&values, true, |value| value != "phonebk"),
        ["emoji"]
    );
    assert_eq!(value.collations(&[], false, |_| false), ["emoji", "eor"]);
    let mut first = value.week_info();
    first.weekend.clear();
    assert!(!value.week_info().weekend.is_empty());
    let mut calendars = value.calendars();
    calendars.clear();
    assert!(!value.calendars().is_empty());
}

#[test]
fn subtag_widths_preserve_owned_records_and_overrides() {
    for language in ["zz", "qaa", "abcde", "abcdef", "abcdefg", "abcdefgh"] {
        let tag = format!("{language}-Latn-419-fonipa-a-first-u-attr-ca-gregory-kn-x-private");
        let model = locale(&tag);
        drop(tag);
        assert_eq!(model.language(), language);
        assert_eq!(model.script(), Some("Latn"));
        assert_eq!(model.region(), Some("419"));
        assert_eq!(model.variants().as_deref(), Some("fonipa"));
        assert!(model.numeric());
        assert_eq!(model.keyword("ca"), Some("gregory"));
        assert_eq!(model.maximize().as_str(), model.as_str());
        assert_eq!(model.minimize().maximize().as_str(), model.as_str());
        let snapshot = model.snapshot(None);
        assert_eq!(snapshot.language, language);
        assert_eq!(snapshot.script.as_deref(), Some("Latn"));
        assert_eq!(snapshot.region.as_deref(), Some("419"));
    }
    let options = LocaleOptions {
        language: Some("ABCDEFGH".to_owned()),
        script: Some("latn".to_owned()),
        region: Some("419".to_owned()),
        ..Default::default()
    };
    let model = Locale::new("en-x-private", &options).unwrap();
    drop(options);
    assert_eq!(model.as_str(), "abcdefgh-Latn-419-x-private");
}
