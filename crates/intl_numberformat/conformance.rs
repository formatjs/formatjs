use formatjs_intl_numberformat::{Error, NumberFormat, Options, Part, registry::Registry};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{self, BufRead},
    path::PathBuf,
};

#[derive(Deserialize)]
struct Request {
    locales: Vec<String>,
    #[serde(default)]
    options: Options,
    #[serde(default)]
    values: Vec<String>,
    #[serde(default)]
    ranges: Vec<[String; 2]>,
}
#[derive(Serialize)]
struct Output {
    text: String,
    parts: Vec<Part>,
}
#[derive(Serialize)]
struct Response {
    options: serde_json::Value,
    values: Vec<Output>,
    ranges: Vec<Output>,
}
fn evaluate(registry: &Registry, request: Request) -> Result<Response, Error> {
    let model: NumberFormat = registry.create(&request.locales, &request.options)?;
    let values = request
        .values
        .iter()
        .map(|value| {
            Ok(Output {
                text: model.format(value)?,
                parts: model.format_to_parts(value)?,
            })
        })
        .collect::<Result<_, Error>>()?;
    let ranges = request
        .ranges
        .iter()
        .map(|[start, end]| {
            Ok(Output {
                text: model.format_range(start, end)?,
                parts: model.format_range_to_parts(start, end)?,
            })
        })
        .collect::<Result<_, Error>>()?;
    Ok(Response {
        options: serde_json::to_value(model.resolved_options())
            .map_err(|error| Error::InvalidData(error.to_string()))?,
        values,
        ranges,
    })
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let directory = PathBuf::from(
        std::env::args()
            .nth(1)
            .ok_or("locale-data directory required")?,
    );
    let mut files: Vec<_> = fs::read_dir(&directory)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<Result<_, _>>()?;
    files.retain(|file| {
        file.extension()
            .is_some_and(|extension| extension == "json")
    });
    files.sort_by_key(|file| (file.file_name().unwrap() != "en.json", file.clone()));
    let mut registry = Registry::default();
    for file in files {
        registry.add_locale_data(&fs::read_to_string(file)?)?;
    }
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let value = match evaluate(&registry, request) {
            Ok(response) => serde_json::to_value(response)?,
            Err(error) => serde_json::json!({"error": error.to_string()}),
        };
        println!("{value}");
    }
    Ok(())
}
