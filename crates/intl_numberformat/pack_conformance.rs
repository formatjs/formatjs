use formatjs_intl_numberformat::LocaleData;
use serde::Serialize;
use std::io::{self, BufRead};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Result {
    locale: String,
    numbering_systems: Vec<String>,
}

fn main() -> std::result::Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let data = LocaleData::from_json(&line?)?;
        println!(
            "{}",
            serde_json::to_string(&Result {
                locale: data.locale().to_owned(),
                numbering_systems: data.numbering_systems().to_vec(),
            })?
        );
    }
    Ok(())
}
