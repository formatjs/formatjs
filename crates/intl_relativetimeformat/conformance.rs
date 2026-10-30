use formatjs_intl_relativetimeformat::{Options, registry::Registry};
use serde::Deserialize;
use serde_json::{Value, json};
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
    values: Vec<String>,
    units: Vec<String>,
}
fn evaluate(registry: &Registry, request: Request) -> Value {
    let model = match registry.create(&request.locales, &request.options) {
        Ok(model) => model,
        Err(error) => return json!({"error":error.to_string()}),
    };
    let mut output = Vec::new();
    for value in request.values {
        for unit in &request.units {
            output.push(
                match (
                    model.format(&value, unit),
                    model.format_to_parts(&value, unit),
                ) {
                    (Ok(text), Ok(parts)) => json!({"text":text,"parts":parts}),
                    (Err(_), Err(_)) => json!({"error":"RangeError"}),
                    _ => panic!("format and parts disagree"),
                },
            );
        }
    }
    json!({"options":model.resolved_options(),"values":output})
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let directory = PathBuf::from(
        std::env::args()
            .nth(1)
            .ok_or("locale-data directory required")?,
    );
    let mut files: Vec<_> = fs::read_dir(directory)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<Result<_, _>>()?;
    files.retain(|file| file.extension().is_some_and(|ext| ext == "json"));
    files.sort_by_key(|file| (file.file_name().unwrap() != "en.json", file.clone()));
    let mut registry = Registry::default();
    for file in files {
        registry.add_locale_data(&fs::read_to_string(file)?)?;
    }
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        println!("{}", evaluate(&registry, request));
    }
    Ok(())
}
