use crate::Provider;
use formatjs_intl_datetimeformat::ffi::{DateTimeRegistry, input};
use std::panic::{AssertUnwindSafe, catch_unwind};
/// # Safety
/// Registry live on its creating thread; input readable for len bytes.
/// Replaced provider contexts may release after registry borrows end.
#[unsafe(no_mangle)]
// Proposal comparison §15.6.23 step 5.a: Load a calendar projection provider over the Intl ABI.
pub unsafe extern "C" fn formatjs_datetime_calendar_load(
    registry: *const DateTimeRegistry,
    data: *const u8,
    len: usize,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    catch_unwind(AssertUnwindSafe(|| {
        let runtime = unsafe { (&*registry).runtime() };
        let data = unsafe { input(data, len)? };
        let provider = Provider::from_json(data).map_err(|_| 1)?;
        provider.register(&runtime);
        Ok::<_, i32>(())
    }))
    .map(|result| result.err().unwrap_or(0))
    .unwrap_or(3)
}

/// # Safety
/// Registry live on its creating thread.
#[unsafe(no_mangle)]
// Proposal comparison §15.6.23 step 5.a: Load compiled calendar projection providers over the Intl ABI.
pub unsafe extern "C" fn formatjs_datetime_calendar_load_compiled(
    registry: *const DateTimeRegistry,
) -> i32 {
    if registry.is_null() {
        return 2;
    }
    #[cfg(feature = "compiled_data")]
    {
        catch_unwind(AssertUnwindSafe(|| {
            let runtime = unsafe { (&*registry).runtime() };
            crate::compiled::register(&runtime).map_err(|_| 1)?;
            Ok::<_, i32>(())
        }))
        .map(|result| result.err().unwrap_or(0))
        .unwrap_or(3)
    }
    #[cfg(not(feature = "compiled_data"))]
    {
        0
    }
}
