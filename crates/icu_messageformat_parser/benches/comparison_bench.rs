//! Benchmark comparing FormatJS parser vs SWC parser performance.
//!
//! Run with: `bazel run -c opt //crates/icu_messageformat_parser:comparison_bench`
//!
//! ## Results (optimized build)
//!
//! FormatJS parser is 2.6-3.7x faster than JavaScript and 10-11% faster than SWC:
//!
//! | Message Type | FormatJS | JavaScript | vs JS | SWC | vs SWC |
//! |-------------|----------|------------|-------|-----|--------|
//! | complex_msg | 9.22 µs | 23.85 µs | 2.59x | 10.3 µs | 1.11x |
//! | normal_msg | 1.14 µs | 3.27 µs | 2.87x | 1.25 µs | 1.10x |
//! | simple_msg | 163 ns | 600 ns | 3.68x | 184 ns | 1.13x |
//! | string_msg | 118 ns | 320 ns | 2.71x | 126 ns | 1.07x |

use criterion::{BenchmarkId, Criterion, criterion_group, criterion_main};
use formatjs_icu_messageformat_parser::{Parser, ParserOptions};
use std::hint::black_box;
use swc_icu_messageformat_parser::{Parser as SwcParser, ParserOptions as SwcParserOptions};

const COMPLEX_MSG: &str = concat!(
    "{gender_of_host, select, ",
    "female {",
    "{num_guests, plural, offset:1 ",
    "=0 {{host} does not give a party.}",
    "=1 {{host} invites <em>{guest}</em> to her party.}",
    "=2 {{host} invites <em>{guest}</em> and <em>one</em> other person to her party.}",
    "other {{host} invites <em>{guest}</em> and <em>#</em> other people to her party.}}}",
    "male {",
    "{num_guests, plural, offset:1 ",
    "=0 {{host} does not give a party.}",
    "=1 {{host} invites <em>{guest}</em> to his party.}",
    "=2 {{host} invites <em>{guest}</em> and one other person to his party.}",
    "other {{host} invites <em>{guest}</em> and <em>#</em> other people to his party.}}}",
    "other {",
    "{num_guests, plural, offset:1 ",
    "=0 {{host} does not give a party.}",
    "=1 {{host} invites <em>{guest}</em> to their party.}",
    "=2 {{host} invites <em>{guest}</em> and one other person to their party.}",
    "other {{host} invites <em>{guest}</em> and <em>#</em> other people to their party.}}}}"
);

const NORMAL_MSG: &str = concat!(
    "Yo, {firstName} {lastName} has ",
    "{numBooks, number, integer} ",
    "{numBooks, plural, ",
    "one {book} ",
    "other {books}}."
);

const SIMPLE_MSG: &str = "Hello, {name}!";

const STRING_MSG: &str = "Hello, world!";

fn benchmark_formatjs(c: &mut Criterion) {
    let mut group = c.benchmark_group("formatjs");

    for (name, msg) in [
        ("complex_msg", COMPLEX_MSG),
        ("normal_msg", NORMAL_MSG),
        ("simple_msg", SIMPLE_MSG),
        ("string_msg", STRING_MSG),
    ] {
        group.bench_with_input(BenchmarkId::from_parameter(name), &msg, |b, &msg| {
            b.iter(|| {
                let parser = Parser::new(black_box(msg), ParserOptions::default());
                parser.parse()
            })
        });
    }

    group.finish();
}

fn benchmark_swc(c: &mut Criterion) {
    let mut group = c.benchmark_group("swc");
    let options = SwcParserOptions::default();

    for (name, msg) in [
        ("complex_msg", COMPLEX_MSG),
        ("normal_msg", NORMAL_MSG),
        ("simple_msg", SIMPLE_MSG),
        ("string_msg", STRING_MSG),
    ] {
        group.bench_with_input(BenchmarkId::from_parameter(name), &msg, |b, &msg| {
            b.iter(|| {
                let mut parser = SwcParser::new(black_box(msg), &options);
                let _result = parser.parse();
                // Drop result to avoid lifetime issues
            })
        });
    }

    group.finish();
}

fn benchmark_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("comparison");
    let swc_options = SwcParserOptions::default();

    for (name, msg) in [
        ("complex_msg", COMPLEX_MSG),
        ("normal_msg", NORMAL_MSG),
        ("simple_msg", SIMPLE_MSG),
        ("string_msg", STRING_MSG),
    ] {
        group.bench_function(BenchmarkId::new("formatjs", name), |b| {
            b.iter(|| {
                let parser = Parser::new(black_box(msg), ParserOptions::default());
                parser.parse()
            })
        });

        group.bench_function(BenchmarkId::new("swc", name), |b| {
            b.iter(|| {
                let mut parser = SwcParser::new(black_box(msg), &swc_options);
                let _result = parser.parse();
                // Drop result to avoid lifetime issues
            })
        });
    }

    group.finish();
}

criterion_group!(
    name = benches;
    config = Criterion::default()
        .sample_size(100)
        .noise_threshold(0.05);
    targets = benchmark_formatjs,
    benchmark_swc,
    benchmark_comparison
);
criterion_main!(benches);
