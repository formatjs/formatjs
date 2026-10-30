use formatjs_intl_displaynames::{DisplayNames, LocaleNames, Options};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};
use std::sync::Arc;

#[derive(Deserialize)]
struct Case {
    options: Options,
    codes: Vec<String>,
}
#[derive(Deserialize)]
struct Request {
    pack: String,
    cases: Vec<Case>,
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let data = Arc::new(LocaleNames::from_json(&request.pack)?);
        let results: Vec<_> = request
            .cases
            .into_iter()
            .map(|case| {
                let formatter = DisplayNames::new(data.clone(), case.options);
                let values: Vec<_> = case
                    .codes
                    .iter()
                    .map(|code| match formatter.of(code) {
                        Ok(name) => json!({"value":name}),
                        Err(_) => json!({"error":"RangeError"}),
                    })
                    .collect();
                json!({"options":formatter.resolved_options(),"values":values})
            })
            .collect();
        println!("{}", json!(results));
    }
    Ok(())
}
