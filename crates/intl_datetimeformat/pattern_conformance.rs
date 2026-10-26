use formatjs_intl_datetimeformat::locale_patterns::CalendarPatterns;
use formatjs_intl_datetimeformat::{
    Error,
    fields::Components,
    matching::{self, Style, StyleData, Styles},
    pattern::{self, Format, RawPatterns},
};
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
fn run(request: Request) -> Result<Value, Error> {
    Ok(match request {
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
