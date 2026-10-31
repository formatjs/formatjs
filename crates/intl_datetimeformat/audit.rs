use formatjs_intl_datetimeformat::{
    DateTimeFormat, DateTimeValue, Error, Runtime, fields::Components, registry::ResolutionOptions,
    selection::Options,
};
use formatjs_intl_datetimeformat_calendars::Provider;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    collections::BTreeMap,
    hint::black_box,
    io::{self, Read},
    time::Instant,
};

#[derive(Deserialize)]
struct Case {
    locale: String,
    options: Value,
    start: i64,
    end: Option<i64>,
}
#[derive(Deserialize)]
struct Input {
    files: Vec<String>,
    timezone: String,
    #[serde(default)]
    providers: Vec<String>,
    #[serde(default)]
    patches: Vec<String>,
    cases: Vec<Case>,
}
fn create(runtime: &Runtime, locale: &str, options: &Value) -> Result<DateTimeFormat, Error> {
    let construction = runtime.begin();
    let early: ResolutionOptions =
        serde_json::from_value(options.clone()).map_err(|_| Error::InvalidOption("options"))?;
    let resolution = construction.resolve(&[locale.into()], &early)?;
    let zone = construction.time_zone(options.get("timeZone").and_then(Value::as_str))?;
    let fields: Components =
        serde_json::from_value(options.clone()).map_err(|_| Error::InvalidOption("components"))?;
    let late: Options =
        serde_json::from_value(options.clone()).map_err(|_| Error::InvalidOption("options"))?;
    let config = construction.capture(resolution, fields)?.select(&late)?;
    Ok(construction.finish(config, zone))
}
fn audit(input: Input) -> Value {
    let runtime = Runtime::default();
    for file in input.files {
        runtime
            .add_locale_data(&std::fs::read_to_string(file).unwrap())
            .unwrap();
    }
    runtime
        .time_zones()
        .load_json(&std::fs::read_to_string(input.timezone).unwrap())
        .unwrap();
    for file in input.providers {
        Provider::from_json(&std::fs::read_to_string(file).unwrap())
            .unwrap()
            .register(&runtime);
    }
    for file in input.patches {
        runtime
            .add_calendar_locale_data(&std::fs::read_to_string(file).unwrap())
            .unwrap();
    }
    let mut formatters = BTreeMap::new();
    let mut output = Vec::new();
    for case in input.cases {
        let key = (case.locale.clone(), case.options.to_string());
        if !formatters.contains_key(&key) {
            formatters.insert(
                key.clone(),
                create(&runtime, &case.locale, &case.options).unwrap(),
            );
        }
        let formatter = &formatters[&key];
        let result = (|| {
            let start = DateTimeValue::Number(case.start as f64);
            let (text, parts) = if let Some(end) = case.end {
                let end = DateTimeValue::Number(end as f64);
                (
                    formatter.format_range(&start, &end)?,
                    formatter.format_range_to_parts(&start, &end)?,
                )
            } else {
                (
                    formatter.format(&start)?,
                    formatter.format_to_parts(&start)?,
                )
            };
            Ok::<_, Error>(json!({"text":text,"parts":parts}))
        })();
        output.push(result.unwrap_or_else(|error| json!({"error":format!("{error:?}")})));
    }
    json!(output)
}
fn benchmark() {
    let iterations = std::env::args()
        .find_map(|s| {
            s.strip_prefix("--iterations=")
                .map(|s| s.parse::<usize>().unwrap())
        })
        .unwrap_or(12000);
    let runtime = Runtime::default();
    let registration = Instant::now();
    runtime
        .add_locale_data(include_str!(env!("FORMATJS_DATETIME_EN")))
        .unwrap();
    let registration_micros = registration.elapsed().as_secs_f64() * 1e6;
    runtime
        .time_zones()
        .load_json(include_str!(env!("FORMATJS_DATETIME_TZ")))
        .unwrap();
    let profiles = [
        ("date", json!({"timeZone":"UTC"})),
        (
            "date time",
            json!({"timeZone":"UTC","year":"numeric","month":"short","day":"numeric","hour":"2-digit","minute":"2-digit","hourCycle":"h23"}),
        ),
        (
            "fractional",
            json!({"timeZone":"UTC","hour":"2-digit","minute":"2-digit","second":"2-digit","fractionalSecondDigits":3,"hourCycle":"h23"}),
        ),
        (
            "zone name",
            json!({"timeZone":"America/New_York","dateStyle":"full","timeStyle":"long"}),
        ),
        (
            "arab digits",
            json!({"timeZone":"UTC","numberingSystem":"arab","year":"numeric","month":"numeric","day":"numeric","hour":"numeric","minute":"2-digit"}),
        ),
    ];
    let values = [
        1705313700123i64,
        1705319100456,
        1705488300789,
        1710053999000,
        1710054000000,
    ];
    let mut results = Vec::new();
    for (name, options) in profiles {
        let formatter = create(&runtime, "en", &options).unwrap();
        for operation in ["format", "parts", "range", "range parts"] {
            let call = |i: usize| {
                let x = DateTimeValue::Number(values[i % values.len()] as f64);
                let y = DateTimeValue::Number((values[i % values.len()] + 5_400_000) as f64);
                match operation {
                    "format" => black_box(formatter.format(&x).unwrap()).len(),
                    "parts" => black_box(formatter.format_to_parts(&x).unwrap()).len(),
                    "range" => black_box(formatter.format_range(&x, &y).unwrap()).len(),
                    _ => black_box(formatter.format_range_to_parts(&x, &y).unwrap()).len(),
                }
            };
            let mut checksum = 0;
            for i in 0..1000 {
                checksum += call(i);
            }
            let mut timings = Vec::new();
            for _ in 0..7 {
                let start = Instant::now();
                for i in 0..iterations {
                    checksum += call(i);
                }
                timings.push(start.elapsed().as_secs_f64() * 1e6 / iterations as f64);
            }
            timings.sort_by(f64::total_cmp);
            results.push(json!({"name":format!("{name} {operation}"),"medianMicroseconds":timings[3],"minMicroseconds":timings[0],"maxMicroseconds":timings[6],"checksum":checksum}));
        }
    }
    println!("{}",serde_json::to_string_pretty(&json!({"iterations":iterations,"rounds":7,"registrationMicroseconds":registration_micros,"results":results})).unwrap());
}
fn main() {
    if std::env::args().any(|s| s == "--benchmark") {
        benchmark();
        return;
    }
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    println!("{}", audit(serde_json::from_str(&input).unwrap()));
}
