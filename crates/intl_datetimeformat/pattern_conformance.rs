use formatjs_intl_datetimeformat::data::LocaleData;
use formatjs_intl_datetimeformat::registry::{Registry, ResolutionOptions};
use formatjs_intl_datetimeformat::selection::{Kind, Options as SelectionOptions, Snapshot};
use formatjs_intl_datetimeformat::{
    DateTimeValue, Error, Runtime,
    fields::Components,
    matching::{self, Style, StyleData, Styles},
    pattern::{self, Format, RawPatterns},
};
use formatjs_intl_datetimeformat::{calendar::CalendarRegistry, locale_patterns::CalendarPatterns};
use serde::Deserialize;
use serde_json::Value;
use std::io::{self, BufRead};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawFormat {
    skeleton: String,
    raw_pattern: Option<String>,
    #[serde(default)]
    ranges: RawPatterns,
    fallback: Option<String>,
}
impl RawFormat {
    fn parse(self) -> Result<Format, Error> {
        pattern::parse(
            &self.skeleton,
            self.raw_pattern.as_deref().unwrap_or(&self.skeleton),
            &self.ranges,
            self.fallback.as_deref(),
        )
    }
}
#[derive(Deserialize)]
struct RawStyles {
    date: Styles<RawFormat>,
    time: Styles<RawFormat>,
    connector: Styles<String>,
}
#[derive(Deserialize)]
#[serde(
    tag = "method",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
enum Request {
    ReentrantTz {
        json: String,
        patch: String,
        tz_json: String,
        replacement: String,
    },
    CalendarPacks {
        base_files: Vec<String>,
        directories: std::collections::BTreeMap<String, String>,
    },
    Reentrant {
        json: String,
        patch: String,
        replacement: String,
    },
    Packs {
        files: Vec<String>,
    },
    Render {
        json: String,
        tz_json: String,
        cases: Vec<RenderCase>,
    },
    Profiles {
        json: String,
        providers: Vec<String>,
        cases: Vec<CreationCase>,
    },
    Registry {
        steps: Vec<RegistryStep>,
    },
    Locale {
        json: String,
        providers: Vec<String>,
        calendars: Option<Vec<String>>,
    },
    CalendarFields {
        calendar: String,
        milliseconds: i64,
    },
    Parse {
        #[serde(flatten)]
        raw: RawFormat,
    },
    Calendar {
        data: CalendarPatterns,
    },
    Process {
        pattern: String,
    },
    Split {
        pattern: String,
        fallback: bool,
    },
    Basic {
        options: Components,
        formats: Vec<RawFormat>,
    },
    BestFit {
        options: Components,
        formats: Vec<RawFormat>,
    },
    Batch {
        options: Vec<Components>,
        formats: Vec<RawFormat>,
    },
    Style {
        date_style: Option<Style>,
        time_style: Option<Style>,
        data: RawStyles,
        formats: Vec<RawFormat>,
        hour12: Option<bool>,
    },
}
fn styles(raw: Styles<RawFormat>) -> Result<Styles<Format>, Error> {
    Ok(Styles {
        full: raw.full.parse()?,
        long: raw.long.parse()?,
        medium: raw.medium.parse()?,
        short: raw.short.parse()?,
    })
}
#[derive(Deserialize)]
#[serde(
    tag = "action",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
