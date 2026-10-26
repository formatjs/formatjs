use formatjs_intl_pluralrules::{instance::Options, registry::Registry};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};

#[derive(Deserialize)]
struct Request {
    packs: Vec<String>,
    queries: Vec<String>,
    #[serde(default)]
    requested: Vec<Vec<String>>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let mut registry = Registry::default();
        for pack in request.packs {
            registry.add_locale_data(&pack)?;
        }
        let values = request.queries.iter().map(|locale| {
            match registry.create(locale, &Options::default()) {
                Ok(rules) => Ok(json!({"resolved":rules.resolved_options(),"one":rules.select("1")?,"five":rules.select("5")?,"range":rules.select_range("1","2")?})),
                Err(formatjs_intl_pluralrules::Error::MissingLocale) => Ok(json!({"missing":true})),
                Err(error) => Err(error),
            }
        }).collect::<Result<Vec<_>, formatjs_intl_pluralrules::Error>>()?;
        println!(
            "{}",
            json!({"available":registry.available_locales(),"default":registry.default_locale(),"values":values,
                "matches":request.requested.iter().map(|requested| {
                    let matched = |lookup| match registry.negotiate(requested, lookup) {
                        Ok(value) => Ok(Some(value)),
                        Err(formatjs_intl_pluralrules::Error::MissingLocale) => Ok(None),
                        Err(error) => Err(error),
                    };
                    Ok(json!({"lookup":matched(true)?,"bestFit":matched(false)?,"supported":registry.supported_locales(requested)}))
                }).collect::<Result<Vec<_>,formatjs_intl_pluralrules::Error>>()?
            })
        );
    }
    Ok(())
}
