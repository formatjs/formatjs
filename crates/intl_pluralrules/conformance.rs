use formatjs_intl_pluralrules::LocaleRules;
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};

#[derive(Deserialize)]
struct Case {
    decimal: String,
    exponent: usize,
    ordinal: bool,
}
#[derive(Deserialize)]
struct Request {
    pack: String,
    cases: Vec<Case>,
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let rules = LocaleRules::from_json(&request.pack)?;
        let values = request
            .cases
            .iter()
            .map(|case| rules.select_rounded(&case.decimal, case.exponent, case.ordinal))
            .collect::<Result<Vec<_>, _>>()?;
        println!(
            "{}",
            json!({"locale":rules.locale(),"cardinal":rules.categories(false),"ordinal":rules.categories(true),"values":values})
        );
    }
    Ok(())
}
