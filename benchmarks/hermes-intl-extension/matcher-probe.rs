use formatjs_intl_listformat::registry::Registry;
use formatjs_intl_localematcher::{DesiredLocale, LocaleMatcher};
use std::{hint::black_box, time::Instant};

fn measure<T>(name: &str, mut call: impl FnMut() -> T) {
    black_box(call());
    let start = Instant::now();
    for _ in 0..100_000 {
        black_box(call());
    }
    println!(
        "{name}: {:.0} ns/call",
        start.elapsed().as_nanos() as f64 / 100_000.0
    );
}
fn main() {
    let registry = Registry::with_compiled_data();
    let available = registry.available_locales();
    let matcher = LocaleMatcher::new(available, available.first().unwrap()).unwrap();
    println!("available locales: {}", available.len());
    for tag in ["en", "en-XX", "qzz"] {
        let requested = [tag.to_owned()];
        let prepared = [DesiredLocale::new(tag).unwrap()];
        let expected = matcher.best_match(&requested).unwrap();
        let actual = matcher.best_match_prepared(&prepared);
        assert_eq!(
            (actual.locale, actual.desired_index),
            (expected.locale, expected.desired_index)
        );
        println!("{tag}: {}", registry.negotiate(&requested, false).unwrap());
        measure("registry", || {
            registry.negotiate(black_box(&requested), false).unwrap()
        });
        measure("shared wrapper", || {
            formatjs_intl_locale::matcher::best_fit(black_box(available), black_box(&requested))
                .unwrap()
        });
        measure("direct matcher", || {
            matcher.best_match(black_box(&requested)).unwrap()
        });
        measure("prepared request", || {
            matcher.best_match_prepared(black_box(&prepared))
        });
    }
}
