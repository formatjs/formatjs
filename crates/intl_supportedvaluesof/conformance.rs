use std::collections::BTreeMap;
use std::io::{self, BufRead};

use formatjs_intl_supportedvaluesof::{Key, Observation, candidates, supported_values_of};
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
struct Probe {
    value: String,
    locale: String,
    resolved: Option<String>,
    formatted: Option<String>,
}

#[derive(Deserialize)]
struct Request {
    key: String,
    observations: Vec<Probe>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    if std::env::args().any(|arg| arg == "--candidates") {
        let values: BTreeMap<_, _> = Key::ALL.into_iter().map(|key| (
            key.as_str(),
            candidates(key).into_iter().map(|candidate| json!({"value": candidate.value, "locale": candidate.locale})).collect::<Vec<_>>()
        )).collect();
        println!("{}", serde_json::to_string(&values)?);
        return Ok(());
    }
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let observations: BTreeMap<_, _> = request
            .observations
            .into_iter()
            .map(|probe| {
                (
                    (probe.value, probe.locale),
                    Observation {
                        resolved: probe.resolved,
                        formatted: probe.formatted,
                    },
                )
            })
            .collect();
        let result = supported_values_of(&request.key, |_, value, locale| {
            observations
                .get(&(value.to_owned(), locale.to_owned()))
                .cloned()
        });
        println!(
            "{}",
            match result {
                Ok(values) => json!({"values": values}),
                Err(_) => json!({"error": "RangeError"}),
            }
        );
    }
    Ok(())
}
