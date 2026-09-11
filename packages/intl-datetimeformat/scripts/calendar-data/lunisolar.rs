use icu::calendar::{AnyCalendar, AnyCalendarKind, Date, Ref, types::RataDie};
use std::{collections::HashMap, env, fmt::Write, fs, path::Path};

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    assert_eq!(args.len() % 2, 0, "expected flag/value pairs");
    let mut out = None;
    let mut bindir = ".";
    let mut name = None;
    for pair in args.chunks_exact(2) {
        match pair[0].as_str() {
            "--out" => out = Some(pair[1].as_str()),
            "--bazel-bindir" => bindir = &pair[1],
            "--calendar" => name = Some(pair[1].as_str()),
            flag => panic!("unknown flag: {flag}"),
        }
    }
    let name = name.expect("--calendar is required");
    let kind = match name {
        "chinese" => AnyCalendarKind::Chinese,
        "dangi" => AnyCalendarKind::Dangi,
        _ => panic!("unsupported calendar: {name}"),
    };
    let calendar = AnyCalendar::new(kind);
    // Cover Date/Temporal boundaries, including timezone shifts, with whole years.
    let start = RataDie::new(719163 - 100000002);
    let end = RataDie::new(719163 + 100000002);
    let first = Date::from_rata_die(start, Ref(&calendar));
    let first_year = first.year().extended_year();
    let mut cursor = start - i64::from(first.day_of_year().0 - 1);
    let mut checkpoints = Vec::new();
    let mut dictionary = Vec::new();
    let mut indices = HashMap::new();
    let mut encoded = String::new();
    let alphabet = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    let mut year_index = 0;
    while cursor < end {
        let date = Date::from_rata_die(cursor, Ref(&calendar));
        assert_eq!(date.year().extended_year(), first_year + year_index);
        assert_eq!(date.month().ordinal, 1);
        assert_eq!(date.day_of_month().0, 1);
        if year_index % 64 == 0 {
            checkpoints.push(cursor - RataDie::new(719163));
        }
        let months = date.months_in_year();
        let mut packed = 0u32;
        for ordinal in 1..=months {
            let date = Date::from_rata_die(cursor, Ref(&calendar));
            let month = date.month();
            assert_eq!(month.ordinal, ordinal);
            assert_eq!(date.day_of_month().0, 1);
            let days = date.days_in_month();
            assert!((29..=30).contains(&days));
            packed |= u32::from(days - 29) << (ordinal - 1);
            if month.to_input().is_leap() {
                assert_eq!(packed >> 13, 0);
                packed |= u32::from(month.number()) << 13;
            }
            cursor += i64::from(days);
        }
        assert_eq!(months, if packed >> 13 == 0 { 12 } else { 13 });
        let index = *indices.entry(packed).or_insert_with(|| {
            dictionary.push(packed);
            dictionary.len() - 1
        });
        assert!(index < 4096);
        encoded.push(alphabet[index >> 6] as char);
        encoded.push(alphabet[index & 63] as char);
        year_index += 1;
    }
    let end_day = cursor - RataDie::new(719163);
    let mut output = String::from("// Generated from pinned ICU4X calendar data.\n");
    writeln!(output, "export const {name}: {{firstYear: number; endDay: number; checkpoints: number[]; dictionary: number[]; years: string}} = {{firstYear: {first_year}, endDay: {end_day}, checkpoints: {checkpoints:?}, dictionary: {dictionary:?}, years: \"{encoded}\"}};").unwrap();
    let out = Path::new(bindir).join(out.expect("--out is required"));
    fs::create_dir_all(out.parent().unwrap()).unwrap();
    fs::write(out, output).unwrap();
}
