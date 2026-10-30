use formatjs_intl_getcanonicallocales::canonicalize_locale;
use formatjs_intl_locale::{
    Locale, LocaleOptions,
    ffi::{formatjs_locale_create, formatjs_locale_destroy},
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
    let options = LocaleOptions::default();
    let long = format!("en-x{}", "-abcdefgh".repeat(20));
    for tag in [
        "en",
        "en-x-bench-191",
        long.as_str(),
        "iw-Latn-BU-u-ca-gregory-x-AbCd",
    ] {
        let expected = canonicalize_locale(tag).unwrap();
        assert_eq!(Locale::new(tag, &options).unwrap().as_str(), expected);
        println!("tag: {tag}");
        measure("canonicalize", || {
            canonicalize_locale(black_box(tag)).unwrap()
        });
        measure("locale", || Locale::new(black_box(tag), &options).unwrap());
        measure("locale ABI", || {
            let tag = black_box(tag);
            let mut handle = std::ptr::null_mut();
            assert_eq!(
                unsafe {
                    formatjs_locale_create(tag.as_ptr(), tag.len(), b"{}".as_ptr(), 2, &mut handle)
                },
                0
            );
            let handle = black_box(handle);
            assert!(!handle.is_null());
            unsafe { formatjs_locale_destroy(handle) };
        });
    }
}
