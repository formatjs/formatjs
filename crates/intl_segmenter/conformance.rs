use formatjs_intl_segmenter::{Options, SegmentData, Segmenter};
use serde::Deserialize;
use serde_json::{Value, json};
use std::io::{self, BufRead};

#[derive(Deserialize)]
struct Request {
    locales: Vec<String>,
    options: Options,
    inputs: Vec<Vec<u16>>,
}
fn record(value: SegmentData<'_>) -> Value {
    let mut result = json!({"segment":value.segment,"index":value.index});
    if let Some(word) = value.is_word_like {
        result["isWordLike"] = json!(word);
    }
    result
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let model = Segmenter::new(&request.locales, &request.options)?;
        let values: Vec<_> = request
            .inputs
            .into_iter()
            .map(|input| {
                let segments = model.segment(input);
                let records: Vec<_> = segments.iter().map(record).collect();
                let containing: Vec<_> = (0..=segments.input().len())
                    .map(|index| segments.containing(index).map(record))
                    .collect();
                json!({"records":records,"containing":containing})
            })
            .collect();
        println!(
            "{}",
            json!({"options":model.resolved_options(),"values":values})
        );
    }
    Ok(())
}
