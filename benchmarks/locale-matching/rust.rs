use formatjs_intl_localematcher::{CLDR_VERSION, DesiredLocale, LocaleMatcher};
use std::{collections::HashMap, hint::black_box, time::Instant};
fn main() {
    let args: Vec<_> = std::env::args().collect();
    let input = std::fs::read_to_string(&args[1]).unwrap();
    let once = args.get(2).is_some_and(|s| s == "--once");
    let iterations: usize = if once {
        0
    } else {
        args.get(2).map(|s| s.parse().unwrap()).unwrap_or(200_000)
    };
    let mut sets = HashMap::new();
    for line in input.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        if fields[0] == "support" {
            sets.insert(fields[1], fields[2].split(',').collect::<Vec<_>>());
        }
    }
    if once {
        let matcher = LocaleMatcher::new(&sets["full"], "en").unwrap();
        println!("{}", matcher.best_match(&["en"]).unwrap().locale);
        return;
    }
    eprintln!("Rust CLDR {CLDR_VERSION}; iterations {iterations}");
    for (name, supported) in &sets {
        for _ in 0..20 {
            black_box(LocaleMatcher::new(supported, "en").unwrap());
        }
        let start = Instant::now();
        for _ in 0..100 {
            black_box(LocaleMatcher::new(black_box(supported), "en").unwrap());
        }
        println!(
            "rust\tconstruct\t{name}\t{:.2}\t-",
            start.elapsed().as_nanos() as f64 / 100.0
        );
    }
    for line in input.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        if fields[0] != "case" && fields[0] != "cycle" {
            continue;
        }
        let requested: Vec<_> = fields[3].split(',').collect();
        let prepared: Vec<_> = requested
            .iter()
            .map(|tag| DesiredLocale::new(tag).unwrap())
            .collect();
        let matcher = LocaleMatcher::new(&sets[fields[2]], "en").unwrap();
        let expected = matcher.best_match(&requested).unwrap().locale;
        assert_eq!(matcher.best_match_prepared(&prepared).locale, expected);
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
                    black_box(matcher.best_match_prepared(black_box(&prepared[index..end])));
                } else {
                    black_box(
                        matcher
                            .best_match(black_box(&requested[index..end]))
                            .unwrap(),
                    );
                }
            }
            let start = Instant::now();
            for i in 0..count {
                let index = if cycle { i % requested.len() } else { 0 };
                let end = if cycle { index + 1 } else { requested.len() };
                if parsed {
                    black_box(matcher.best_match_prepared(black_box(&prepared[index..end])));
                } else {
                    black_box(
                        matcher
                            .best_match(black_box(&requested[index..end]))
                            .unwrap(),
                    );
                }
            }
            println!(
                "rust\t{}\t{}\t{:.2}\t{}",
                if parsed { "prepared" } else { "strings" },
                fields[1],
                start.elapsed().as_nanos() as f64 / count as f64,
                expected
            );
        }
    }
}
