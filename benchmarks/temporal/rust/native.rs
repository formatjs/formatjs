mod utc_provider;
use formatjs_temporal as own;
use reference::options::{RoundingOptions, ToStringRoundingOptions, Unit};
use std::{hint::black_box, time::Instant as Timer};
use temporal_rs as reference;

const INSTANTS: [&str; 4] = [
    "2020-03-08T06:59:59.123456789Z",
    "1969-12-31T23:59:59.999999999Z",
    "2000-02-29T12:34:56.987654321+05:45",
    "2400-11-05T01:02:03.000000001-04:00",
];
const DURATIONS: [&str; 4] = [
    "PT1H2M3.123456789S",
    "P1Y2M3DT4H5M6.000000007S",
    "-P2DT3H4M5.006007008S",
    "PT0S",
];
const DATES: [&str; 4] = ["2020-02-29", "2000-01-31", "1900-12-31", "2400-06-15"];
const TIMES: [&str; 4] = [
    "01:02:03.123456789",
    "23:59:59.999999999",
    "12:30:45.987654321",
    "00:00:00",
];

fn hash(text: &str) -> u64 {
    // Match JavaScript's integer checksum without timing BigInt hashing.
    u64::from(text.bytes().fold(0x811c9dc5u32, |value, byte| {
        (value ^ u32::from(byte)).wrapping_mul(0x01000193)
    }))
}
fn fields(year: i32, month: u8, day: u8) -> u64 {
    (year as u64)
        .wrapping_mul(512)
        .wrapping_add(u64::from(month) * 32 + u64::from(day))
}
fn round_options() -> RoundingOptions {
    let mut result = RoundingOptions::default();
    result.smallest_unit = Some(Unit::Microsecond);
    result.rounding_mode = Some(reference::options::RoundingMode::HalfExpand);
    result
}
fn sample(operation: &impl Fn(usize) -> u64, iterations: usize) -> (f64, u64) {
    let mut checksum = 0u64;
    let start = Timer::now();
    for index in 0..iterations {
        checksum = checksum.wrapping_add(black_box(operation(black_box(index & 3))));
    }
    (
        start.elapsed().as_nanos() as f64 / iterations as f64,
        black_box(checksum),
    )
}
fn record(
    name: &str,
    ours: impl Fn(usize) -> u64,
    theirs: impl Fn(usize) -> u64,
    rows: &mut Vec<String>,
) {
    for index in 0..4 {
        assert_eq!(
            ours(index),
            theirs(index),
            "matched output: {name}, input {index}"
        );
    }
    sample(&ours, 256);
    sample(&theirs, 256);
    let iterations = 16384;
    let mut own_samples = Vec::new();
    let mut reference_samples = Vec::new();
    for round in 0..9 {
        let (one, two) = if round % 2 == 0 {
            (sample(&ours, iterations), sample(&theirs, iterations))
        } else {
            let two = sample(&theirs, iterations);
            (sample(&ours, iterations), two)
        };
        assert_eq!(one.1, two.1, "timed checksum: {name}");
        own_samples.push(one.0);
        reference_samples.push(two.0);
    }
    let median = |values: &[f64]| {
        let mut sorted = values.to_vec();
        sorted.sort_by(f64::total_cmp);
        sorted[sorted.len() / 2]
    };
    let one = median(&own_samples);
    let two = median(&reference_samples);
    let outputs = (0..4)
        .map(|index| format!("\"{}\"", ours(index)))
        .collect::<Vec<_>>()
        .join(",");
    rows.push(format!("{{\"name\":\"{name}\",\"iterations\":{iterations},\"outputs\":[{outputs}],\"formatjsNanoseconds\":{one},\"temporalRsNanoseconds\":{two},\"temporalRsOverFormatjs\":{},\"formatjsSamples\":{own_samples:?},\"temporalRsSamples\":{reference_samples:?}}}", two / one));
}

