//! Benchmark-only numeric control using the production calendar implementation.
use formatjs_temporal::{CalendarProvider, CalendarRegistry};

static mut OUTPUT: [i32; 4] = [0; 4];

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> *const i32 {
    core::ptr::addr_of!(OUTPUT).cast()
}

#[unsafe(no_mangle)]
pub extern "C" fn calendar_from_epoch_day(epoch: i32) -> i32 {
    let calendar = CalendarRegistry::arithmetic().resolve("iso8601").unwrap();
    let Ok(date) = calendar.date_extended(i64::from(epoch)) else {
        return 1;
    };
    // Synchronous benchmark calls; no references escape to JS.
    unsafe {
        core::ptr::addr_of_mut!(OUTPUT).write([
            date.year,
            i32::from(date.month),
            i32::from(date.day),
            i32::from(date.month_code.number),
        ]);
    }
    0
}
