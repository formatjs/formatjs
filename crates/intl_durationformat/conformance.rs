use formatjs_intl_durationformat::{Configuration, Duration, Error, Options, Part, Renderer};
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead};
#[derive(Deserialize)]
#[serde(tag = "method", rename_all = "camelCase")]
enum Request {
    Options {
        options: Options,
    },
    Record {
        values: [Option<String>; 10],
    },
    NumberData {
        data: String,
    },
    ListData {
        data: String,
    },
    Format {
        options: Options,
        values: [String; 10],
        locale: String,
        numbering_system: String,
        separator: String,
    },
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
    Parts(Vec<Part>),
    Loaded(bool),
    Error { error: &'static str },
}
fn run(request: Request, renderer: &mut Renderer) -> Result<Response, Error> {
    match request {
        Request::NumberData { data } => renderer
            .add_number_data(&data)
            .map(|_| Response::Loaded(true))
            .map_err(|_| Error::InvalidOption),
        Request::ListData { data } => renderer
            .add_list_data(&data)
            .map(|_| Response::Loaded(true))
            .map_err(|_| Error::InvalidOption),
        Request::Format {
            options,
            values,
            locale,
            numbering_system,
            separator,
        } => {
            let mut numbers = [None; 10];
            for (output, value) in numbers.iter_mut().zip(values) {
                *output = Some(value.parse::<f64>().map_err(|_| Error::InvalidDuration)?);
            }
            let duration = Duration::from_numbers(numbers)?;
            renderer
                .format_to_parts(
                    &Configuration::new(&options)?,
                    &locale,
                    &numbering_system,
                    &separator,
                    &duration,
                )
                .map(Response::Parts)
                .map_err(|_| Error::InvalidOption)
        }
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
    let mut renderer = Renderer::default();
    for line in io::stdin().lock().lines() {
        let line = line.expect("stdin");
        let response = serde_json::from_str(&line)
            .map_err(|_| Error::InvalidOption)
            .and_then(|request| run(request, &mut renderer))
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
