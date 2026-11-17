use formatjs_temporal::ffi::{
    TemporalBytes, formatjs_temporal_bytes_free, formatjs_temporal_query,
};

#[unsafe(no_mangle)]
pub extern "C" fn temporal_abi_version() -> u32 {
    13
}

#[unsafe(no_mangle)]
pub extern "C" fn temporal_alloc(length: usize) -> *mut u8 {
    let mut bytes = Vec::new();
    if bytes.try_reserve_exact(length).is_err() {
        return core::ptr::null_mut();
    }
    bytes.resize(length, 0u8);
    Box::into_raw(bytes.into_boxed_slice()).cast()
}

/// # Safety
/// Input and output must be readable/writable allocations in this module's memory.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn temporal_query(
    data: *const u8,
    length: usize,
    output: *mut TemporalBytes,
) -> i32 {
    unsafe { formatjs_temporal_query(data, length, output) }
}

/// # Safety
/// Pointer/length must match a live allocation or successful query response, freed once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn temporal_free(data: *mut u8, length: usize) {
    unsafe { formatjs_temporal_bytes_free(TemporalBytes { data, len: length }) }
}

#[unsafe(no_mangle)]
pub extern "C" fn temporal_input(capacity: usize) -> *mut u8 {
    formatjs_temporal::binary::input(capacity)
}

#[unsafe(no_mangle)]
pub extern "C" fn temporal_exchange(length: usize) -> *const u8 {
    formatjs_temporal::binary::exchange(length)
}
