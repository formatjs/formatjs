use formatjs_intl_listformat::{ListFormat, LocalePatterns, Options};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};
use std::sync::Arc;

#[derive(Deserialize)]
struct Request {
    pack: String,
    options: Options,
    lists: Vec<Vec<Vec<u16>>>,
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let formatter = ListFormat::new(
            Arc::new(LocalePatterns::from_json(&request.pack)?),
            request.options,
        );
        let results: Vec<_> = request
            .lists
            .iter()
            .map(|list| {
                json!({
                    "formatted":formatter.format(list), "parts":formatter.format_to_parts(list)
                })
            })
            .collect();
        println!(
            "{}",
            json!({"options":formatter.resolved_options(),"results":results})
        );
    }
    Ok(())
}
