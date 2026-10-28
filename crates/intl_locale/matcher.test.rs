use formatjs_intl_locale::matcher::{best_fit, lookup, supported, without_unicode_extension};

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