enum RegistryStep {
    Load {
        json: String,
    },
    Patch {
        json: String,
    },
    Provider {
        calendar: String,
    },
    Info {
        locales: Vec<String>,
    },
    Resolve {
        locales: Vec<String>,
        options: ResolutionOptions,
    },
    Supported {
        locales: Vec<String>,
        locale_matcher: Option<String>,
    },
}
fn registry_step(registry: &mut Registry, step: RegistryStep) -> Result<Value, Error> {
    Ok(match step {
        RegistryStep::Load { json } => {
            registry.add_locale_data(&json)?;
            Value::Null
        }
        RegistryStep::Patch { json } => {
            registry.add_calendar_locale_data(&json)?;
            Value::Null
        }
        RegistryStep::Provider { calendar } => {
            registry.register_calendar(
                calendar,
                std::sync::Arc::new(|_| Err(Error::MissingCalendar)),
            );
            Value::Null
        }
        RegistryStep::Info { locales } => {
            let mut records = std::collections::BTreeMap::new();
            for locale in locales {
                let data = registry.get(&locale)?;
                let mut months = std::collections::BTreeMap::new();
                let mut patterns = std::collections::BTreeMap::new();
                for calendar in data.calendar_names() {
                    let record = data.calendar(calendar)?;
                    months.insert(
                        calendar.to_owned(),
                        record.names.month.long.first().cloned(),
                    );
                    patterns.insert(
                        calendar.to_owned(),
                        record
                            .formats()?
                            .first()
                            .map(|format| format.raw_pattern.clone()),
                    );
                }
                records.insert(locale,serde_json::json!({"am":data.metadata.am,"ca":registry.available_calendars(&data.locale)?,"nu":data.metadata.numbering_systems,"hc":data.metadata.hour_cycles,"calendars":data.calendar_names().collect::<Vec<_>>(),"months":months,"patterns":patterns}));
            }
            serde_json::json!({"available":registry.available_locales(),"default":registry.default_locale(),"data":records})
        }
        RegistryStep::Resolve { locales, options } => {
            serde_json::to_value(registry.resolve(&locales, &options)?).unwrap()
        }
        RegistryStep::Supported {
            locales,
            locale_matcher,
        } => serde_json::to_value(registry.supported_locales(&locales, locale_matcher.as_deref())?)
            .unwrap(),
    })
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreationCase {
    locales: Vec<String>,
    options: Value,
    kinds: Vec<Kind>,
    reload: Option<Reload>,
}
#[derive(Deserialize)]
struct Reload {
    json: String,
    phase: ReloadPhase,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
enum ReloadPhase {
    BeforeSnapshot,
    AfterSnapshot,
}
fn failure(error: Error) -> Value {
    serde_json::json!({"error":if matches!(error,Error::StyleComponents|Error::TemporalMismatch|Error::TemporalTypeMismatch|Error::UnsupportedTemporal) {"TypeError"} else {"RangeError"}})
}
fn creation(registry: &mut Registry, case: &CreationCase) -> Result<Value, Error> {
    let options: ResolutionOptions = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("options"))?;
    let resolution = registry.resolve(&case.locales, &options)?;
    let components: Components = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("components"))?;
    if let Some(Reload {
        json,
        phase: ReloadPhase::BeforeSnapshot,
    }) = &case.reload
    {
        registry.add_locale_data(json)?;
    }
    let snapshot = Snapshot::capture(registry, resolution, components)?;
    if let Some(Reload {
        json,
        phase: ReloadPhase::AfterSnapshot,
    }) = &case.reload
    {
        registry.add_locale_data(json)?;
    }
    let options: SelectionOptions = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("options"))?;
    let config = snapshot.select(&options)?;
    let mut temporal = std::collections::BTreeMap::new();
    let mut identity = true;
    for kind in &case.kinds {
        let value = match config.temporal(*kind) {
            Ok(profile) => {
                identity &= std::sync::Arc::ptr_eq(&profile, &config.temporal(*kind)?);
                serde_json::to_value(profile.as_ref()).unwrap()
            }
            Err(error) => failure(error),
        };
        temporal.insert(format!("{kind:?}"), value);
    }
    Ok(serde_json::json!({"main":config.profile(),"temporal":temporal,"identity":identity}))
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RenderCase {
    locales: Vec<String>,
    options: Value,
    values: Vec<RenderValue>,
    reload: Option<String>,
    tz_reload: Option<String>,
    tz_during: Option<String>,
    #[serde(default)]
    inspect: bool,
}
#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum RenderValue {
    Date {
        value: String,
    },
    Epoch {
        value: String,
        kind: Kind,
        calendar: Option<String>,
    },
    Zoned,
    Pair {
        first: Box<RenderValue>,
        second: Box<RenderValue>,
    },
    Range {
        first: String,
        second: String,
        kind: Option<Kind>,
        calendar: Option<String>,
    },
}
fn input_value(input: &RenderValue) -> Result<DateTimeValue, Error> {
    match input {
        RenderValue::Date { value } => value
            .parse()
            .map(DateTimeValue::Number)
            .map_err(|_| Error::InvalidDate),
        RenderValue::Epoch {
            value,
            kind,
            calendar,
        } => Ok(DateTimeValue::Temporal {
            kind: *kind,
            calendar: calendar.clone(),
            epoch_nanoseconds: value.parse().map_err(|_| Error::InvalidDate)?,
        }),
        RenderValue::Zoned => Ok(DateTimeValue::ZonedDateTime),
        _ => Err(Error::InvalidDate),
    }
}
fn render_case(runtime: &Runtime, case: &RenderCase) -> Result<Value, Error> {
    let construction = runtime.begin();
    let early: ResolutionOptions = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("options"))?;
    let resolution = construction.resolve(&case.locales, &early)?;
    if let Some(json) = &case.tz_during {
        runtime.time_zones().load_json(json)?;
    }
    let zone = construction.time_zone(case.options.get("timeZone").and_then(Value::as_str))?;
    let fields: Components = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("components"))?;
    let late: SelectionOptions = serde_json::from_value(case.options.clone())
        .map_err(|_| Error::InvalidOption("options"))?;
    let configuration = construction.capture(resolution, fields)?.select(&late)?;
    let formatter = construction.finish(configuration, zone);
    if let Some(json) = &case.reload {
        runtime.add_locale_data(json)?;
    }
    if let Some(json) = &case.tz_reload {
        runtime.time_zones().load_json(json)?;
    }
    let mut output = Vec::new();
    for value in &case.values {
        let result = (|| {
            let pair = match value {
                RenderValue::Range {
                    first,
                    second,
                    kind,
                    calendar,
                } => {
                    let convert = |value: &str| {
                        if let Some(kind) = kind {
                            Ok(DateTimeValue::Temporal {
                                kind: *kind,
                                calendar: calendar.clone(),
                                epoch_nanoseconds: value.parse().map_err(|_| Error::InvalidDate)?,
                            })
                        } else {
                            value
                                .parse()
                                .map(DateTimeValue::Number)
                                .map_err(|_| Error::InvalidDate)
                        }
                    };
                    Some((convert(first)?, convert(second)?))
                }
                RenderValue::Pair { first, second } => {
                    Some((input_value(first)?, input_value(second)?))
                }
                _ => None,
            };
            let (parts, text) = if let Some((first, second)) = pair {
                (
                    formatter.format_range_to_parts(&first, &second)?,
                    formatter.format_range(&first, &second)?,
                )
            } else {
                let value = input_value(value)?;
                (
                    formatter.format_to_parts(&value)?,
                    formatter.format(&value)?,
                )
            };
            Ok::<_, Error>(serde_json::json!({"parts":parts,"text":text}))
        })();
        output.push(match result {
            Ok(value) => value,
            Err(error) => failure(error),
        });
    }
    if case.inspect {
        Ok(
            serde_json::json!({"resolved":serde_json::to_string(&formatter.resolved_options()).unwrap(),"values":output}),
        )
    } else {
        Ok(serde_json::to_value(output).unwrap())
    }
}

