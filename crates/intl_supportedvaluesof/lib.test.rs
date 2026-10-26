use formatjs_intl_supportedvaluesof::{
    InvalidKey, Key, Observation, candidates, supported_values_of,
};

fn resolved(value: &str) -> Option<Observation> {
    Some(Observation {
        resolved: Some(value.to_owned()),
        formatted: None,
    })
}

#[test]
fn keys_are_exact_and_invalid_keys_never_probe() {
    for key in Key::ALL {
        assert_eq!(key.as_str().parse::<Key>(), Ok(key));
    }
    for key in [
        "",
        "Calendar",
        "calendars",
        "numberingsystem",
        "timezone",
        "unit\0",
        "undefined",
        "null",
    ] {
        assert_eq!(
            supported_values_of(key, |_, _, _| panic!("invalid key probed")),
            Err(InvalidKey)
        );
    }
}

#[test]
fn lists_are_sorted_unique_and_runtime_specific() {
    for key in Key::ALL {
        let values = supported_values_of(key.as_str(), |_, value, _| {
            Some(Observation {
                resolved: Some(value.to_owned()),
                formatted: Some("supported name".to_owned()),
            })
        })
        .unwrap();
        assert!(!values.is_empty(), "{key:?}");
        assert!(values.windows(2).all(|pair| pair[0] < pair[1]), "{key:?}");
        assert_eq!(
            supported_values_of(key.as_str(), |_, _, _| None),
            Ok(Vec::new())
        );
    }
}

#[test]
fn aliases_and_formatter_fallbacks_are_not_advertised() {
    for key in ["calendar", "collation", "timeZone", "unit"] {
        let values = supported_values_of(key, |_, value, _| {
            if ["gregory", "emoji", "UTC", "acre"].contains(&value) {
                resolved(value)
            } else {
                resolved("fallback")
            }
        })
        .unwrap();
        assert_eq!(values.len(), 1, "{key}");
    }
    let calendars = supported_values_of("calendar", |_, value, _| {
        resolved(if value == "islamicc" {
            "islamic-civil"
        } else {
            value
        })
    })
    .unwrap();
    assert!(calendars.contains(&"gregory".to_owned()));
    assert!(!calendars.contains(&"islamicc".to_owned()));
}

#[test]
fn collations_probe_non_english_candidates_and_stop_after_success() {
    let mut successful_probes = 0;
    let values = supported_values_of("collation", |_, value, locale| {
        if value == "phonebk" && locale == "de" {
            successful_probes += 1;
            resolved(value)
        } else {
            None
        }
    })
    .unwrap();
    assert_eq!(values, ["phonebk"]);
    assert_eq!(successful_probes, 1);
    assert!(
        candidates(Key::Collation)
            .iter()
            .any(|candidate| candidate.value == "trad" && candidate.locale == "es")
    );
}

#[test]
fn currency_names_must_not_fall_back_to_the_code() {
    for text in ["USD 123", "123 USD", "USD", "USD123USD"] {
        let values = supported_values_of("currency", |_, value, _| {
            (value == "USD").then(|| Observation {
                resolved: None,
                formatted: Some(text.to_owned()),
            })
        })
        .unwrap();
        assert!(values.is_empty(), "{text}");
    }
    let values = supported_values_of("currency", |_, value, _| {
        ["USD", "EUR"].contains(&value).then(|| Observation {
            resolved: None,
            formatted: Some("123 currency names".to_owned()),
        })
    })
    .unwrap();
    assert_eq!(values, ["EUR", "USD"]);
}

#[test]
fn numbering_systems_require_accepted_latin_or_changed_digits() {
    let values = supported_values_of("numberingSystem", |_, value, _| {
        Some(Observation {
            resolved: Some(if value == "latn" { "latn" } else { "fallback" }.to_owned()),
            formatted: Some(if value == "arab" { "١٢٣" } else { "123" }.to_owned()),
        })
    })
    .unwrap();
    assert_eq!(values, ["arab", "latn"]);
}

#[test]
fn primary_time_zones_include_etcetera_but_exclude_utc_aliases() {
    let values = supported_values_of("timeZone", |_, value, _| {
        resolved(if ["Etc/UTC", "Etc/GMT"].contains(&value) {
            "UTC"
        } else {
            value
        })
    })
    .unwrap();
    for zone in [
        "America/New_York",
        "Europe/London",
        "Asia/Tokyo",
        "UTC",
        "Etc/GMT+1",
        "Etc/GMT+12",
        "Etc/GMT-1",
        "Etc/GMT-14",
    ] {
        assert!(values.iter().any(|value| value == zone), "{zone}");
    }
    assert!(!values.contains(&"Etc/UTC".to_owned()));
    assert!(!values.contains(&"Etc/GMT".to_owned()));
}

#[test]
fn callers_get_independent_owned_lists() {
    let mut first = supported_values_of("unit", |_, value, _| resolved(value)).unwrap();
    let second = supported_values_of("unit", |_, value, _| resolved(value)).unwrap();
    first.clear();
    assert!(!second.is_empty());
}
