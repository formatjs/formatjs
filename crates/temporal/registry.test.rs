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

#[test]
fn calendar_registry_resolves_aliases_and_rejects_missing_or_duplicate_tables() {
    use formatjs_temporal::{
        CalendarProvider, CalendarRegistry, TemporalContext,
        table_calendar::{LunisolarData, TableCalendar, TableCalendarId},
    };
    let registry = CalendarRegistry::arithmetic();
    assert_eq!(registry.calendars().count(), 13);
    for (input, expected) in [
        ("ISO8601", "iso8601"),
        ("ISLAMICC", "islamic-civil"),
        ("ETHIOPIC-AMETE-ALEM", "ethioaa"),
    ] {
        assert_eq!(registry.resolve(input).unwrap().id(), expected);
    }
    for id in ["chinese", "DANGI", "islamic-umalqura"] {
        assert!(matches!(
            registry.resolve(id),
            Err(Error::MissingCalendarData)
        ));
    }
    for id in [
        "",
        "unknown",
        "gregorian",
        "islamic",
        " hebrew",
        "hebrew ",
        "HEBRЕW",
    ] {
        assert!(
            matches!(registry.resolve(id), Err(Error::InvalidCalendar)),
            "{id}"
        );
    }
    // Tiny synthetic pack keeps this test independent of compiled data.
    let data = LunisolarData {
        first_year: 2000,
        end_day: 348,
        checkpoints: &[0],
        month_checkpoints: &[0],
        dictionary: &[0],
        years: "AA",
    };
    let chinese = TableCalendar::lunisolar(TableCalendarId::Chinese, data).unwrap();
    let dangi = TableCalendar::lunisolar(TableCalendarId::Dangi, data).unwrap();
    let selected = CalendarRegistry::new(&[dangi, chinese]).unwrap();
    assert_eq!(selected.calendars().count(), 15);
    assert_eq!(
        selected.resolve("CHINESE").unwrap().date(0).unwrap().year,
        2000
    );
    assert!(CalendarRegistry::new(&[chinese, chinese]).is_err());
    let context = TemporalContext::new(selected, TimeZoneRegistry::empty());
    assert_eq!(
        context
            .parse_date("1970-01-01[u-ca=chinese]")
            .unwrap()
            .calendar_id(),
        "chinese"
    );
    assert!(matches!(
        TemporalContext::default().parse_date("1970-01-01[u-ca=chinese]"),
        Err(Error::MissingCalendarData)
    ));
}
