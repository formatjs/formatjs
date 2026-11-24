use formatjs_intl_datetimeformat::{
    Error,
    calendar::{CalendarFields, CalendarRegistry},
    civil::TIME_CLIP_BOUND,
};
use std::sync::Arc;

#[test]
fn gregorian_and_iso_keep_signed_years_and_zero_based_months() {
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
            ("BC", 0, 0, 1)
        );
        assert!(
            registry
                .date_from_time(calendar, TIME_CLIP_BOUND + 86_399_999)
                .is_ok()
        );
        assert_eq!(
            registry.date_from_time(calendar, TIME_CLIP_BOUND + 31 * 86_400_000 + 1),
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

#[test]
fn replaced_provider_destructors_run_outside_runtime_borrows() {
    use formatjs_intl_datetimeformat::{Runtime, calendar::CalendarProvider};
    use std::{cell::Cell, rc::Rc};
    struct Reenter {
        runtime: Runtime,
        calls: Rc<Cell<usize>>,
    }
    impl CalendarProvider for Reenter {
        fn date_from_time(&self, _: i64) -> Result<CalendarFields, Error> {
            Err(Error::InvalidDate)
        }
    }
    impl Drop for Reenter {
        fn drop(&mut self) {
            self.runtime
                .register_calendar("other".into(), Arc::new(|_| Err(Error::MissingCalendar)));
            self.calls.set(self.calls.get() + 1);
        }
    }
    let runtime = Runtime::default();
    let calls = Rc::new(Cell::new(0));
    runtime.register_calendar(
        "custom".into(),
        Arc::new(Reenter {
            runtime: runtime.clone(),
            calls: calls.clone(),
        }),
    );
    runtime.register_calendar("custom".into(), Arc::new(|_| Err(Error::InvalidDate)));
    assert_eq!(calls.get(), 1);
}

#[test]
fn calendar_availability_tracks_providers_and_patterns_across_locales() {
    use formatjs_intl_datetimeformat::Runtime;
    use serde_json::{Value, json};

    let runtime = Runtime::default();
    let english = include_str!(env!("FORMATJS_DATETIME_EN"));
    let mut legacy: Value = serde_json::from_str(english).unwrap();
    legacy["data"]["ca"] = json!(["gregory"]);
    legacy["data"]["formats"]
        .as_object_mut()
        .unwrap()
        .remove("iso8601");
    runtime.add_locale_data(&legacy.to_string()).unwrap();
    let mut australian = legacy;
    australian["locale"] = json!("en-AU");
    let base = australian.to_string();
    let gregory = australian["data"]["formats"]["gregory"].clone();
    australian["data"]["formats"]["japanese"] = gregory;
    australian["data"]["ca"] = json!(["gregory", "iso8601", "japanese"]);
    runtime.add_locale_data(&australian.to_string()).unwrap();
    assert_eq!(runtime.available_calendars(), ["gregory", "iso8601"]);
    runtime.register_calendar("japanese".into(), Arc::new(|_| Err(Error::InvalidDate)));
    assert_eq!(runtime.info().unwrap().calendars, ["gregory", "iso8601"]);
    assert_eq!(
        runtime.available_calendars(),
        ["gregory", "iso8601", "japanese"]
    );
    runtime.add_locale_data(&base).unwrap();
    assert_eq!(runtime.available_calendars(), ["gregory", "iso8601"]);
}

#[test]
fn gregorian_records_preserve_signed_years_at_era_and_date_bounds() {
    let registry = CalendarRegistry::default();
    for calendar in ["gregory", "iso8601"] {
        for (milliseconds, year, month, day, era) in [
            (-TIME_CLIP_BOUND, -271821, 3, 20, "BC"),
            (-62_198_755_200_000, -1, 0, 1, "BC"),
            (-62_167_219_200_000, 0, 0, 1, "BC"),
            (-62_135_596_800_000, 1, 0, 1, "AD"),
            (0, 1970, 0, 1, "AD"),
            (TIME_CLIP_BOUND, 275760, 8, 13, "AD"),
        ] {
            assert_eq!(
                registry.date_from_time(calendar, milliseconds).unwrap(),
                CalendarFields {
                    era: era.into(),
                    year,
                    month,
                    day,
                    month_name_index: None,
                    month_number: None,
                    leap_month: None,
                    related_year: None,
                    year_name: None,
                }
            );
        }
    }
}
