use std::io::{self, BufRead};

use formatjs_intl_locale::{Locale, LocaleOptions};
use serde::Deserialize;
use serde_json::json;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    tag: String,
    #[serde(default)]
    options: LocaleOptions,
    default_numbering_system: Option<String>,
    #[serde(default)]
    global_collations: Vec<String>,
    #[serde(default)]
    matched_collation: bool,
    #[serde(default)]
    accepted_collations: Vec<String>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let value = match Locale::new(&request.tag, &request.options) {
            Ok(locale) => {
                let mut value = serde_json::to_value(
                    locale.snapshot(request.default_numbering_system.as_deref()),
                )?;
                value["collations"] = json!(locale.collations(
                    &request.global_collations,
                    request.matched_collation,
                    |value| {
                        request
                            .accepted_collations
                            .iter()
                            .any(|candidate| candidate == value)
                    },
                ));
                value
            }
            Err(_) => json!({"error": "RangeError"}),
        };
        println!("{}", serde_json::to_string(&value)?);
    }
    Ok(())
}