fn reentrant(json: &str, patch: &str, replacement: &str) -> Result<Value, Error> {
    use formatjs_intl_datetimeformat::calendar::CalendarFields;
    use std::{cell::RefCell, rc::Rc, sync::Arc};
    let fields = |year| CalendarFields {
        era: "AD".into(),
        year,
        month: 0,
        day: 1,
        month_name_index: None,
        month_number: None,
        leap_month: None,
        related_year: None,
        year_name: None,
    };
    let mut output = Vec::new();
    for range in [false, true] {
        let runtime = Runtime::default();
        runtime.add_locale_data(json)?;
        runtime.add_calendar_locale_data(patch)?;
        let calls = Rc::new(RefCell::new(Vec::new()));
        let record = calls.clone();
        let inner = runtime.clone();
        let replacement = replacement.to_owned();
        runtime.register_calendar(
            "custom".into(),
            Arc::new(move |milliseconds| {
                record.borrow_mut().push(milliseconds);
                let record = record.clone();
                inner.register_calendar(
                    "custom".into(),
                    Arc::new(move |milliseconds| {
                        record.borrow_mut().push(milliseconds);
                        Ok(fields(4000))
                    }),
                );
                inner.add_calendar_locale_data(&replacement)?;
                Ok(fields(3000))
            }),
        );
        let construction = runtime.begin();
        let resolution = construction.resolve(
            &["en".into()],
            &ResolutionOptions {
                calendar: Some("custom".into()),
                ..Default::default()
            },
        )?;
        let zone = construction.time_zone(Some("UTC"))?;
        let components = Components {
            year: Some(formatjs_intl_datetimeformat::fields::NumericWidth::Numeric),
            month: Some(formatjs_intl_datetimeformat::fields::Width::Long),
            day: Some(formatjs_intl_datetimeformat::fields::NumericWidth::Numeric),
            ..Default::default()
        };
        let config = construction
            .capture(resolution, components)?
            .select(&SelectionOptions::default())?;
        let formatter = construction.finish(config, zone);
        let parts = if range {
            formatter.format_range_to_parts(
                &DateTimeValue::Number(0.0),
                &DateTimeValue::Number(86_400_000.0),
            )?
        } else {
            formatter.format_to_parts(&DateTimeValue::Number(0.0))?
        };
        output.push(serde_json::json!({"parts":parts,"calls":*calls.borrow()}));
    }
    Ok(serde_json::to_value(output).unwrap())
}
fn reentrant_tz(json: &str, patch: &str, tz_json: &str, replacement: &str) -> Result<Value, Error> {
    let runtime = Runtime::default();
    runtime.add_locale_data(json)?;
    runtime.add_calendar_locale_data(patch)?;
    runtime.time_zones().load_json(tz_json)?;
    let zones = runtime.time_zones().clone();
    let replacement = replacement.to_owned();
    let builtin = CalendarRegistry::default().provider("gregory")?;
    let calls = std::rc::Rc::new(std::cell::RefCell::new(Vec::new()));
    let record = calls.clone();
    runtime.register_calendar(
        "custom".into(),
        std::sync::Arc::new(move |milliseconds| {
            record.borrow_mut().push(milliseconds);
            zones.load_json(&replacement)?;
            builtin.date_from_time(milliseconds)
        }),
    );
    let construction = runtime.begin();
    let resolution = construction.resolve(
        &["en".into()],
        &ResolutionOptions {
            calendar: Some("custom".into()),
            hour_cycle: Some("h23".into()),
            ..Default::default()
        },
    )?;
    let zone = construction.time_zone(Some("Test/Mutable"))?;
    let fields = Components {
        hour: Some(formatjs_intl_datetimeformat::fields::NumericWidth::TwoDigit),
        minute: Some(formatjs_intl_datetimeformat::fields::NumericWidth::TwoDigit),
        ..Default::default()
    };
    let config = construction
        .capture(resolution, fields)?
        .select(&SelectionOptions::default())?;
    let formatter = construction.finish(config, zone);
    let first = DateTimeValue::Number(0.0);
    let second = DateTimeValue::Number(3_600_000.0);
    let rows = vec![
        formatter.format_range_to_parts(&first, &second)?,
        formatter.format_to_parts(&first)?,
        formatter.format_range_to_parts(&first, &second)?,
    ];
    Ok(serde_json::json!({"parts":rows,"calls":*calls.borrow()}))
}
fn run(request: Request) -> Result<Value, Error> {
    Ok(match request {
        Request::ReentrantTz {
            json,
            patch,
            tz_json,
            replacement,
        } => reentrant_tz(&json, &patch, &tz_json, &replacement)?,
        Request::CalendarPacks {
            base_files,
            directories,
        } => {
            let mut rows = Vec::new();
            for file in base_files {
                let json = std::fs::read_to_string(&file).map_err(|_| Error::InvalidLocaleData)?;
                let locale = LocaleData::from_json(&json)?.locale;
                let mut registry = Registry::default();
                registry.add_locale_data(&json)?;
                let filename = std::path::Path::new(&file)
                    .file_name()
                    .ok_or(Error::InvalidLocaleData)?;
                for (calendar, directory) in &directories {
                    let patch =
                        std::fs::read_to_string(std::path::Path::new(directory).join(filename))
                            .map_err(|_| Error::InvalidLocaleData)?;
                    registry.add_calendar_locale_data(&patch)?;
                    let data = registry.get(&locale)?;
                    let record = data.calendar(calendar)?;
                    let count = record.formats()?.len();
                    if count == 0 || registry.available_calendars(&locale)?.contains(calendar) {
                        return Err(Error::InvalidLocaleData);
                    }
                    registry.register_calendar(
                        calendar.clone(),
                        std::sync::Arc::new(|_| Err(Error::MissingCalendar)),
                    );
                    if !registry.available_calendars(&locale)?.contains(calendar) {
                        return Err(Error::InvalidLocaleData);
                    }
                    rows.push(
                        serde_json::json!({"locale":locale,"calendar":calendar,"count":count}),
                    );
                }
            }
            serde_json::to_value(rows).unwrap()
        }
        Request::Reentrant {
            json,
            patch,
            replacement,
        } => reentrant(&json, &patch, &replacement)?,
        Request::Packs { files } => {
            let rows=files.into_iter().map(|file|{
                let result=(||{
                    let json=std::fs::read_to_string(&file).map_err(|_|Error::InvalidLocaleData)?;
                    let data=LocaleData::from_json(&json)?;
                    let available=data.available_calendars(&CalendarRegistry::default());
                    let formats=data.calendar("gregory")?;
                    let count=formats.formats()?.len();
                    let system=data.metadata.numbering_systems.first().ok_or(Error::InvalidLocaleData)?;
                    let decimal=data.numbers()?.decimal(&data.locale,system)?;
                    Ok::<_,Error>(serde_json::json!({"locale":data.locale,"available":available,"calendars":data.calendar_names().collect::<Vec<_>>(),"count":count,"decimal":decimal}))
                })();
                match result {Ok(value)=>value,Err(error)=>serde_json::json!({"file":file,"error":failure(error),"detail":format!("{error:?}")})}
            }).collect::<Vec<_>>();
            serde_json::to_value(rows).unwrap()
        }
        Request::Render {
            json,
            tz_json,
            cases,
        } => {
            let runtime = Runtime::default();
            runtime.add_locale_data(&json)?;
            runtime.time_zones().load_json(&tz_json)?;
            let mut rows = Vec::new();
            for case in cases {
                rows.push(match render_case(&runtime, &case) {
                    Ok(value) => value,
                    Err(error) => failure(error),
                });
                if case.reload.is_some() {
                    runtime.add_locale_data(&json)?;
                }
                if case.tz_reload.is_some() || case.tz_during.is_some() {
                    runtime.time_zones().load_json(&tz_json)?;
                }
            }
            serde_json::to_value(rows).unwrap()
        }
        Request::Profiles {
            json,
            providers,
            cases,
        } => {
            let mut registry = Registry::default();
            for provider in providers {
                registry.register_calendar(
                    provider,
                    std::sync::Arc::new(|_| Err(Error::MissingCalendar)),
                );
            }
            registry.add_locale_data(&json)?;
            let mut output = Vec::new();
            for case in cases {
                output.push(match creation(&mut registry, &case) {
                    Ok(value) => value,
                    Err(error) => failure(error),
                });
                if case.reload.is_some() {
                    registry.add_locale_data(&json)?;
                }
            }
            serde_json::to_value(output).unwrap()
        }
        Request::Registry { steps } => {
            let mut registry = Registry::default();
            let output = steps
                .into_iter()
                .map(|step| match registry_step(&mut registry, step) {
                    Ok(value) => value,
                    Err(_) => serde_json::json!({"error":"RangeError"}),
                })
                .collect::<Vec<_>>();
            serde_json::to_value(output).unwrap()
        }
        Request::Locale {
            json,
            providers,
            calendars: inspect,
        } => {
            let data = LocaleData::from_json(&json)?;
            let mut registry = CalendarRegistry::default();
            for name in providers {
                registry.register(name, std::sync::Arc::new(|_| Err(Error::MissingCalendar)));
            }
            let mut calendars = std::collections::BTreeMap::new();
            let names =
                inspect.unwrap_or_else(|| data.calendar_names().map(str::to_owned).collect());
            for name in names {
                let calendar = data.calendar(&name)?;
                calendars.insert(name,serde_json::json!({"names":calendar.names,"styles":calendar.styles()?,"formats":calendar.formats()?}));
            }
            serde_json::json!({"locale":data.locale,"metadata":data.metadata,"available":data.available_calendars(&registry),"calendars":calendars})
        }
        Request::CalendarFields {
            calendar,
            milliseconds,
        } => serde_json::to_value(
            CalendarRegistry::default().date_from_time(&calendar, milliseconds)?,
        )
        .unwrap(),
        Request::Calendar { data } => {
            serde_json::json!({"formats":data.formats()?,"styles":data.styles()?})
        }
        Request::Parse { raw } => serde_json::to_value(raw.parse()?).unwrap(),
        Request::Process { pattern } => serde_json::to_value(pattern::process(&pattern)?).unwrap(),
        Request::Split { pattern, fallback } => serde_json::to_value(if fallback {
            pattern::split_fallback(&pattern)
        } else {
            pattern::split_range(&pattern)
        })
        .unwrap(),
        Request::Basic { options, formats } => {
            let formats = formats
                .into_iter()
                .map(RawFormat::parse)
                .collect::<Result<Vec<_>, _>>()?;
            serde_json::to_value(matching::basic(options, &formats)?).unwrap()
        }
        Request::BestFit { options, formats } => {
            let formats = formats
                .into_iter()
                .map(RawFormat::parse)
                .collect::<Result<Vec<_>, _>>()?;
            serde_json::to_value(matching::best_fit(options, &formats)?).unwrap()
        }
        Request::Batch { options, formats } => {
            let formats = formats
                .into_iter()
                .map(RawFormat::parse)
                .collect::<Result<Vec<_>, _>>()?;
            let rows=options.into_iter().map(|options|Ok(serde_json::json!({
                "basic":matching::basic(options,&formats)?,
                "bestFit":matching::best_fit(options,&formats)?,
                "scores":formats.iter().map(|format|matching::best_fit_score(options,format.components)).collect::<Vec<_>>(),
            }))).collect::<Result<Vec<Value>,Error>>()?;
            serde_json::to_value(rows).unwrap()
        }
        Request::Style {
            date_style,
            time_style,
            data,
            formats,
            hour12,
        } => {
            let formats = formats
                .into_iter()
                .map(RawFormat::parse)
                .collect::<Result<Vec<_>, _>>()?;
            let data = StyleData {
                date: styles(data.date)?,
                time: styles(data.time)?,
                connector: data.connector,
            };
            serde_json::to_value(matching::style(
                date_style, time_style, &data, &formats, hour12,
            )?)
            .unwrap()
        }
    })
}
fn main() {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line.expect("read input")).expect("request");
        match run(request) {
            Ok(value) => println!("{value}"),
            Err(_) => println!("{{\"error\":\"RangeError\"}}"),
        }
    }
}
