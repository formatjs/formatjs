use formatjs_temporal::Instant;
use std::{hint::black_box, time::Instant as Timer};

fn convert(day: i64) -> u64 {
    let value = Instant::from_epoch_nanoseconds(black_box(i128::from(day) * 86_400_000_000_000))
        .unwrap()
        .to_iso();
    (value.year as u64)
        .wrapping_mul(512)
        .wrapping_add(u64::from(value.month) * 32 + u64::from(value.day))
}

fn sample(days: &[i64], iterations: usize) -> (f64, u64) {
    let start = Timer::now();
    let mut checksum = 0u64;
    for index in 0..iterations {
        checksum = checksum.wrapping_add(black_box(convert(days[black_box(index & 8191)])));
    }
    (
        start.elapsed().as_nanos() as f64 / iterations as f64,
        black_box(checksum),
    )
}

fn main() {
    let mut args = std::env::args().skip(1);
    if args.next().as_deref() == Some("--first") {
        let day: i64 = args.next().unwrap().parse().unwrap();
        let start = Timer::now();
        let checksum = black_box(convert(day));
        let nanoseconds = start.elapsed().as_nanos();
        println!(
            "{{\"epochDay\":{day},\"nanoseconds\":{nanoseconds},\"checksum\":\"{checksum}\"}}"
        );
        return;
    }
    let mut state = 0x5d3a_61e8_42b9_07cfu64;
    let mut days = Vec::with_capacity(8192);
    for _ in 0..8192 {
        state = state.wrapping_mul(6364136223846793005).wrapping_add(1);
        days.push(((state >> 16) % 200_000_001) as i64 - 100_000_000);
    }
    days[..4].copy_from_slice(&[-100_000_000, -1, 0, 100_000_000]);
    let (first_pass, first_checksum) = sample(&days, 8192);
    black_box(sample(&days, 100_000));
    let mut samples = Vec::with_capacity(9);
    let mut checksum = None;
    for _ in 0..9 {
        let (nanoseconds, value) = sample(&days, 1_000_000);
        assert!(checksum.is_none_or(|expected| expected == value));
        checksum = Some(value);
        samples.push(nanoseconds);
    }
    println!(
        "{{\"poolSize\":8192,\"warmup\":100000,\"iterations\":1000000,\"firstPassNanoseconds\":{first_pass},\"firstPassChecksum\":\"{first_checksum}\",\"samplesNanoseconds\":{samples:?},\"checksum\":\"{}\"}}",
        checksum.unwrap()
    );
}
