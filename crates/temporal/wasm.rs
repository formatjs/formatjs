#![no_std]

use core::fmt::{self, Write};
use formatjs_temporal::{Duration, Instant, RoundingMode, TimeUnit, round_duration_nanoseconds};

const CAPACITY: usize = 256;
static mut INPUT: [u8; CAPACITY] = [0; CAPACITY];
static mut OUTPUT: [u8; CAPACITY] = [0; CAPACITY];

#[panic_handler]
fn panic(_: &core::panic::PanicInfo<'_>) -> ! {
    core::arch::wasm32::unreachable()
}

#[unsafe(no_mangle)]
pub extern "C" fn input_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(INPUT).cast()
}

#[unsafe(no_mangle)]
pub extern "C" fn output_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(OUTPUT).cast()
}

struct Output(usize);
impl Write for Output {
    fn write_str(&mut self, value: &str) -> fmt::Result {
        if value.len() > CAPACITY - self.0 {
            return Err(fmt::Error);
        }
        // Single-threaded WASM; output never aliases the input buffer.
        unsafe {
            core::ptr::copy_nonoverlapping(value.as_ptr(), output_ptr().add(self.0), value.len());
        }
        self.0 += value.len();
        Ok(())
    }
}

fn input(length: u32) -> Option<&'static str> {
    if length as usize > CAPACITY {
        return None;
    }
    // No threads, imports or callbacks can mutate INPUT during an export call.
    let bytes = unsafe { core::slice::from_raw_parts(input_ptr(), length as usize) };
    core::str::from_utf8(bytes).ok()
}

/// Synchronous benchmark ABI: 0=parse, 1=parse+round, 2=parse+format,
/// 3=duration parse+format. Returns output length, or -1 on invalid input.
#[unsafe(no_mangle)]
pub extern "C" fn run(operation: u32, length: u32) -> i32 {
    let Some(value) = input(length) else {
        return -1;
    };
    let mut output = Output(0);
    let result = match operation {
        0..=2 => value.parse::<Instant>().ok().and_then(|instant| {
            match operation {
                0 => write!(output, "{}", instant.epoch_nanoseconds()),
                1 => instant
                    .round(TimeUnit::Microsecond, 1, RoundingMode::HalfExpand)
                    .map_err(|_| fmt::Error)
                    .and_then(|rounded| write!(output, "{}", rounded.epoch_nanoseconds())),
                _ => write!(output, "{instant}"),
            }
            .ok()
        }),
        3 => value
            .parse::<Duration>()
            .ok()
            .and_then(|duration| write!(output, "{duration}").ok()),
        _ => None,
    };
    if result.is_some() {
        output.0 as i32
    } else {
        -1
    }
}

/// Time-only total; unit indices run from nanosecond to day. Invalid input gives NaN.
#[unsafe(no_mangle)]
pub extern "C" fn duration_total(length: u32, unit: u32) -> f64 {
    input(length)
        .and_then(|value| value.parse::<Duration>().ok())
        .and_then(|duration| match unit {
            6 => duration.total_days().ok(),
            _ => time_unit(unit).and_then(|unit| duration.total(unit).ok()),
        })
        .unwrap_or(f64::NAN)
}

fn time_unit(unit: u32) -> Option<TimeUnit> {
    [
        TimeUnit::Nanosecond,
        TimeUnit::Microsecond,
        TimeUnit::Millisecond,
        TimeUnit::Second,
        TimeUnit::Minute,
        TimeUnit::Hour,
    ]
    .get(unit as usize)
    .copied()
}

#[unsafe(no_mangle)]
pub extern "C" fn round_duration(length: u32, unit: u32, mode: u32) -> i32 {
    let modes = [
        RoundingMode::Ceil,
        RoundingMode::Floor,
        RoundingMode::Expand,
        RoundingMode::Trunc,
        RoundingMode::HalfCeil,
        RoundingMode::HalfFloor,
        RoundingMode::HalfExpand,
        RoundingMode::HalfTrunc,
        RoundingMode::HalfEven,
    ];
    let quantum = if unit == 6 {
        Some(86_400_000_000_000)
    } else {
        time_unit(unit).map(TimeUnit::nanoseconds)
    };
    let rounded = input(length)
        .and_then(|value| value.parse::<i128>().ok())
        .zip(quantum)
        .zip(modes.get(mode as usize))
        .and_then(|((value, quantum), mode)| {
            round_duration_nanoseconds(value, quantum, *mode).ok()
        });
    let mut output = Output(0);
    match rounded {
        Some(value) if write!(output, "{value}").is_ok() => output.0 as i32,
        _ => -1,
    }
}
