use formatjs_intl_pluralrules::{
    LocaleRules,
    digits::{Digits, Error as DigitError, Options},
};
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
struct Range {
    start: String,
    end: String,
    ordinal: bool,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Request {
    pack: String,
    cases: Vec<Case>,
    digits: Option<Options>,
    notation: Option<String>,
    compact_display: Option<String>,
    #[serde(default)]
    ranges: Vec<Range>,
}
fn nonfinite(value: &str) -> bool {
    ["NaN", "Infinity", "-Infinity"].contains(&value)
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let rules = LocaleRules::from_json(&request.pack)?;
        let compact = request.notation.as_deref() == Some("compact");
        let long = request.compact_display.as_deref() == Some("long");
        let digits = match request
            .digits
            .as_ref()
            .map(|options| Digits::new(options, compact))
            .transpose()
        {
            Ok(value) => value,
            Err(error) => {
                println!(
                    "{}",
                    json!({"error":match error {DigitError::Type(_)=>"TypeError",_=>"RangeError"}})
                );
                continue;
            }
        };
        let format = |value: &str| -> Result<String, DigitError> {
            if nonfinite(value) {
                Ok(value.to_owned())
            } else if let Some(digits) = &digits {
                digits.format(value).map(|value| value.formatted_string)
            } else {
                Ok(value.to_owned())
            }
        };
        let exponent =
            |value: &str, fallback: usize| -> Result<usize, formatjs_intl_pluralrules::Error> {
                if compact && !nonfinite(value) {
                    rules.compact_exponent(value, long)
                } else {
                    Ok(fallback)
                }
            };
        let mut values = Vec::new();
        for case in &request.cases {
            let formatted = format(&case.decimal)?;
            values.push(rules.select_rounded(
                &formatted,
                exponent(&formatted, case.exponent)?,
                case.ordinal,
            )?);
        }
        let mut ranges = Vec::new();
        for range in &request.ranges {
            let start = format(&range.start)?;
            let end = format(&range.end)?;
            ranges.push(
                rules
                    .select_range_rounded(
                        &start,
                        &end,
                        exponent(&start, 0)?,
                        exponent(&end, 0)?,
                        range.ordinal,
                    )?
                    .to_owned(),
            );
        }
        println!(
            "{}",
            json!({"locale":rules.locale(),"cardinal":rules.categories(false),"ordinal":rules.categories(true),"values":values,"ranges":ranges,"digits":digits})
        );
    }
    Ok(())
}
