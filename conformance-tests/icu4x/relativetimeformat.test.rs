use fixed_decimal::Decimal;
use formatjs_intl_relativetimeformat::{Options, registry::Registry};
use icu_experimental::relativetime::{
    RelativeTimeFormatter, RelativeTimeFormatterOptions, options::Numeric,
};
use icu_locale::Locale;

#[test]
fn relative_outputs_match_pinned_icu4x_after_repeated_construction() {
    let registry = Registry::with_compiled_data();
    let rows =
        std::fs::read_to_string(std::env::var("RELATIVE_TIME_DIFFERENCES").unwrap()).unwrap();
    let mut known = std::collections::BTreeMap::new();
    for row in rows.lines().skip(1) {
        let f: Vec<_> = row.split('\t').collect();
        assert_eq!(f.len(), 8);
        assert_ne!(f[6], f[7]);
        assert!(known.insert(f[..6].join("\t"), (f[6], f[7])).is_none());
    }
    let mut used = 0;
    let mut checked = 0;
    let mut differences = Vec::new();
    for tag in [
        "en",
        "fr",
        "de",
        "ar",
        "hi",
        "ru",
        "pl",
        "zh-TW",
        "zh-HK",
        "zh-Hant-HK",
        "ja",
        "fa",
    ] {
        for system in [None, Some("latn"), Some("arab")] {
            let oracle_tag =
                system.map_or_else(|| tag.to_owned(), |system| format!("{tag}-u-nu-{system}"));
            let locale: Locale = oracle_tag.parse().unwrap();
            for style in ["long", "short", "narrow"] {
                for numeric in ["always", "auto"] {
                    let model = registry
                        .create(
                            &[tag.to_owned()],
                            &Options {
                                numbering_system: system.map(str::to_owned),
                                style: Some(style.into()),
                                numeric: Some(numeric.into()),
                                ..Default::default()
                            },
                        )
                        .unwrap();
                    let mut options = RelativeTimeFormatterOptions::default();
                    options.numeric = if numeric == "always" {
                        Numeric::Always
                    } else {
                        Numeric::Auto
                    };
                    for unit in [
                        "second", "minute", "hour", "day", "week", "month", "quarter", "year",
                    ] {
                        let prefs = locale.clone().into();
                        let oracle = match (style, unit) {
                            ("long", "second") => {
                                RelativeTimeFormatter::try_new_long_second(prefs, options)
                            }
                            ("long", "minute") => {
                                RelativeTimeFormatter::try_new_long_minute(prefs, options)
                            }
                            ("long", "hour") => {
                                RelativeTimeFormatter::try_new_long_hour(prefs, options)
                            }
                            ("long", "day") => {
                                RelativeTimeFormatter::try_new_long_day(prefs, options)
                            }
                            ("long", "week") => {
                                RelativeTimeFormatter::try_new_long_week(prefs, options)
                            }
                            ("long", "month") => {
                                RelativeTimeFormatter::try_new_long_month(prefs, options)
                            }
                            ("long", "quarter") => {
                                RelativeTimeFormatter::try_new_long_quarter(prefs, options)
                            }
                            ("long", "year") => {
                                RelativeTimeFormatter::try_new_long_year(prefs, options)
                            }
                            ("short", "second") => {
                                RelativeTimeFormatter::try_new_short_second(prefs, options)
                            }
                            ("short", "minute") => {
                                RelativeTimeFormatter::try_new_short_minute(prefs, options)
                            }
                            ("short", "hour") => {
                                RelativeTimeFormatter::try_new_short_hour(prefs, options)
                            }
                            ("short", "day") => {
                                RelativeTimeFormatter::try_new_short_day(prefs, options)
                            }
                            ("short", "week") => {
                                RelativeTimeFormatter::try_new_short_week(prefs, options)
                            }
                            ("short", "month") => {
                                RelativeTimeFormatter::try_new_short_month(prefs, options)
                            }
                            ("short", "quarter") => {
                                RelativeTimeFormatter::try_new_short_quarter(prefs, options)
                            }
                            ("short", "year") => {
                                RelativeTimeFormatter::try_new_short_year(prefs, options)
                            }
                            ("narrow", "second") => {
                                RelativeTimeFormatter::try_new_narrow_second(prefs, options)
                            }
                            ("narrow", "minute") => {
                                RelativeTimeFormatter::try_new_narrow_minute(prefs, options)
                            }
                            ("narrow", "hour") => {
                                RelativeTimeFormatter::try_new_narrow_hour(prefs, options)
                            }
                            ("narrow", "day") => {
                                RelativeTimeFormatter::try_new_narrow_day(prefs, options)
                            }
                            ("narrow", "week") => {
                                RelativeTimeFormatter::try_new_narrow_week(prefs, options)
                            }
                            ("narrow", "month") => {
                                RelativeTimeFormatter::try_new_narrow_month(prefs, options)
                            }
                            ("narrow", "quarter") => {
                                RelativeTimeFormatter::try_new_narrow_quarter(prefs, options)
                            }
                            ("narrow", "year") => {
                                RelativeTimeFormatter::try_new_narrow_year(prefs, options)
                            }
                            _ => unreachable!(),
                        }
                        .unwrap();
                        for text in [
                            "-1234.5", "-3", "-2", "-1", "-0", "0", "1", "1.25", "2", "3", "1234.5",
                        ] {
                            let expected =
                                oracle.format(text.parse::<Decimal>().unwrap()).to_string();
                            let actual = model.format(text, unit).unwrap();
                            let key = format!(
                                "{tag}\t{}\t{style}\t{numeric}\t{unit}\t{text}",
                                system.unwrap_or("_")
                            );
                            let number = text.parse::<f64>().unwrap();
                            assert_eq!(
                                model.format_number(number, unit).unwrap(),
                                actual,
                                "Numeric path changed: {key}"
                            );
                            assert_eq!(
                                model.format_to_parts_number(number, unit).unwrap(),
                                model.format_to_parts(text, unit).unwrap(),
                                "Numeric parts changed: {key}"
                            );
                            if let Some((preferred, icu4x)) = known.get(&key) {
                                assert_eq!(actual, *preferred, "Preferred oracle changed: {key}");
                                assert_eq!(expected, *icu4x, "ICU4X oracle changed: {key}");
                                used += 1;
                            } else if actual != expected {
                                differences.push(format!("{key}\t{actual}\t{expected}"));
                            }
                            checked += 1;
                        }
                    }
                }
            }
        }
    }
    assert_eq!(used, known.len(), "Unused ICU4X differences");
    assert!(
        differences.is_empty(),
        "{} of {checked} cases differ:\n{}",
        differences.len(),
        differences
            .iter()
            .take(12)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
    println!("ICU4X relative time: {checked} cases checked; {used} C/J-verified differences");
}
