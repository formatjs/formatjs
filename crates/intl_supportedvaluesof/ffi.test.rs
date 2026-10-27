use std::ffi::c_void;
use std::{ptr, slice};

use formatjs_intl_supportedvaluesof::Key;
use formatjs_intl_supportedvaluesof::ffi::{
    BorrowedString, ProbeResult, ValuesResult, formatjs_supported_values_of, formatjs_values_free,
};

unsafe extern "C" fn only_acre(
    context: *mut c_void,
    key: u32,
    value: BorrowedString,
    _: BorrowedString,
    out: *mut ProbeResult,
) -> i32 {
    unsafe { *(context as *mut usize) += 1 };
    if key == Key::Unit as u32 && unsafe { slice::from_raw_parts(value.data, value.len) } == b"acre"
    {
        unsafe { (*out).resolved = value };
        0
    } else {
        1
    }
}

unsafe extern "C" fn bad_observation(
    _: *mut c_void,
    _: u32,
    _: BorrowedString,
    _: BorrowedString,
    out: *mut ProbeResult,
) -> i32 {
    unsafe {
        (*out).resolved = BorrowedString {
            data: ptr::null(),
            len: 1,
        }
    };
    0
}

fn empty() -> ValuesResult {
    ValuesResult {
        data: ptr::null_mut(),
        len: 0,
    }
}

#[test]
fn ffi_copies_callback_observations_and_owns_independent_outputs() {
    let mut count = 0usize;
    let context = (&mut count as *mut usize).cast();
    let mut first = empty();
    let mut second = empty();
    unsafe {
        for output in [&mut first, &mut second] {
            assert_eq!(
                formatjs_supported_values_of(b"unit".as_ptr(), 4, Some(only_acre), context, output),
                0
            );
            assert_eq!(slice::from_raw_parts(output.data, output.len), b"acre");
        }
        assert_ne!(first.data, second.data);
        assert!(count > 2);
        formatjs_values_free(first);
        formatjs_values_free(second);
        formatjs_values_free(empty());
    }
}

#[test]
fn ffi_reports_invalid_keys_without_calling_the_backend() {
    let mut count = 0usize;
    let context = (&mut count as *mut usize).cast();
    let mut result = empty();
    unsafe {
        assert_eq!(
            formatjs_supported_values_of(
                b"invalid".as_ptr(),
                7,
                Some(only_acre),
                context,
                &mut result
            ),
            1
        );
    }
    assert_eq!(count, 0);
    assert!(result.data.is_null());
}

#[test]
fn ffi_rejects_invalid_pointers_utf8_and_callback_output() {
    let mut result = empty();
    unsafe {
        assert_eq!(
            formatjs_supported_values_of(
                ptr::null(),
                0,
                Some(only_acre),
                ptr::null_mut(),
                &mut result
            ),
            2
        );
        assert_eq!(
            formatjs_supported_values_of(b"unit".as_ptr(), 4, None, ptr::null_mut(), &mut result),
            2
        );
        assert_eq!(
            formatjs_supported_values_of(
                b"unit".as_ptr(),
                4,
                Some(only_acre),
                ptr::null_mut(),
                ptr::null_mut()
            ),
            2
        );
        assert_eq!(
            formatjs_supported_values_of(
                [0xff].as_ptr(),
                1,
                Some(only_acre),
                ptr::null_mut(),
                &mut result
            ),
            2
        );
        assert_eq!(
            formatjs_supported_values_of(
                b"unit".as_ptr(),
                4,
                Some(bad_observation),
                ptr::null_mut(),
                &mut result
            ),
            2
        );
    }
    assert!(result.data.is_null());
    assert_eq!(result.len, 0);
}
