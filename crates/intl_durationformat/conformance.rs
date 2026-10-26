use formatjs_intl_durationformat::{Configuration, Duration, Error, Options};
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead};
#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Request {
    Options { options: Options },
    Record { values: [Option<String>; 10] },
}
#[derive(Serialize)]
struct Record {
    values: [String; 10],
    negative: bool,
}
#[derive(Serialize)]
#[serde(untagged)]
enum Response {
    Options(Configuration),
    Record(Record),
    Error { error: &'static str },
}
fn run(request: Request) -> Result<Response, Error> {
    match request {
        Request::Options { options } => Ok(Response::Options(Configuration::new(&options)?)),
        Request::Record { values } => {
            let mut numbers = [None; 10];
            for (output, value) in numbers.iter_mut().zip(values) {
                *output = value
                    .map(|value| value.parse::<f64>().map_err(|_| Error::InvalidDuration))
                    .transpose()?;
            }
            let duration = Duration::from_numbers(numbers)?;
            Ok(Response::Record(Record {
                values: duration.values().map(|value| value.to_string()),
                negative: duration.is_negative(),
            }))
        }
    }
}
fn main() {
    for line in io::stdin().lock().lines() {
        let line = line.expect("stdin");
        let response = serde_json::from_str(&line)
            .map_err(|_| Error::InvalidOption)
            .and_then(run)
            .unwrap_or_else(|error| Response::Error {
                error: if error == Error::EmptyDuration {
                    "TypeError"
                } else {
                    "RangeError"
                },
            });
        println!("{}", serde_json::to_string(&response).expect("JSON"));
    }
}
