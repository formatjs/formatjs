mod utc_provider;
use core::fmt::{self, Write};
use temporal_rs::{
    Duration, Instant,
    options::{RoundingOptions, ToStringRoundingOptions, Unit},
};
use writeable::Writeable;

const CAPACITY: usize = 256;
static mut INPUT: [u8; CAPACITY] = [0; CAPACITY];
static mut OUTPUT: [u8; CAPACITY] = [0; CAPACITY];
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
        // Single-threaded benchmark ABI; input/output buffers never overlap.
        unsafe {
            core::ptr::copy_nonoverlapping(value.as_ptr(), output_ptr().add(self.0), value.len());
        }
        self.0 += value.len();
        Ok(())
    }
}
#[unsafe(no_mangle)]
pub extern "C" fn run(operation: u32, length: u32) -> i32 {
    if length as usize > CAPACITY {
        return -1;
    }
    // No imports or callbacks can mutate input during a call.
    let bytes = unsafe { core::slice::from_raw_parts(input_ptr(), length as usize) };
    let Ok(value) = core::str::from_utf8(bytes) else {
        return -1;
    };
    let mut output = Output(0);
    let result: Option<()> = match operation {
        0..=2 => value.parse::<Instant>().ok().and_then(|instant| {
            match operation {
                0 => write!(output, "{}", instant.epoch_nanoseconds().as_i128()),
                1 => {
                    let mut options = RoundingOptions::default();
                    options.smallest_unit = Some(Unit::Microsecond);
                    options.rounding_mode = Some(temporal_rs::options::RoundingMode::HalfExpand);
                    instant
                        .round(options)
                        .map_err(|_| fmt::Error)
                        .and_then(|rounded| {
                            write!(output, "{}", rounded.epoch_nanoseconds().as_i128())
                        })
                }
                _ => instant
                    .to_ixdtf_writeable_with_provider(
                        None,
                        ToStringRoundingOptions::default(),
                        &utc_provider::UtcProvider,
                    )
                    .map_err(|_| fmt::Error)
                    .and_then(|value| value.write_to(&mut output)),
            }
            .ok()
        }),
        3 => value
            .parse::<Duration>()
            .ok()
            .and_then(|duration| {
                duration
                    .as_temporal_string(ToStringRoundingOptions::default())
                    .ok()
            })
            .and_then(|text| output.write_str(&text).ok()),
        _ => None,
    };
    if result.is_some() {
        output.0 as i32
    } else {
        -1
    }
}
