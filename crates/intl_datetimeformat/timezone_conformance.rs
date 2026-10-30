use formatjs_intl_datetimeformat::timezone::TimeZoneRegistry;
use serde::{Deserialize, Serialize};
use std::io::{self, BufRead};

#[derive(Deserialize)]
struct Request {
    name: String,
    instants: Vec<String>,
}
#[derive(Serialize)]
struct Response<'a> {
    name: &'a str,
    samples: Vec<Option<[i64; 10]>>,
}
fn main() {
    let registry = TimeZoneRegistry::default();
    let pack = std::fs::read_to_string(std::env::args().nth(1).expect("pack path"))
        .expect("timezone JSON");
    registry.load_json(&pack).expect("valid timezone pack");
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line.expect("read input")).expect("request");
        let Ok(zone) = registry.resolve(&request.name) else {
            println!("{{\"error\":\"InvalidTimeZone\"}}");
            continue;
        };
        let samples = request
            .instants
            .into_iter()
            .map(|value| {
                let instant = value.parse().expect("epoch nanoseconds");
                registry
                    .local_time(&zone, instant)
                    .ok()
                    .map(|(date, offset)| {
                        [
                            i64::from(date.year),
                            i64::from(date.month),
                            i64::from(date.day),
                            i64::from(date.weekday),
                            i64::from(date.hour),
                            i64::from(date.minute),
                            i64::from(date.second),
                            i64::from(date.nanosecond),
                            i64::from(offset.seconds),
                            i64::from(offset.in_dst),
                        ]
                    })
            })
            .collect();
        println!(
            "{}",
            serde_json::to_string(&Response {
                name: zone.identifier(),
                samples
            })
            .unwrap()
        );
    }
}
