use formatjs_intl_datetimeformat::{
    Error,
    calendar::{CalendarFields, CalendarRegistry},
    civil::TIME_CLIP_BOUND,
};
use std::sync::Arc;

#[test]
fn gregorian_and_iso_keep_era_years_and_zero_based_months() {
    let registry = CalendarRegistry::default();
    for calendar in ["gregory", "iso8601"] {
        let epoch = registry.date_from_time(calendar, 0).unwrap();
        assert_eq!(
            (epoch.era.as_str(), epoch.year, epoch.month, epoch.day),
            ("AD", 1970, 0, 1)
        );
        let zero = registry
            .date_from_time(calendar, -62_167_219_200_000)
            .unwrap();
        assert_eq!(
            (zero.era.as_str(), zero.year, zero.month, zero.day),
            ("BC", 1, 0, 1)
        );
        assert!(
            registry
                .date_from_time(calendar, TIME_CLIP_BOUND + 86_399_999)
                .is_ok()
        );
        assert_eq!(
            registry.date_from_time(calendar, TIME_CLIP_BOUND + 86_400_001),
            Err(Error::InvalidDate)
        );
    }
}

#[test]
fn optional_providers_receive_local_time_and_can_be_replaced() {
    let mut registry = CalendarRegistry::default();
    assert!(!registry.contains("custom"));
    assert_eq!(
        registry.date_from_time("custom", 123),
        Err(Error::MissingCalendar)
    );
    registry.register(
        "custom".into(),
        Arc::new(|milliseconds| {
            assert_eq!(milliseconds, 123);
            Ok(CalendarFields {
                era: "custom".into(),
                year: 42,
                month: 3,
                day: 7,
                month_name_index: Some(4),
                month_number: Some(3),
                leap_month: Some(true),
                related_year: Some(2026),
                year_name: Some(43),
            })
        }),
    );
    let captured = registry.clone();
    assert!(registry.contains("custom"));
    let fields = registry.date_from_time("custom", 123).unwrap();
    assert_eq!(
        (
            fields.year,
            fields.month_name_index,
            fields.leap_month,
            fields.related_year,
            fields.year_name
        ),
        (42, Some(4), Some(true), Some(2026), Some(43))
    );
    registry.register("custom".into(), Arc::new(|_| Err(Error::InvalidDate)));
    assert_eq!(
        registry.date_from_time("custom", 123),
        Err(Error::InvalidDate)
    );
    assert_eq!(captured.date_from_time("custom", 123).unwrap(), fields);
    registry.register("gregory".into(), Arc::new(|_| Err(Error::InvalidDate)));
    assert_eq!(registry.date_from_time("gregory", 0).unwrap().year, 1970);
}
