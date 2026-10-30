use icu_locale::{Locale, LocaleCanonicalizer, LocaleFallbacker};
use icu_provider::DataLocale;
use std::{collections::HashMap, hint::black_box, time::Instant};

fn parse(tag: &str) -> DataLocale {
    let mut locale: Locale = tag.parse().unwrap();
    LocaleCanonicalizer::new_extended().canonicalize(&mut locale);
    locale.into()
}

// Membership/default handling is benchmark glue; ICU4X supplies the fallback chain.
struct FallbackMatcher {
    supported: Vec<String>,
    indexes: HashMap<DataLocale, usize>,
    fallbacker: LocaleFallbacker,
}
impl FallbackMatcher {
    fn new(tags: &[&str]) -> Self {
        let mut indexes = HashMap::new();
        for (index, tag) in tags.iter().enumerate() {
            indexes.entry(parse(tag)).or_insert(index);
        }
        Self {
            supported: tags.iter().map(|tag| (*tag).to_owned()).collect(),
            indexes,
            fallbacker: LocaleFallbacker::new().static_to_owned(),
        }
    }
    fn prepared(&self, requested: &[DataLocale]) -> &str {
        for request in requested {
            let mut chain = self
                .fallbacker
                .for_config(Default::default())
                .fallback_for(request.clone());
            loop {
                if let Some(&index) = self.indexes.get(chain.get()) {
                    return &self.supported[index];
                }
                if chain.get().is_unknown() {
                    break;
                }
                chain.step();
            }
        }
        "en"
    }
    fn strings(&self, requested: &[&str]) -> &str {
        let parsed: Vec<_> = requested.iter().map(|tag| parse(tag)).collect();
        self.prepared(&parsed)
    }
}
fn main() {
    let args: Vec<_> = std::env::args().collect();
    let input = std::fs::read_to_string(&args[1]).unwrap();
    let mut sets = HashMap::new();
    for line in input.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        if fields[0] == "support" {
            sets.insert(fields[1], fields[2].split(',').collect::<Vec<_>>());
        }
    }
    if args.get(2).is_some_and(|s| s == "--once") {
        println!("{}", FallbackMatcher::new(&sets["full"]).strings(&["en"]));
        return;
    }
    let iterations: usize = args.get(2).map(|s| s.parse().unwrap()).unwrap_or(100_000);
    eprintln!(
        "ICU4X icu_locale 2.3.1 / icu_locale_fallback 2.3.0; parent fallback, not distance matching; iterations {iterations}"
    );
    for (name, supported) in &sets {
        for _ in 0..20 {
            black_box(FallbackMatcher::new(supported));
        }
        let start = Instant::now();
        for _ in 0..100 {
            black_box(FallbackMatcher::new(black_box(supported)));
        }
        println!(
            "icu4x_fallback\tconstruct\t{name}\t{:.2}\t-",
            start.elapsed().as_nanos() as f64 / 100.0
        );
    }
    for line in input.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        if fields[0] != "case" && fields[0] != "cycle" {
            continue;
        }
        let requested: Vec<_> = fields[3].split(',').collect();
        let prepared: Vec<_> = requested.iter().map(|tag| parse(tag)).collect();
        let matcher = FallbackMatcher::new(&sets[fields[2]]);
        let expected = matcher.prepared(&prepared);
        let cycle = fields[0] == "cycle";
        let count = if cycle {
            (iterations / 20).max(1000)
        } else {
            iterations
        };
        for parsed in [true, false] {
            for i in 0..count {
                let index = if cycle { i % requested.len() } else { 0 };
                let end = if cycle { index + 1 } else { requested.len() };
                if parsed {
                    black_box(matcher.prepared(black_box(&prepared[index..end])));
                } else {
                    black_box(matcher.strings(black_box(&requested[index..end])));
                }
            }
            let start = Instant::now();
            for i in 0..count {
                let index = if cycle { i % requested.len() } else { 0 };
                let end = if cycle { index + 1 } else { requested.len() };
                if parsed {
                    black_box(matcher.prepared(black_box(&prepared[index..end])));
                } else {
                    black_box(matcher.strings(black_box(&requested[index..end])));
                }
            }
            println!(
                "icu4x_fallback\t{}\t{}\t{:.2}\t{expected}",
                if parsed { "prepared" } else { "strings" },
                fields[1],
                start.elapsed().as_nanos() as f64 / count as f64
            );
        }
    }
}
