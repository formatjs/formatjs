use crate::Provider;
use formatjs_intl_datetimeformat::ffi::{DateTimeRegistry, input};
use std::panic::{AssertUnwindSafe, catch_unwind};
/// # Safety
/// Registry live on its creating thread; input readable for len bytes.
/// Replaced provider contexts may release after registry borrows end.
#[unsafe(no_mangle)]
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
