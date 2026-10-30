use formatjs_intl_datetimeformat::civil::CivilDateTime;
use std::io::{self, BufRead};

fn main() {
    for line in io::stdin().lock().lines() {
        let value: i128 = line
            .expect("read input")
            .parse()
            .expect("epoch nanoseconds");
        match CivilDateTime::from_epoch_nanoseconds(value) {
            Ok(date) => println!(
                "[{},{},{},{},{},{},{},{}]",
                date.year,
                date.month,
                date.day,
                date.weekday,
                date.hour,
                date.minute,
                date.second,
                date.nanosecond
            ),
            Err(_) => println!("null"),
        }
    }
}