fn main() {
    let instants = INSTANTS.map(|text| text.parse::<own::Instant>().unwrap());
    let rs_instants = INSTANTS.map(|text| text.parse::<reference::Instant>().unwrap());
    let durations = DURATIONS.map(|text| text.parse::<own::Duration>().unwrap());
    let rs_durations = DURATIONS.map(|text| text.parse::<reference::Duration>().unwrap());
    let dates = DATES.map(|text| text.parse::<own::PlainDate>().unwrap());
    let rs_dates = DATES.map(|text| text.parse::<reference::PlainDate>().unwrap());
    let times = TIMES.map(|text| text.parse::<own::PlainTime>().unwrap());
    let rs_times = TIMES.map(|text| text.parse::<reference::PlainTime>().unwrap());
    let own_days = "P1Y2M3D".parse::<own::Duration>().unwrap();
    let rs_days = "P1Y2M3D".parse::<reference::Duration>().unwrap();
    let own_hours = "PT25H2M3.000000004S".parse::<own::Duration>().unwrap();
    let rs_hours = "PT25H2M3.000000004S"
        .parse::<reference::Duration>()
        .unwrap();
    let own_month = "P1M".parse::<own::Duration>().unwrap();
    let rs_month = "P1M".parse::<reference::Duration>().unwrap();
    for i in 0..4 {
        assert_eq!(
            instants[i].epoch_nanoseconds(),
            rs_instants[i].epoch_nanoseconds().as_i128()
        );
        assert_eq!(
            durations[i].to_string(),
            rs_durations[i]
                .as_temporal_string(ToStringRoundingOptions::default())
                .unwrap()
        );
        assert_eq!(
            times[i].to_string(),
            rs_times[i]
                .to_ixdtf_string(ToStringRoundingOptions::default())
                .unwrap()
        );
        assert_eq!(dates[i].to_string(), rs_dates[i].to_string());
    }
    let mut rows = Vec::new();
    record(
        "instant.parse",
        |i| {
            INSTANTS[i]
                .parse::<own::Instant>()
                .unwrap()
                .epoch_nanoseconds() as u64
        },
        |i| {
            INSTANTS[i]
                .parse::<reference::Instant>()
                .unwrap()
                .epoch_nanoseconds()
                .as_i128() as u64
        },
        &mut rows,
    );
    record(
        "instant.format",
        |i| hash(&instants[i].to_string()),
        |i| {
            hash(
                &rs_instants[i]
                    .to_ixdtf_string_with_provider(
                        None,
                        ToStringRoundingOptions::default(),
                        &utc_provider::UtcProvider,
                    )
                    .unwrap(),
            )
        },
        &mut rows,
    );
    record(
        "instant.roundMicrosecond",
        |i| {
            instants[i]
                .round(own::TimeUnit::Microsecond, 1, own::RoundingMode::HalfExpand)
                .unwrap()
                .epoch_nanoseconds() as u64
        },
        |i| {
            rs_instants[i]
                .round(round_options())
                .unwrap()
                .epoch_nanoseconds()
                .as_i128() as u64
        },
        &mut rows,
    );
    record(
        "instant.addTime",
        |i| {
            instants[i]
                .checked_add(own_hours)
                .unwrap()
                .epoch_nanoseconds() as u64
        },
        |i| {
            rs_instants[i]
                .add(&rs_hours)
                .unwrap()
                .epoch_nanoseconds()
                .as_i128() as u64
        },
        &mut rows,
    );
    record(
        "duration.parseFormat",
        |i| hash(&DURATIONS[i].parse::<own::Duration>().unwrap().to_string()),
        |i| {
            hash(
                &DURATIONS[i]
                    .parse::<reference::Duration>()
                    .unwrap()
                    .as_temporal_string(ToStringRoundingOptions::default())
                    .unwrap(),
            )
        },
        &mut rows,
    );
    record(
        "duration.format",
        |i| hash(&durations[i].to_string()),
        |i| {
            hash(
                &rs_durations[i]
                    .as_temporal_string(ToStringRoundingOptions::default())
                    .unwrap(),
            )
        },
        &mut rows,
    );
    record(
        "date.parse",
        |i| {
            let d = DATES[i].parse::<own::PlainDate>().unwrap().fields();
            fields(d.0, d.1, d.2)
        },
        |i| {
            let d = DATES[i].parse::<reference::PlainDate>().unwrap();
            fields(d.year(), d.month(), d.day())
        },
        &mut rows,
    );
    record(
        "date.format",
        |i| hash(&dates[i].to_string()),
        |i| hash(&rs_dates[i].to_string()),
        &mut rows,
    );
    record(
        "date.add",
        |i| {
            let d = dates[i]
                .checked_add(own_days, own::Overflow::Constrain)
                .unwrap()
                .fields();
            fields(d.0, d.1, d.2)
        },
        |i| {
            let d = rs_dates[i].add(&rs_days, None).unwrap();
            fields(d.year(), d.month(), d.day())
        },
        &mut rows,
    );
    record(
        "time.parseFormat",
        |i| hash(&TIMES[i].parse::<own::PlainTime>().unwrap().to_string()),
        |i| {
            hash(
                &TIMES[i]
                    .parse::<reference::PlainTime>()
                    .unwrap()
                    .to_ixdtf_string(ToStringRoundingOptions::default())
                    .unwrap(),
            )
        },
        &mut rows,
    );
    record(
        "time.roundMicrosecond",
        |i| {
            hash(
                &times[i]
                    .round(own::TimeUnit::Microsecond, 1, own::RoundingMode::HalfExpand)
                    .unwrap()
                    .to_string(),
            )
        },
        |i| {
            hash(
                &rs_times[i]
                    .round(round_options())
                    .unwrap()
                    .to_ixdtf_string(ToStringRoundingOptions::default())
                    .unwrap(),
            )
        },
        &mut rows,
    );
    let datetimes = [
        "2020-02-29T01:02:03.123456789",
        "2000-01-31T23:59:59.999999999",
        "1900-12-31T12:30:45.987654321",
        "2400-06-15T00:00:00",
    ];
    record(
        "dateTime.parseFormat",
        |i| {
            hash(
                &datetimes[i]
                    .parse::<own::PlainDateTime>()
                    .unwrap()
                    .to_string(),
            )
        },
        |i| {
            hash(
                &datetimes[i]
                    .parse::<reference::PlainDateTime>()
                    .unwrap()
                    .to_string(),
            )
        },
        &mut rows,
    );
    let months = ["2020-02", "2000-01", "1900-12", "2400-06"];
    record(
        "yearMonth.parseFormat",
        |i| {
            hash(
                &months[i]
                    .parse::<own::PlainYearMonth>()
                    .unwrap()
                    .to_string(),
            )
        },
        |i| {
            hash(
                &months[i]
                    .parse::<reference::PlainYearMonth>()
                    .unwrap()
                    .to_string(),
            )
        },
        &mut rows,
    );
    let days = ["02-29", "01-31", "12-31", "06-15"];
    record(
        "monthDay.parseFormat",
        |i| hash(&days[i].parse::<own::PlainMonthDay>().unwrap().to_string()),
        |i| {
            hash(
                &days[i]
                    .parse::<reference::PlainMonthDay>()
                    .unwrap()
                    .to_string(),
            )
        },
        &mut rows,
    );
    let zoned = [
        "2020-03-08T06:59:59.123456789+00:00[UTC]",
        "1969-12-31T23:59:59.999999999+00:00[UTC]",
        "2000-02-29T12:34:56.987654321+05:45[+05:45]",
        "2400-11-05T01:02:03.000000001-04:00[-04:00]",
    ];
    record(
        "zoned.parseUtcOrOffset",
        |i| {
            own::ZonedDateTime::parse(
                zoned[i],
                own::TimeZoneRegistry::empty(),
                own::ZonedParseOptions::default(),
            )
            .unwrap()
            .instant()
            .epoch_nanoseconds() as u64
        },
        |i| {
            reference::ZonedDateTime::from_utf8_with_provider(
                zoned[i].as_bytes(),
                reference::options::Disambiguation::Compatible,
                reference::options::OffsetDisambiguation::Reject,
                &utc_provider::UtcProvider,
            )
            .unwrap()
            .epoch_nanoseconds()
            .as_i128() as u64
        },
        &mut rows,
    );
    let registry = own::CalendarRegistry::compiled().unwrap();
    for name in ["hebrew", "persian", "chinese", "dangi", "islamic-umalqura"] {
        let calendar = registry.resolve(name).unwrap();
        let other = name.parse::<reference::Calendar>().unwrap();
        let own_dates = ["2000-02-05", "2020-03-08", "2023-07-01", "2024-02-10"].map(|text| {
            text.parse::<own::PlainDate>()
                .unwrap()
                .with_calendar(calendar)
                .unwrap()
        });
        let other_dates = ["2000-02-05", "2020-03-08", "2023-07-01", "2024-02-10"].map(|text| {
            text.parse::<reference::PlainDate>()
                .unwrap()
                .with_calendar(other.clone())
        });
        record(
            &format!("calendar.{name}.fields"),
            |i| {
                let d = own_dates[i].calendar_fields().unwrap();
                fields(d.year, d.month, d.day)
            },
            |i| {
                fields(
                    other_dates[i].year(),
                    other_dates[i].month(),
                    other_dates[i].day(),
                )
            },
            &mut rows,
        );
        record(
            &format!("calendar.{name}.addMonth"),
            |i| {
                let d = own_dates[i]
                    .checked_add(own_month, own::Overflow::Constrain)
                    .unwrap()
                    .calendar_fields()
                    .unwrap();
                fields(d.year, d.month, d.day)
            },
            |i| {
                let d = other_dates[i].add(&rs_month, None).unwrap();
                fields(d.year(), d.month(), d.day())
            },
            &mut rows,
        );
    }
    println!(
        "{{\"temporalRsVersion\":\"0.2.6\",\"rust\":\"1.97.0\",\"architecture\":\"{}\",\"method\":\"Optimized native Rust APIs; four inputs, matched checksums before timing, 256 warmup, nine alternating samples. Parsed inputs and calendar registries initialized outside timing. Strings allocated and FNV-1a 32-bit hashed by both implementations. Calendar fields read as one aggregate in FormatJS, three public getters in temporal_rs. Harness checksum and black_box included. UTC/fixed-offset parsing only; no named-zone data, JS, FFI, JSON, cold startup or full-polyfill conformance comparison.\",\"results\":[{}]}}",
        std::env::consts::ARCH,
        rows.join(",")
    );
}
