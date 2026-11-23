use formatjs_temporal::{
    CalendarProvider, CalendarRef, CalendarRegistry, DateFields, Duration, Error, Instant,
    Overflow, PlainDate, TemporalContext, TimeZoneRegistry, ZonedParseOptions, calendar::MonthCode,
};

#[test]
fn compiled_context_parses_all_date_classes_without_caller_table_loading() {
    let context = TemporalContext::compiled().unwrap();
    assert_eq!(context.calendars().calendars().count(), 16);
    for calendar in context.calendars().calendars() {
        let id = calendar.id();
        let date = context
            .parse_date(&format!("2020-02-29[u-ca={id}]"))
            .unwrap();
        let datetime = context
            .parse_date_time(&format!("2020-02-29T12:34:56.123456789[u-ca={id}]"))
            .unwrap();
        let ym = context
            .parse_year_month(&format!("2020-02-29[u-ca={id}]"))
            .unwrap();
        let md = context
            .parse_month_day(&format!("2020-02-29[u-ca={id}]"))
            .unwrap();
        let zoned = context
            .parse_zoned(
                &format!("2020-02-29T12:34:56.123456789+01:00[Europe/Paris][u-ca={id}]"),
                ZonedParseOptions::default(),
            )
            .unwrap();
        for actual in [
            date.calendar_id(),
            datetime.calendar_id(),
            ym.calendar_id(),
            md.calendar_id(),
            zoned.calendar_id(),
        ] {
            assert_eq!(actual, id);
        }
        assert_eq!(
            datetime.calendar_fields().unwrap(),
            date.calendar_fields().unwrap()
        );
        assert_eq!(
            zoned.local().unwrap().calendar_fields().unwrap(),
            date.calendar_fields().unwrap()
        );
        assert_eq!(
            ym.calendar_fields().unwrap().month_code,
            date.calendar_fields().unwrap().month_code
        );
        assert_eq!(
            md.calendar_fields().unwrap().month_code,
            date.calendar_fields().unwrap().month_code
        );
        assert_eq!(
            md.calendar_fields().unwrap().day,
            date.calendar_fields().unwrap().day
        );
        assert_eq!(
            zoned.instant(),
            "2020-02-29T11:34:56.123456789Z".parse::<Instant>().unwrap()
        );
        assert_eq!(context.parse_date(&date.to_string()).unwrap(), date);
        assert_eq!(
            context.parse_date_time(&datetime.to_string()).unwrap(),
            datetime
        );
        assert_eq!(context.parse_year_month(&ym.to_string()).unwrap(), ym);
        assert_eq!(context.parse_month_day(&md.to_string()).unwrap(), md);
        assert_eq!(
            context
                .parse_zoned(&zoned.to_string(), ZonedParseOptions::default())
                .unwrap()
                .instant(),
            zoned.instant()
        );
        assert!(
            context
                .parse_date(&format!("2020-02-29[u-ca={id}][!u-ca=iso8601]"))
                .is_err()
        );
    }
    for (alias, id) in [
        ("CHINESE", "chinese"),
        ("DANGI", "dangi"),
        ("ISLAMIC-UMALQURA", "islamic-umalqura"),
        ("ISLAMICC", "islamic-civil"),
        ("ETHIOPIC-AMETE-ALEM", "ethioaa"),
    ] {
        assert_eq!(
            context
                .parse_date(&format!("2020-02-29[u-ca={alias}][u-ca=unknown]"))
                .unwrap()
                .calendar_id(),
            id
        );
    }
    assert!(matches!(
        context.parse_date("2020-02-29[u-ca=unknown]"),
        Err(Error::InvalidCalendar)
    ));
    assert_eq!(
        context.parse_date("2020-02-29").unwrap().calendar_id(),
        "iso8601"
    );
}

#[test]
fn context_values_retain_borrowed_static_providers_after_context_drops() {
    let date = {
        let context = TemporalContext::compiled().unwrap();
        context.parse_date("2023-03-22[u-ca=chinese]").unwrap()
    };
    let fields = date.calendar_fields().unwrap();
    assert_eq!(
        fields.month_code,
        MonthCode {
            number: 2,
            leap: true
        }
    );
    let one_year: Duration = "P1Y".parse().unwrap();
    assert_eq!(
        date.checked_add(one_year, Overflow::Constrain)
            .unwrap()
            .calendar_fields()
            .unwrap()
            .month_code,
        MonthCode {
            number: 2,
            leap: false
        }
    );
    assert!(date.checked_add(one_year, Overflow::Reject).is_err());
    let registry = CalendarRegistry::compiled().unwrap();
    for day in [-100_000_001, 100_000_000] {
        for calendar in registry.calendars() {
            let direct = PlainDate::from_epoch_day_in(day, calendar).unwrap();
            let context = TemporalContext::new(registry, TimeZoneRegistry::empty());
            let parsed = context.parse_date(&direct.to_string()).unwrap();
            assert!(parsed.equals(direct));
            assert_eq!(
                parsed.calendar_fields().unwrap(),
                direct.calendar_fields().unwrap()
            );
        }
    }
    let chinese = registry.resolve("chinese").unwrap();
    let bag = DateFields {
        year: Some(2023),
        month_code: Some(MonthCode {
            number: 2,
            leap: true,
        }),
        day: Some(1),
        ..DateFields::default()
    };
    assert_eq!(
        PlainDate::<CalendarRef<'_>>::from_calendar_fields(chinese, bag, Overflow::Reject).unwrap(),
        date
    );
}
