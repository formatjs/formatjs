use formatjs_intl_numberformat::{Options as NumberOptions, registry::Registry as NumberRegistry};
use formatjs_intl_relativetimeformat::{Options, registry::Registry};
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
    let relative = registry
        .create(&["en".into()], &Options::default())
        .unwrap();
    let registry = NumberRegistry::with_compiled_data();
    let number = registry
        .create(
            &["en".into()],
            &NumberOptions {
                numbering_system: Some("latn".into()),
                ..Default::default()
            },
        )
        .unwrap();
    for (value, expected, sentence) in [
        ("-3", "3", "3 days ago"),
        ("-1234.5", "1,234.5", "1,234.5 days ago"),
        ("-0", "0", "0 days ago"),
        ("1.9996", "2", "in 2 days"),
        (
            "1e+21",
            "1,000,000,000,000,000,000,000",
            "in 1,000,000,000,000,000,000,000 days",
        ),
    ] {
        let numeric = value.parse::<f64>().unwrap();
        let magnitude = value.strip_prefix('-').unwrap_or(value);
        assert_eq!(number.format(magnitude).unwrap(), expected);
        assert_eq!(relative.format(value, "day").unwrap(), sentence);
        assert_eq!(relative.format_number(numeric, "day").unwrap(), sentence);
        println!("value: {value}");
        measure("NumberFormat.format", || {
            number.format(black_box(magnitude)).unwrap()
        });
        measure("NumberFormat.parts", || {
            number.format_to_parts(black_box(magnitude)).unwrap()
        });
        measure("RelativeTimeFormat.format", || {
            relative.format(black_box(value), "day").unwrap()
        });
        measure("RelativeTimeFormat.parts", || {
            relative.format_to_parts(black_box(value), "day").unwrap()
        });
        measure("RelativeTimeFormat.number", || {
            relative.format_number(black_box(numeric), "day").unwrap()
        });
        measure("RelativeTimeFormat.number parts", || {
            relative
                .format_to_parts_number(black_box(numeric), "day")
                .unwrap()
        });
    }
}
