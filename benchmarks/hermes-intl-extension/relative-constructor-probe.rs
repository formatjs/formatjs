use formatjs_intl_relativetimeformat::{Options, registry::Registry};
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
    let options = Options::default();
    for tag in ["en", "en-XX", "en-u-nu-arab"] {
        let requested = [tag.to_owned()];
        let resolution = registry.resolve(&requested, &options).unwrap();
        let model = registry.create_resolved(&resolution, &options).unwrap();
        let expected = if tag.ends_with("arab") {
            "٣ days ago"
        } else {
            "3 days ago"
        };
        assert_eq!(model.format("-3", "day").unwrap(), expected);
        println!("{tag}");
        measure("resolve", || {
            registry.resolve(black_box(&requested), &options).unwrap()
        });
        measure("create_resolved", || {
            registry
                .create_resolved(black_box(&resolution), &options)
                .unwrap()
        });
        measure("create", || {
            registry.create(black_box(&requested), &options).unwrap()
        });
    }
}
