use formatjs_temporal::{
    Error, Instant, TimeZone, TimeZoneRecord, TimeZoneRegistry, TransitionDirection, TransitionZone,
};

#[test]
fn borrowed_registry_validates_records_and_preserves_zone_identity() {
    let fixed = TransitionZone::new(3600, &[], None).unwrap();
    let paris = TimeZoneRecord::new("Europe/Paris", fixed).unwrap();
    let new_york = TimeZoneRecord::new("america/new_york", fixed).unwrap();
    let records = [new_york, paris];
    let registry = TimeZoneRegistry::new(&records).unwrap();
    let alias = registry.resolve("uS/eAsTeRn").unwrap();
    assert_eq!(alias.identifier(), "US/Eastern");
    assert_eq!(alias.primary_identifier(), "America/New_York");
    assert_eq!(alias, registry.resolve("America/New_York").unwrap());
    assert_ne!(alias, registry.resolve("Europe/Paris").unwrap());
    assert_eq!(
        alias.offset_nanoseconds(Instant::from_epoch_nanoseconds(0).unwrap()),
        3_600_000_000_000
    );
    assert_eq!(
        alias.transition(
            Instant::from_epoch_nanoseconds(0).unwrap(),
            TransitionDirection::Next
        ),
        None
    );
    assert!(TimeZoneRegistry::new(&[paris, new_york]).is_err());
    assert!(TimeZoneRegistry::new(&[paris, paris]).is_err());
    for id in ["US/Eastern", "UTC", "Etc/UTC", "Not/AZone", "+01:00"] {
        assert!(TimeZoneRecord::new(id, fixed).is_err(), "{id}");
    }
    assert_eq!(
        TimeZoneRegistry::empty().resolve("Europe/Paris"),
        Err(Error::MissingTimeZoneData)
    );
    for id in ["UTC", "utc", "Etc/UTC", "Etc/GMT0", "GMT", "Zulu"] {
        let utc = TimeZoneRegistry::empty().resolve(id).unwrap();
        assert_eq!(utc.primary_identifier(), "UTC");
        assert_eq!(
            utc.offset_nanoseconds(Instant::from_epoch_nanoseconds(0).unwrap()),
            0
        );
        assert_ne!(utc, TimeZoneRegistry::empty().resolve("+00:00").unwrap());
    }
}

#[test]
fn offset_registry_normalizes_minutes_and_rejects_non_identifiers() {
    let registry = TimeZoneRegistry::empty();
    for sign in ["+", "-"] {
        for minute in 0..1440 {
            let canonical = format!(
                "{}{hours:02}:{minutes:02}",
                if minute == 0 { "+" } else { sign },
                hours = minute / 60,
                minutes = minute % 60
            );
            let mut inputs = vec![
                format!("{sign}{:02}:{:02}", minute / 60, minute % 60),
                format!("{sign}{:02}{:02}", minute / 60, minute % 60),
            ];
            if minute % 60 == 0 {
                inputs.push(format!("{sign}{:02}", minute / 60));
            }
            let expected =
                i128::from(minute) * 60 * 1_000_000_000 * if sign == "-" { -1 } else { 1 };
            for input in inputs {
                let zone = registry.resolve(&input).unwrap();
                assert_eq!(zone.identifier(), canonical, "{input}");
                assert_eq!(zone.primary_identifier(), canonical, "{input}");
                for value in [
                    -formatjs_temporal::MAX_EPOCH_NANOSECONDS,
                    0,
                    formatjs_temporal::MAX_EPOCH_NANOSECONDS,
                ] {
                    assert_eq!(
                        zone.offset_nanoseconds(Instant::from_epoch_nanoseconds(value).unwrap()),
                        expected,
                        "{input}"
                    );
                }
                assert_eq!(zone, registry.resolve(&canonical).unwrap());
            }
        }
    }
    for id in [
        "",
        "Z",
        " UTC",
        "UTC ",
        "Not/AZone",
        "AMERİCA/NEW_YORK",
        "+24",
        "-24:00",
        "+00:60",
        "+0",
        "+0:00",
        "+01:00:00",
        "-00:00:01",
        "+00:00.1",
        "−01:00",
        "+０１:00",
        "+01:00\n",
    ] {
        assert_eq!(registry.resolve(id), Err(Error::InvalidTimeZone), "{id}");
    }
}
