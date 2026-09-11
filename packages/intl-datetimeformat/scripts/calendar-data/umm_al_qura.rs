use icu::calendar::{AnyCalendar, AnyCalendarKind, Date, Ref, types::RataDie};
use std::{env, fmt::Write, fs, path::Path};

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    assert_eq!(args.len() % 2, 0, "expected flag/value pairs");
    let mut out = None;
    let mut bindir = ".";
    for pair in args.chunks_exact(2) {
        match pair[0].as_str() {
            "--out" => out = Some(pair[1].as_str()),
            "--bazel-bindir" => bindir = &pair[1],
            flag => panic!("unknown flag: {flag}"),
        }
    }
    let calendar = AnyCalendar::new(AnyCalendarKind::HijriUmmAlQura);
    // ICU's official Umm al-Qura table covers AH 1300 through 1600.
    // Include complete adjacent years to validate the civil-calendar transitions.
    let start = Date::try_new_iso(1882, 1, 1).unwrap().to_rata_die();
    let end = Date::try_new_iso(2176, 1, 1).unwrap().to_rata_die();
    let first = Date::from_rata_die(start, Ref(&calendar));
    let first_year = first.year().extended_year();
    let mut cursor = start - i64::from(first.day_of_year().0 - 1);
    let mut starts = Vec::new();
    let mut lengths = Vec::new();
    while cursor < end {
        let date = Date::from_rata_die(cursor, Ref(&calendar));
        assert_eq!(
            date.year().extended_year(),
            first_year + lengths.len() as i32
        );
        assert_eq!(date.month().ordinal, 1);
        starts.push(cursor - RataDie::new(719163));
        let mut packed = 0u16;
        for month in 1..=12 {
            let date = Date::from_rata_die(cursor, Ref(&calendar));
            assert_eq!(date.month().ordinal, month);
            assert_eq!(date.day_of_month().0, 1);
            let days = date.days_in_month();
            assert!((29..=30).contains(&days));
            packed |= u16::from(days - 29) << (month - 1);
            cursor += i64::from(days);
        }
        lengths.push(packed);
    }
    starts.push(cursor - RataDie::new(719163));
    let mut output = String::from("// Generated from pinned ICU4X calendar data.\n");
    writeln!(output, "export const ummAlQura: {{firstYear: number; startDays: number[]; monthLengths: number[]}} = {{firstYear: {first_year}, startDays: {starts:?}, monthLengths: {lengths:?}}};").unwrap();
    let out = Path::new(bindir).join(out.expect("--out is required"));
    fs::create_dir_all(out.parent().unwrap()).unwrap();
    fs::write(out, output).unwrap();
}
