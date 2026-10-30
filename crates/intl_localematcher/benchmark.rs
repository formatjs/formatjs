use formatjs_intl_localematcher::LocaleMatcher;
use std::hint::black_box;
use std::time::Instant;

fn main() {
    let supported = [
        "en", "en-GB", "fr", "es", "es-419", "pt-BR", "pt-PT", "zh", "zh-Hant", "bs", "sr-Latn",
    ];
    let matcher = LocaleMatcher::new(&supported, "en").unwrap();
    for requested in [
        ["en"],
        ["en-US"],
        ["zh-TW"],
        ["es-MX"],
        ["sr-Latn-BA"],
        ["en-XZ"],
    ] {
        let start = Instant::now();
        for _ in 0..100_000 {
            black_box(matcher.best_match(black_box(&requested)).unwrap());
        }
        println!(
            "{}: {:.0} ns/match",
            requested[0],
            start.elapsed().as_nanos() as f64 / 100_000.0
        );
    }
}
