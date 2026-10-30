use formatjs_intl_locale::matcher::{
    AvailableLocales, best_fit, lookup, supported, without_unicode_extension,
};

fn tags(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| (*value).to_owned()).collect()
}

#[test]
fn shared_icu4j_locale_matching_fixtures() {
    #[derive(serde::Deserialize)]
    struct Fixture {
        description: String,
        requested: Vec<String>,
        supported: Vec<String>,
        expected: String,
    }
    let fixtures: Vec<Fixture> =
        serde_json::from_str(include_str!(env!("FORMATJS_LOCALE_MATCH_FIXTURES"))).unwrap();
    assert!(!fixtures.is_empty());
    for fixture in fixtures {
        let actual = best_fit(&fixture.supported, &fixture.requested)
            .unwrap()
            .unwrap_or_else(|| fixture.supported[0].clone());
        assert_eq!(actual, fixture.expected, "{}", fixture.description);
    }
}

#[test]
fn ported_ts_best_fit_regressions() {
    for (available, requested, expected) in [
        (vec!["fr", "en"], vec!["fr-XX", "en"], Some("fr")),
        (vec!["zh", "zh-Hant"], vec!["zh-TW"], Some("zh-Hant")),
        (vec!["fr", "en"], vec!["es"], None),
        (
            vec!["en", "en-US", "fr-FR"],
            vec!["de-DE", "fr"],
            Some("fr-FR"),
        ),
        (
            vec!["en-US", "nl-NL", "nl"],
            vec!["en-GB", "en-US", "en"],
            Some("en-US"),
        ),
        (vec!["zh-Hant", "zh-MO"], vec!["zh-HK"], Some("zh-MO")),
        (vec!["en-GB", "en-US"], vec!["en-CA"], Some("en-US")),
        (vec!["es", "en", "es-419"], vec!["es-KY"], Some("es-419")),
    ] {
        assert_eq!(
            best_fit(&tags(&available), &tags(&requested))
                .unwrap()
                .as_deref(),
            expected,
            "{available:?} / {requested:?}"
        );
    }
}

#[test]
fn prefix_lookup_keeps_requested_supported_tags_and_private_use() {
    assert_eq!(
        without_unicode_extension("de-x-u-co-phonebk"),
        "de-x-u-co-phonebk"
    );
    assert_eq!(
        without_unicode_extension("de-t-en-u-co-phonebk-x-u-kn"),
        "de-t-en-x-u-kn"
    );
    let available = tags(&["de", "zh", "zh-Hant"]);
    assert_eq!(
        lookup(&available, &tags(&["zh-Hans"])).as_deref(),
        Some("zh")
    );
    let requested = tags(&[
        "de-x-u-co-phonebk",
        "de-u-co-phonebk-x-private",
        "ja",
        "de-t-en-u-co-phonebk-x-u-kn",
    ]);
    assert_eq!(
        supported(&available, &requested),
        [
            requested[0].clone(),
            requested[1].clone(),
            requested[3].clone()
        ]
    );
}

#[test]
fn winning_request_index_keeps_the_matching_unicode_extension() {
    let available = tags(&["de", "en"]);
    assert_eq!(
        formatjs_intl_locale::matcher::best_fit_requested(
            &available,
            &tags(&["en-u-kf-upper", "de"])
        )
        .unwrap(),
        Some((0, "en".into()))
    );
    let requested = tags(&["zz-ZZ-u-kn", "en-u-kf-upper"]);
    let matched =
        formatjs_intl_locale::matcher::best_fit_requested(&available, &requested).unwrap();
    assert_eq!(matched, Some((1, "en".into())));
    assert_eq!(best_fit(&available, &requested).unwrap(), Some("en".into()));
}

#[test]
fn shared_matcher_keeps_icu_priority_and_variant_ties() {
    for (available, requested, expected) in [
        (vec!["en", "sv"], vec!["en-GB", "sv"], Some("en")),
        (vec!["be-tarask", "be"], vec!["be"], Some("be-tarask")),
        (vec!["en-US", "en"], vec!["en"], Some("en")),
        (vec!["gsw"], vec!["de"], None),
        (vec!["en", "und"], vec!["und-u-nu-arab"], Some("und")),
        (vec!["zh"], vec!["ug"], None),
        (
            vec!["en-XA", "en-psaccent"],
            vec!["en-psaccent"],
            Some("en-psaccent"),
        ),
    ] {
        let available = tags(&available);
        let requested = tags(&requested);
        let owned = AvailableLocales::new(available.clone());
        assert_eq!(owned.best_fit(&tags(&["abcdefgh"])).unwrap(), None);
        for _ in 0..2 {
            assert_eq!(
                best_fit(&available, &requested).unwrap().as_deref(),
                expected
            );
            assert_eq!(owned.best_fit(&requested).unwrap().as_deref(), expected);
        }
    }
}

#[test]
fn supported_cache_uses_contents_after_same_length_replacement() {
    let mut available = tags(&["fr", "en-GB"]);
    let requested = tags(&["en-AU"]);
    assert_eq!(
        best_fit(&available, &requested).unwrap().as_deref(),
        Some("en-GB")
    );
    available[1] = "en-US".into();
    assert_eq!(
        best_fit(&available, &requested).unwrap().as_deref(),
        Some("en-US")
    );
}

#[test]
fn accepts_unknown_eight_letter_language() {
    assert_eq!(
        best_fit(&tags(&["en"]), &tags(&["fullwide"])).unwrap(),
        None
    );
}

#[test]
fn native_matcher_agrees_with_icu4j_grid() {
    let grid = std::fs::read_to_string(std::env::var("ICU_MATCHER_GRID").unwrap()).unwrap();
    let mut checked = 0;
    for line in grid.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        let available = tags(&fields[1].split(',').collect::<Vec<_>>());
        if fields[2] != available[0] {
            continue;
        }
        let requested = tags(&fields[0].split(',').collect::<Vec<_>>());
        let expected = fields[4].parse::<isize>().unwrap();
        let actual =
            formatjs_intl_locale::matcher::best_fit_requested(&available, &requested).unwrap();
        let owned = AvailableLocales::new(available.clone());
        assert_eq!(
            owned.best_fit_requested(&requested).unwrap(),
            actual,
            "{line}"
        );
        assert_eq!(owned.best_fit(&tags(&["abcdefgh"])).unwrap(), None);
        assert_eq!(
            owned.best_fit_requested(&requested).unwrap(),
            actual,
            "{line}"
        );
        assert_eq!(
            actual
                .as_ref()
                .map(|(index, _)| *index as isize)
                .unwrap_or(-1),
            expected,
            "{line}"
        );
        if let Some((_, locale)) = actual {
            assert_eq!(locale, fields[3], "{line}");
        }
        checked += 1;
    }
    assert!(checked >= 2_640);
}

#[test]
fn owned_matching_refreshes_after_registration_and_keeps_request_index() {
    let mut available = AvailableLocales::new(tags(&["en-US", "en"]));
    let requested = tags(&["qzz", "en-AU-u-nu-arab"]);
    assert_eq!(
        available.best_fit_requested(&requested).unwrap(),
        Some((1, "en-US".into()))
    );
    available.push("en-GB".into());
    assert_eq!(
        available.best_fit_requested(&requested).unwrap(),
        Some((1, "en-GB".into()))
    );
}
