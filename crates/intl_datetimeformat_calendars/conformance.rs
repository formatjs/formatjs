use formatjs_intl_datetimeformat::{
    DateTimeValue, Error, Runtime,
    calendar::CalendarProvider,
    fields::Components,
    registry::ResolutionOptions,
    selection::{Kind, Options as SelectionOptions},
};
use formatjs_intl_datetimeformat_calendars::Provider;
use serde::Deserialize;
use serde_json::Value;
use std::io::{self, BufRead};
#[derive(Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
enum Request {
    Fields {
        data: String,
        milliseconds: Vec<i64>,
    },
    Validate {
        data: Vec<String>,
    },
    Render {
        data: String,
        locale: String,
        patch: String,
        tz: String,
        cases: Vec<Case>,
    },
}
#[derive(Deserialize)]
struct Case {
    locales: Vec<String>,
    options: Value,
    values: Vec<Input>,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum Input {
    Date {
        value: f64,
    },
    Range {
        first: f64,
        second: f64,
    },
    Epoch {
        value: String,
        kind: Kind,
        calendar: Option<String>,
    },
}
fn failure(error: Error) -> Value {
    serde_json::json!({"error":if matches!(error,Error::StyleComponents|Error::TemporalMismatch|Error::TemporalTypeMismatch|Error::UnsupportedTemporal) {"TypeError"} else {"RangeError"}})
}
fn render(runtime: &Runtime, case: Case) -> Result<Value, Error> {
    let construction = runtime.begin();
    let early: ResolutionOptions = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("options"))?;
    let resolution = construction.resolve(&case.locales, &early)?;
    let zone = construction.time_zone(case.options.get("timeZone").and_then(Value::as_str))?;
    let components: Components = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("components"))?;
    let late: SelectionOptions =
        serde_json::from_value(case.options).map_err(|_| Error::InvalidOption("options"))?;
    let config = construction
        .capture(resolution, components)?
        .select(&late)?;
    let formatter = construction.finish(config, zone);
    let mut rows = Vec::new();
    for input in case.values {
        let row = (|| {
            let (parts, text) = match input {
                Input::Date { value } => {
                    let value = DateTimeValue::Number(value);
                    (
                        formatter.format_to_parts(&value)?,
                        formatter.format(&value)?,
                    )
                }
                Input::Range { first, second } => {
                    let first = DateTimeValue::Number(first);
                    let second = DateTimeValue::Number(second);
                    (
                        formatter.format_range_to_parts(&first, &second)?,
                        formatter.format_range(&first, &second)?,
                    )
                }
                Input::Epoch {
                    value,
                    kind,
                    calendar,
                } => {
                    let value = DateTimeValue::Temporal {
                        kind,
                        calendar,
                        epoch_nanoseconds: value.parse().map_err(|_| Error::InvalidDate)?,
                    };
                    (
                        formatter.format_to_parts(&value)?,
                        formatter.format(&value)?,
                    )
                }
            };
            Ok::<_, Error>(serde_json::json!({"parts":parts,"text":text}))
        })();
        rows.push(match row {
            Ok(row) => row,
            Err(error) => failure(error),
        });
    }
    Ok(serde_json::to_value(rows).unwrap())
}
fn run(request: Request) -> Result<Value, Error> {
    Ok(match request {
        Request::Fields { data, milliseconds } => {
            let provider = Provider::from_json(&data)?;
            serde_json::to_value(
                milliseconds
                    .into_iter()
                    .map(|time| match provider.date_from_time(time) {
                        Ok(fields) => serde_json::to_value(fields).unwrap(),
                        Err(error) => failure(error),
                    })
                    .collect::<Vec<_>>(),
            )
            .unwrap()
        }
        Request::Validate { data } => serde_json::to_value(
            data.into_iter()
                .map(|json| Provider::from_json(&json).is_ok())
                .collect::<Vec<_>>(),
        )
        .unwrap(),
        Request::Render {
            data,
            locale,
            patch,
            tz,
            cases,
        } => {
            let runtime = Runtime::default();
            runtime.add_calendar_locale_data(&patch)?;
            Provider::from_json(&data)?.register(&runtime);
            runtime.add_locale_data(&locale)?;
            runtime.time_zones().load_json(&tz)?;
            serde_json::to_value(
                cases
                    .into_iter()
                    .map(|case| match render(&runtime, case) {
                        Ok(rows) => rows,
                        Err(error) => failure(error),
                    })
                    .collect::<Vec<_>>(),
            )
            .unwrap()
        }
    })
}
fn main() {
    for line in io::stdin().lock().lines() {
        let request = serde_json::from_str(&line.unwrap()).unwrap();
        let value = match run(request) {
            Ok(value) => value,
            Err(error) => failure(error),
        };
        println!("{}", serde_json::to_string(&value).unwrap());
    }
}
