use formatjs_intl_collator as collator;
use formatjs_intl_datetimeformat as datetime;
use formatjs_intl_displaynames as display;
use formatjs_intl_durationformat as duration;
use formatjs_intl_getcanonicallocales as canonical;
use formatjs_intl_listformat as list;
use formatjs_intl_locale as locale;
use formatjs_intl_localematcher::LocaleMatcher;
use formatjs_intl_numberformat as number;
use formatjs_intl_pluralrules as plural;
use formatjs_intl_relativetimeformat as relative;
use formatjs_intl_segmenter as segment;
use formatjs_intl_supportedvaluesof as supported;
use serde_json::{Value, json};
use std::{hint::black_box, time::Instant};

const NUMBERS: [&str; 9] = [
    "0", "-0", "1.025", "-1.025", "1234.5", "999.5", "999999.5", "1e-7", "1e21",
];
const DATES: [f64; 2] = [1705326312345.0, 1721005542678.0];

fn measure(results: &mut Vec<Value>, name: &str, mut call: impl FnMut(usize) -> usize) {
    let mut checksum = 0usize;
    let mut batch = |count: usize| {
        let start = Instant::now();
        for i in 0..count {
            checksum = checksum.wrapping_add(black_box(call(black_box(i))));
        }
        start.elapsed().as_secs_f64()
    };
    let mut count = 1;
    while batch(count) < 0.05 {
        count *= 2;
    }
    let mut samples: Vec<_> = (0..7).map(|_| batch(count) * 1e6 / count as f64).collect();
    samples.sort_by(f64::total_cmp);
    eprintln!("Rust: {name}: {:.3} us", samples[3]);
    results.push(json!({"name":name,"implementation":"rust","iterationsPerRound":count,"medianMicroseconds":samples[3],"minMicroseconds":samples[0],"maxMicroseconds":samples[6],"roundMicroseconds":samples,"operationsPerSecond":1e6/samples[3],"checksum":checksum}));
}

fn date(runtime: &datetime::Runtime, options: &Value) -> datetime::DateTimeFormat {
    let construction = runtime.begin();
    let early = serde_json::from_value(options.clone()).unwrap();
    let resolution = construction.resolve(&["en".into()], &early).unwrap();
    let zone = construction
        .time_zone(options.get("timeZone").and_then(Value::as_str))
        .unwrap();
    let fields = serde_json::from_value(options.clone()).unwrap();
    let late = serde_json::from_value(options.clone()).unwrap();
    let config = construction
        .capture(resolution, fields)
        .unwrap()
        .select(&late)
        .unwrap();
    construction.finish(config, zone)
}

