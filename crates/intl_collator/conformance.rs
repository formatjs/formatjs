use formatjs_intl_collator::{Collator, Options};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};
#[derive(Deserialize)]
struct Request {
    locales: Vec<String>,
    options: Options,
    pairs: Vec<(Vec<u16>, Vec<u16>)>,
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        match Collator::new(&request.locales, &request.options) {
            Ok(model) => println!(
                "{}",
                json!({"options":model.resolved_options(),"values":request.pairs.iter().map(|(left,right)| model.compare(left,right)).collect::<Vec<_>>()})
            ),
            Err(error) => println!("{}", json!({"error":error.to_string()})),
        }
    }
    Ok(())
}
