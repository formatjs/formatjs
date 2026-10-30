use formatjs_intl_pluralrules::{
    Error, LocaleRules,
    digits::{Error as DigitError, Options},
    instance::{Options as InstanceOptions, PluralRules},
};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead};
use std::sync::Arc;

#[derive(Deserialize)]
struct Case {
    decimal: String,
    exponent: usize,
    ordinal: bool,
    #[serde(default)]
    bigint: bool,
}
#[derive(Deserialize)]
struct Range {
    start: String,
    end: String,
    ordinal: bool,
    #[serde(default, rename = "startBigint")]
    start_bigint: bool,
    #[serde(default, rename = "endBigint")]
    end_bigint: bool,
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
    #[serde(default)]
    mathematical: bool,
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    for line in io::stdin().lock().lines() {
        let request: Request = serde_json::from_str(&line?)?;
        let rules = Arc::new(LocaleRules::from_json(&request.pack)?);
        let instances = match request
            .digits
            .as_ref()
            .map(|digits| {
                [false, true]
                    .into_iter()
                    .map(|ordinal| {
                        PluralRules::new(
                            rules.clone(),
                            &InstanceOptions {
                                kind: Some(if ordinal { "ordinal" } else { "cardinal" }.to_owned()),
                                notation: request.notation.clone(),
                                compact_display: request.compact_display.clone(),
                                digits: digits.clone(),
                            },
                        )
                    })
                    .collect::<Result<Vec<_>, Error>>()
            })
            .transpose()
        {
            Ok(value) => value,
            Err(error) => {
                println!(
                    "{}",
                    json!({"error":match error {Error::Digits(DigitError::Type(_))=>"TypeError",_=>"RangeError"}})
                );
                continue;
            }
        };
        let mut values = Vec::new();
        for case in &request.cases {
            values.push(if let Some(instances) = &instances {
                if request.mathematical {
                    instances[usize::from(case.ordinal)]
                        .select_mathematical(&case.decimal, case.bigint)?
                } else {
                    instances[usize::from(case.ordinal)].select(&case.decimal)?
                }
            } else {
                rules.select_rounded(&case.decimal, case.exponent, case.ordinal)?
            });
        }
        let mut ranges = Vec::new();
        for range in &request.ranges {
            ranges.push(
                if let Some(instances) = &instances {
                    if request.mathematical {
                        instances[usize::from(range.ordinal)].select_range_mathematical(
                            &range.start,
                            &range.end,
                            range.start_bigint,
                            range.end_bigint,
                        )?
                    } else {
                        instances[usize::from(range.ordinal)]
                            .select_range(&range.start, &range.end)?
                    }
                } else {
                    rules.select_range_rounded(&range.start, &range.end, 0, 0, range.ordinal)?
                }
                .to_owned(),
            );
        }
        let resolved = instances.as_ref().map(|values| {
            values
                .iter()
                .map(PluralRules::resolved_options)
                .collect::<Vec<_>>()
        });
        let digits = instances
            .as_ref()
            .map(|values| values[0].resolved_options().digits);

        println!(
            "{}",
            json!({"locale":rules.locale(),"cardinal":rules.categories(false),"ordinal":rules.categories(true),"values":values,"ranges":ranges,"digits":digits,"resolved":resolved})
        );
    }
    Ok(())
}