fn main() {
    let mut results = Vec::new();
    let requested = vec!["en".to_owned()];
    let mut numbers = number::registry::Registry::default();
    numbers
        .add_locale_data(include_str!(env!("BENCH_NUMBERFORMAT")))
        .unwrap();
    let runtime = datetime::Runtime::default();
    runtime
        .add_locale_data(include_str!(env!("BENCH_DATETIMEFORMAT")))
        .unwrap();
    runtime
        .time_zones()
        .load_json(include_str!(env!("BENCH_TIMEZONES")))
        .unwrap();
    let mut displays = display::registry::Registry::default();
    displays
        .add_locale_data(include_str!(env!("BENCH_DISPLAYNAMES")))
        .unwrap();
    let mut lists = list::registry::Registry::default();
    lists
        .add_locale_data(include_str!(env!("BENCH_LISTFORMAT")))
        .unwrap();
    let mut plurals = plural::registry::Registry::default();
    plurals
        .add_locale_data(include_str!(env!("BENCH_PLURALRULES")))
        .unwrap();
    let mut relatives = relative::registry::Registry::default();
    relatives
        .add_locale_data(include_str!(env!("BENCH_RELATIVETIMEFORMAT")))
        .unwrap();
    let mut renderer = duration::Renderer::default();
    renderer
        .add_number_data(include_str!(env!("BENCH_NUMBERFORMAT")))
        .unwrap();
    renderer
        .add_list_data(include_str!(env!("BENCH_LISTFORMAT")))
        .unwrap();

    for (name, options) in [
        ("decimal", json!({})),
        ("currency", json!({"style":"currency","currency":"USD"})),
        (
            "unit",
            json!({"style":"unit","unit":"meter","unitDisplay":"long"}),
        ),
        ("percent", json!({"style":"percent"})),
        ("scientific", json!({"notation":"scientific"})),
        ("compact", json!({"notation":"compact"})),
        ("significant digits", json!({"maximumSignificantDigits":3})),
    ] {
        let options: number::Options = serde_json::from_value(options).unwrap();
        let formatter = numbers.create(&requested, &options).unwrap();
        measure(&mut results, &format!("NumberFormat format {name}"), |i| {
            black_box(formatter.format(NUMBERS[i % 9]).unwrap()).len()
        });
        if name == "decimal" {
            measure(&mut results, "NumberFormat formatToParts", |i| {
                black_box(formatter.format_to_parts(NUMBERS[i % 9]).unwrap()).len()
            });
            measure(&mut results, "NumberFormat formatRange", |_| {
                black_box(formatter.format_range("1234.5", "6789.5").unwrap()).len()
            });
            measure(&mut results, "NumberFormat formatRangeToParts", |_| {
                black_box(formatter.format_range_to_parts("1234.5", "6789.5").unwrap()).len()
            });
            let integers: Vec<_> = (0..60).map(|i| i.to_string()).collect();
            measure(&mut results, "NumberFormat time values x60", |_| {
                integers
                    .iter()
                    .map(|s| black_box(formatter.format(s).unwrap()).len())
                    .sum()
            });
        }
    }
    measure(&mut results, "NumberFormat construct", |_| {
        black_box(numbers.create(&requested, &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });

    for (name, options) in [
        ("date", json!({"timeZone":"UTC"})),
        (
            "date time",
            json!({"timeZone":"UTC","dateStyle":"medium","timeStyle":"medium"}),
        ),
        (
            "fractional seconds",
            json!({"timeZone":"UTC","hour":"2-digit","minute":"2-digit","second":"2-digit","fractionalSecondDigits":3}),
        ),
        (
            "zone name",
            json!({"timeZone":"America/New_York","dateStyle":"full","timeStyle":"long"}),
        ),
    ] {
        let formatter = date(&runtime, &options);
        measure(
            &mut results,
            &format!("DateTimeFormat format {name}"),
            |i| {
                black_box(
                    formatter
                        .format(&datetime::DateTimeValue::Number(DATES[i % 2]))
                        .unwrap(),
                )
                .len()
            },
        );
        if name == "date" {
            measure(&mut results, "DateTimeFormat formatToParts", |i| {
                black_box(
                    formatter
                        .format_to_parts(&datetime::DateTimeValue::Number(DATES[i % 2]))
                        .unwrap(),
                )
                .len()
            });
            let a = datetime::DateTimeValue::Number(DATES[0]);
            let b = datetime::DateTimeValue::Number(DATES[1]);
            measure(&mut results, "DateTimeFormat formatRange", |_| {
                black_box(formatter.format_range(&a, &b).unwrap()).len()
            });
            measure(&mut results, "DateTimeFormat formatRangeToParts", |_| {
                black_box(formatter.format_range_to_parts(&a, &b).unwrap()).len()
            });
        }
    }
    measure(&mut results, "DateTimeFormat construct", |_| {
        black_box(date(&runtime, &json!({"timeZone":"UTC"})))
            .resolved_options()
            .locale
            .len()
    });

    for (name, tag, options, left, right) in [
        ("Latin", "en", json!({}), "apple", "banana"),
        ("accent", "en", json!({}), "café", "cafe"),
        (
            "numeric",
            "en",
            json!({"numeric":true}),
            "item 9",
            "item 10",
        ),
        ("normalization", "en", json!({}), "café", "cafe\u{301}"),
        ("Swedish", "sv", json!({}), "zebra", "ångström"),
        ("CJK", "zh", json!({}), "中文", "汉字"),
    ] {
        let formatter =
            collator::Collator::new(&[tag.into()], &serde_json::from_value(options).unwrap())
                .unwrap();
        let left: Vec<u16> = left.encode_utf16().collect();
        let right: Vec<u16> = right.encode_utf16().collect();
        measure(&mut results, &format!("Collator compare {name}"), |i| {
            usize::from(
                black_box(if i % 2 == 0 {
                    formatter.compare(&right, &left)
                } else {
                    formatter.compare(&left, &right)
                }) != 0,
            )
        });
    }
    measure(&mut results, "Collator construct", |_| {
        black_box(collator::Collator::new(&requested, &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    let texts: Vec<Vec<u16>> = [
        "Hello, world! Café 👨‍👩‍👧‍👦. A second sentence.",
        "日本語の文章です。Hello again!",
    ]
    .iter()
    .map(|s| s.encode_utf16().collect())
    .collect();
    for (name, granularity) in [
        ("grapheme", segment::Granularity::Grapheme),
        ("word", segment::Granularity::Word),
        ("sentence", segment::Granularity::Sentence),
    ] {
        let formatter = segment::Segmenter::new(
            &requested,
            &segment::Options {
                granularity,
                ..Default::default()
            },
        )
        .unwrap();
        measure(&mut results, &format!("Segmenter iterate {name}"), |i| {
            black_box(formatter.segment(texts[i % 2].clone()))
                .iter()
                .map(|s| black_box(s).segment.len())
                .sum()
        });
        measure(&mut results, &format!("Segmenter containing {name}"), |i| {
            black_box(formatter.segment(texts[i % 2].clone()))
                .containing(7)
                .map(|s| black_box(s).segment.len())
                .unwrap()
        });
    }
    measure(&mut results, "Segmenter construct", |_| {
        black_box(segment::Segmenter::new(&requested, &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    let formatter = displays.create("en", &Default::default()).unwrap();
    measure(&mut results, "DisplayNames of language", |i| {
        black_box(formatter.of(["fr", "de", "ja"][i % 3]).unwrap())
            .unwrap()
            .len()
    });
    measure(&mut results, "DisplayNames construct", |_| {
        black_box(displays.create("en", &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    let formatter = lists.create("en", &Default::default()).unwrap();
    let items: Vec<Vec<u16>> = ["apple", "banana", "cherry"]
        .iter()
        .map(|s| s.encode_utf16().collect())
        .collect();
    measure(&mut results, "ListFormat format", |_| {
        black_box(formatter.format(&items)).len()
    });
    measure(&mut results, "ListFormat formatToParts", |_| {
        black_box(formatter.format_to_parts(&items)).len()
    });
    measure(&mut results, "ListFormat construct", |_| {
        black_box(lists.create("en", &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    let options = serde_json::from_value(json!({"numeric":"auto"})).unwrap();
    let formatter = relatives.create(&requested, &options).unwrap();
    measure(&mut results, "RelativeTimeFormat format", |i| {
        black_box(
            formatter
                .format_number((i % 7) as f64 - 3.0, "day")
                .unwrap(),
        )
        .len()
    });
    measure(&mut results, "RelativeTimeFormat formatToParts", |i| {
        black_box(
            formatter
                .format_to_parts_number((i % 7) as f64 - 3.0, "day")
                .unwrap(),
        )
        .len()
    });
    measure(&mut results, "RelativeTimeFormat construct", |_| {
        black_box(relatives.create(&requested, &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    for kind in ["cardinal", "ordinal"] {
        let options = serde_json::from_value(json!({"type":kind})).unwrap();
        let formatter = plurals.create("en", &options).unwrap();
        measure(&mut results, &format!("PluralRules select {kind}"), |i| {
            black_box(formatter.select(NUMBERS[i % 9]).unwrap()).len()
        });
    }
    measure(&mut results, "PluralRules construct", |_| {
        black_box(plurals.create("en", &Default::default()).unwrap())
            .resolved_options()
            .locale
            .len()
    });
    let record = duration::Duration::from_numbers([
        None,
        None,
        None,
        None,
        Some(1.0),
        Some(23.0),
        Some(45.0),
        Some(123.0),
        None,
        None,
    ])
    .unwrap();
    for (name, style) in [
        ("long", duration::Style::Long),
        ("digital", duration::Style::Digital),
    ] {
        let options = duration::Options {
            style,
            ..Default::default()
        };
        let formatter =
            duration::DurationFormat::new(&mut renderer, &requested, &Default::default(), &options)
                .unwrap();
        measure(
            &mut results,
            &format!("DurationFormat format {name}"),
            |_| black_box(formatter.format(&mut renderer, &record).unwrap()).len(),
        );
        measure(
            &mut results,
            &format!("DurationFormat formatToParts {name}"),
            |_| black_box(formatter.format_to_parts(&mut renderer, &record).unwrap()).len(),
        );
    }
    measure(&mut results, "DurationFormat construct", |_| {
        black_box(
            duration::DurationFormat::new(
                &mut renderer,
                &requested,
                &Default::default(),
                &duration::Options {
                    style: duration::Style::Digital,
                    ..Default::default()
                },
            )
            .unwrap(),
        )
        .resolved_options()
        .locale
        .len()
    });
    measure(&mut results, "getCanonicalLocales aliases", |_| {
        black_box(
            canonical::get_canonical_locales(&["iw-IL", "en-us", "zh-hant-tw", "en-US"]).unwrap(),
        )
        .len()
    });
    measure(&mut results, "Locale construct", |i| {
        black_box(
            locale::Locale::new(["en-US", "sr-Latn", "zh-TW"][i % 3], &Default::default()).unwrap(),
        )
        .as_str()
        .len()
    });
    let locale = locale::Locale::new("zh-TW", &Default::default()).unwrap();
    measure(&mut results, "Locale maximize", |_| {
        black_box(locale.maximize()).as_str().len()
    });
    for key in ["calendar", "timeZone", "unit"] {
        measure(&mut results, &format!("supportedValuesOf {key}"), |_| {
            black_box(
                supported::supported_values_of(key, |kind, value, _| {
                    match kind {
                        supported::Key::Unit => {
                            let options = number::Options {
                                style: Some("unit".into()),
                                unit: Some(value.into()),
                                ..Default::default()
                            };
                            let formatter = numbers.create(&requested, &options).ok()?;
                            Some(supported::Observation {
                                resolved: formatter.resolved_options().unit.clone(),
                                formatted: None,
                            })
                        }
                        supported::Key::Calendar | supported::Key::TimeZone => {
                            let options = if kind == supported::Key::Calendar {
                                json!({"timeZone":"UTC","calendar":value})
                            } else {
                                json!({"timeZone":value})
                            };
                            // Candidate lists are validated by the formatter; unavailable zones are skipped.
                            let construction = runtime.begin();
                            let resolution = construction
                                .resolve(&requested, &serde_json::from_value(options.clone()).ok()?)
                                .ok()?;
                            let zone = construction
                                .time_zone(options.get("timeZone").and_then(Value::as_str))
                                .ok()?;
                            let config = construction
                                .capture(resolution, Default::default())
                                .ok()?
                                .select(&Default::default())
                                .ok()?;
                            let formatter = construction.finish(config, zone);
                            let resolved = formatter.resolved_options();
                            Some(supported::Observation {
                                resolved: Some(if kind == supported::Key::Calendar {
                                    resolved.calendar
                                } else {
                                    resolved.time_zone
                                }),
                                formatted: None,
                            })
                        }
                        _ => None,
                    }
                })
                .unwrap(),
            )
            .len()
        });
    }
    let full = include_str!(env!("BENCH_MATCHER"))
        .lines()
        .find_map(|line| line.strip_prefix("support\tfull\t"))
        .unwrap();
    let available: Vec<_> = full.split(',').collect();
    let matcher = LocaleMatcher::new(&available, "en").unwrap();
    for tag in ["en", "en-US", "zh-TW", "sr-Latn-BA", "en-XZ"] {
        measure(
            &mut results,
            &format!("LocaleMatcher best fit {tag}"),
            |_| black_box(matcher.best_match(&[tag]).unwrap()).locale.len(),
        );
    }
    println!("{}",serde_json::to_string_pretty(&json!({"implementation":"rust","sourceRevision":std::env::args().find_map(|arg|arg.strip_prefix("--revision=").map(str::to_owned)),"compilationMode":"opt","rounds":7,"availableLocales":available.len(),"locale":"en","minimumCalibrationMilliseconds":50,"results":results})).unwrap());
}
