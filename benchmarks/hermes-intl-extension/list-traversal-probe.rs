use formatjs_intl_listformat::{Options, ffi::*, registry::Registry};
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
    let formatter = registry.create("en", &Options::default()).unwrap();
    let mut native_registry = std::ptr::null_mut();
    assert_eq!(
        unsafe { formatjs_list_registry_create(&mut native_registry) },
        0
    );
    let mut handle = std::ptr::null_mut();
    assert_eq!(
        unsafe {
            formatjs_list_create(
                native_registry,
                b"en".as_ptr(),
                2,
                b"{}".as_ptr(),
                2,
                &mut handle,
            )
        },
        0
    );
    for size in [0, 1, 3, 4, 5, 8, 9, 32, 256] {
        let input: Vec<Vec<u16>> = (0..size)
            .map(|index| format!("item{index}").encode_utf16().collect())
            .collect();
        let parts = formatter.format_to_parts(&input);
        let joined: Vec<u16> = parts
            .iter()
            .flat_map(|part| part.value.iter().copied())
            .collect();
        assert_eq!(formatter.format(&input), joined);
        assert_eq!(
            parts.iter().filter(|part| part.kind == "element").count(),
            size
        );
        let slices: Vec<ListSlice> = input
            .iter()
            .map(|v| ListSlice {
                data: v.as_ptr(),
                len: v.len(),
            })
            .collect();
        let abi_call = |parts| {
            let mut result = ListUnits {
                data: std::ptr::null_mut(),
                len: 0,
            };
            let call = if parts {
                formatjs_list_parts
            } else {
                formatjs_list_format
            };
            assert_eq!(
                unsafe { call(handle, slices.as_ptr(), slices.len(), &mut result) },
                0
            );
            if !parts {
                let actual = unsafe { std::slice::from_raw_parts(result.data, result.len) };
                assert_eq!(actual, joined);
            }
            unsafe { formatjs_list_units_free(result) };
        };
        println!("size: {size}");
        measure("format", || formatter.format(black_box(&input)));
        measure("parts", || formatter.format_to_parts(black_box(&input)));
        measure("ABI format", || abi_call(false));
        measure("ABI parts", || abi_call(true));
    }
    unsafe {
        formatjs_list_destroy(handle);
        formatjs_list_registry_destroy(native_registry);
    }
}
