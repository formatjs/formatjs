use icu::calendar::{AnyCalendar, AnyCalendarKind, Date, Ref, types::RataDie};
use std::{env, fmt::Write, fs, path::Path};

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
    let mut output = String::from(
        "// Generated from pinned ICU4X historical calendar data.\n\
         export const ranges: readonly {firstYear: number; startDay: number; years: readonly number[]}[] = [\n",
    );
    // ICU4X's historical data ends where its arithmetic approximation rejoins.
    for (first_year, last_year) in [(1900, 2102)] {
        // A midyear Rata Die anchor avoids the ISO constructor's ±9999-year limit.
        let previous = i64::from(first_year) - 1;
        let anchor = RataDie::new(
            365 * previous + previous.div_euclid(4) - previous.div_euclid(100)
                + previous.div_euclid(400)
                + 182,
        );
        let first = Date::from_rata_die(anchor, Ref(&calendar));
        assert_eq!(first.year().extended_year(), first_year);
        let mut cursor = anchor - i64::from(first.day_of_year().0 - 1);
        let start_day = cursor - RataDie::new(719163);
        let mut years = Vec::new();
        for year in first_year..=last_year {
            let date = Date::from_rata_die(cursor, Ref(&calendar));
            assert_eq!(date.year().extended_year(), year);
            assert_eq!(date.month().ordinal, 1);
            assert_eq!(date.day_of_month().0, 1);
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
            years.push(packed);
        }
        writeln!(
            output,
            "{{firstYear: {first_year}, startDay: {start_day}, years: {years:?}}},"
        )
        .unwrap();
    }
    output.push_str("];\n");
    let out = Path::new(bindir).join(out.expect("--out is required"));
    fs::create_dir_all(out.parent().unwrap()).unwrap();
    fs::write(out, output).unwrap();
}
