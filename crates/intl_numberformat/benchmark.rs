use formatjs_intl_numberformat::{Options, registry::Registry};
use serde_json::json;
use std::{hint::black_box, time::Instant};

fn main() {
    let iterations: usize = std::env::args()
        .find_map(|arg| arg.strip_prefix("--iterations=").map(str::to_owned))
        .map(|value| value.parse().unwrap())
        .unwrap_or(12000);
    let mut pack = include_str!(env!("FORMATJS_NUMBER_EN")).to_owned();
    if std::env::args().any(|arg| arg == "--legacy-patterns") {
        let mut value: serde_json::Value = serde_json::from_str(&pack).unwrap();
        value["data"]["numbers"]
            .as_object_mut()
            .unwrap()
            .remove("patternPlans");
        pack = serde_json::to_string(&value).unwrap();
    }
    let registration_iterations = 25;
    let mut registration = Vec::new();
    for _ in 0..7 {
        let start = Instant::now();
        for _ in 0..registration_iterations {
            let mut registry = Registry::default();
            registry.add_locale_data(black_box(&pack)).unwrap();
            black_box(registry);
        }
        registration
            .push(start.elapsed().as_secs_f64() * 1_000_000.0 / registration_iterations as f64);
    }
    registration.sort_by(f64::total_cmp);
    let mut registry = Registry::default();
    registry.add_locale_data(&pack).unwrap();
    let values = [
        "0", "-0", "1.025", "-1.025", "1234.5", "999.5", "999999.5", "1e-7", "1e21",
    ];
    let profiles = [
        ("decimal", json!({})),
        ("currency", json!({"style":"currency","currency":"USD"})),
        (
            "unit",
            json!({"style":"unit","unit":"meter","unitDisplay":"long"}),
        ),
        ("scientific", json!({"notation":"scientific"})),
        ("compact", json!({"notation":"compact"})),
        (
            "compact currency",
            json!({"style":"currency","currency":"USD","notation":"compact"}),
        ),
        (
            "compact significant digits",
            json!({"notation":"compact","maximumSignificantDigits":3}),
        ),
    ];
    let mut results = Vec::new();
    for (name, options) in profiles {
        let options: Options = serde_json::from_value(options).unwrap();
        let formatter = registry.create(&["en".into()], &options).unwrap();
        let mut checksum = 0;
        for i in 0..2000 {
            checksum += black_box(
                formatter
                    .format(black_box(values[i % values.len()]))
                    .unwrap(),
            )
            .len();
        }
        let mut timings = Vec::new();
        for _ in 0..7 {
            let start = Instant::now();
            for i in 0..iterations {
                checksum += black_box(
                    formatter
                        .format(black_box(values[i % values.len()]))
                        .unwrap(),
                )
                .len();
            }
            timings.push(start.elapsed().as_secs_f64() * 1_000_000.0 / iterations as f64);
        }
        timings.sort_by(f64::total_cmp);
        results.push(json!({"name":name,"medianMicroseconds":timings[3],"minMicroseconds":timings[0],"maxMicroseconds":timings[6],"checksum":checksum}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"iterations":iterations,"rounds":7,"registrationIterations":registration_iterations,"registrationMicroseconds":registration[3],"localeBytes":pack.len(),"results":results})
        )
        .unwrap()
    );
}
