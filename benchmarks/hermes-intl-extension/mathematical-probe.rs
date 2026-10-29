use formatjs_intl_pluralrules::{
    instance::Options, mathematical::to_mathematical_value, registry::Registry,
};
use std::hint::black_box;
#[cfg(not(feature = "count_allocations"))]
use std::time::Instant;

#[cfg(feature = "count_allocations")]
mod allocations {
    use std::alloc::{GlobalAlloc, Layout, System};
    use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

    pub static ACTIVE: AtomicBool = AtomicBool::new(false);
    pub static CALLS: AtomicUsize = AtomicUsize::new(0);
    struct Counter;
    fn record() {
        if ACTIVE.load(Ordering::Relaxed) {
            CALLS.fetch_add(1, Ordering::Relaxed);
        }
    }
    // SAFETY: pointer and layout handling stay with System.
    unsafe impl GlobalAlloc for Counter {
        unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
            record();
            unsafe { System.alloc(layout) }
        }
        unsafe fn alloc_zeroed(&self, layout: Layout) -> *mut u8 {
            record();
            unsafe { System.alloc_zeroed(layout) }
        }
        unsafe fn realloc(&self, ptr: *mut u8, layout: Layout, size: usize) -> *mut u8 {
            record();
            unsafe { System.realloc(ptr, layout, size) }
        }
        unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
            unsafe { System.dealloc(ptr, layout) }
        }
    }
    #[global_allocator]
    static ALLOCATOR: Counter = Counter;
}

fn measure<T>(name: &str, mut call: impl FnMut() -> T) {
    black_box(call());
    #[cfg(feature = "count_allocations")]
    {
        use allocations::{ACTIVE, CALLS};
        use std::sync::atomic::Ordering;
        CALLS.store(0, Ordering::Relaxed);
        ACTIVE.store(true, Ordering::Relaxed);
        for _ in 0..10_000 {
            black_box(call());
        }
        ACTIVE.store(false, Ordering::Relaxed);
        println!(
            "{name}: {:.1} allocation calls",
            CALLS.load(Ordering::Relaxed) as f64 / 10_000.0
        );
    }
    #[cfg(not(feature = "count_allocations"))]
    {
        let start = Instant::now();
        for _ in 0..100_000 {
            black_box(call());
        }
        println!(
            "{name}: {:.0} ns/call",
            start.elapsed().as_nanos() as f64 / 100_000.0
        );
    }
}

fn main() {
    let registry = Registry::with_compiled_data();
    let rules = registry.create("en", &Options::default()).unwrap();
    let boundary = "9".repeat(308);
    let overflow = "9".repeat(309);
    for (name, input, expected) in [
        ("integer", "3", "3"),
        ("decimal", "1234.5", "1234.5"),
        ("negative zero", "-0", "-0"),
        ("trailing zeros", "1.2300", "1.23"),
        ("exponent", "1e21", "1000000000000000000000"),
        ("308-byte boundary", boundary.as_str(), boundary.as_str()),
        ("309-byte overflow", overflow.as_str(), "Infinity"),
    ] {
        assert_eq!(to_mathematical_value(input, false), expected);
        assert_eq!(
            rules.select_mathematical(input, false).unwrap(),
            rules.select(expected).unwrap()
        );
        assert_eq!(
            rules
                .select_range_mathematical(input, "4", false, false)
                .unwrap(),
            rules.select_range(expected, "4").unwrap()
        );
        println!("value: {name}");
        measure("mathematical", || {
            to_mathematical_value(black_box(input), false)
        });
        measure("select", || {
            rules.select_mathematical(black_box(input), false).unwrap()
        });
        measure("range", || {
            rules
                .select_range_mathematical(black_box(input), "4", false, false)
                .unwrap()
        });
    }
}
