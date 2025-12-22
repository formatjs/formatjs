use criterion::{black_box, criterion_group, criterion_main, Criterion};
use formatjs_icu_messageformat_parser::{Parser, ParserOptions};

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

fn benchmark_complex_msg(c: &mut Criterion) {
    c.bench_function("complex_msg", |b| {
        b.iter(|| {
            let parser = Parser::new(black_box(COMPLEX_MSG), ParserOptions::default());
            parser.parse()
        })
    });
}

fn benchmark_normal_msg(c: &mut Criterion) {
    c.bench_function("normal_msg", |b| {
        b.iter(|| {
            let parser = Parser::new(black_box(NORMAL_MSG), ParserOptions::default());
            parser.parse()
        })
    });
}

fn benchmark_simple_msg(c: &mut Criterion) {
    c.bench_function("simple_msg", |b| {
        b.iter(|| {
            let parser = Parser::new(black_box(SIMPLE_MSG), ParserOptions::default());
            parser.parse()
        })
    });
}

fn benchmark_string_msg(c: &mut Criterion) {
    c.bench_function("string_msg", |b| {
        b.iter(|| {
            let parser = Parser::new(black_box(STRING_MSG), ParserOptions::default());
            parser.parse()
        })
    });
}

criterion_group!(
    name = benches;
    config = Criterion::default()
        .sample_size(100)
        .noise_threshold(0.05);
    targets = benchmark_complex_msg,
    benchmark_normal_msg,
    benchmark_simple_msg,
    benchmark_string_msg
);
criterion_main!(benches);
