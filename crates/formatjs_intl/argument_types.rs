//! Implementation details of the exported formatting macros.
//!
//! ```compile_fail
//! # fn render(intl: &formatjs_intl::Intl) {
//! formatjs_intl::format_message!(intl, default_message: "{n, number}", values: {n: "two"});
//! # }
//! ```
//! ```compile_fail
//! # fn render(intl: &formatjs_intl::Intl) {
//! formatjs_intl::formatted_message!(intl, default_message: "{n, plural, other {#}}", values: {n: true});
//! # }
//! ```
//! ```compile_fail
//! # fn render(intl: &formatjs_intl::Intl) {
//! formatjs_intl::format_message!(intl, default_message: "{d, date} {d, time}", values: {d: "today"});
//! # }
//! ```
//! ```compile_fail
//! # fn render(intl: &formatjs_intl::Intl) {
//! formatjs_intl::format_message!(intl, default_message: "<b>Hello</b>", values: {b: "bold"});
//! # }
//! ```
//! ```compile_fail
//! # fn render(intl: &formatjs_intl::Intl) {
//! // A dynamically typed value cannot bypass a numeric contract.
//! formatjs_intl::format_message!(intl, default_message: "{n, number}",
//!     values: {n: formatjs_icu_messageformat::Value::<String>::String("two".into())});
//! # }
//! ```
use formatjs_icu_messageformat::{DateTimeValue, Part, Result, Value};

mod private {
    pub trait Sealed {}
}
pub trait Number: private::Sealed {}
pub trait DateTime: private::Sealed {}
pub trait Select: private::Sealed {}

macro_rules! numeric {
    ($($t:ty),*) => {$(
        impl private::Sealed for $t {}
        impl Number for $t {}
        impl DateTime for $t {}
        impl Select for $t {}
    )*};
}
numeric!(i8, i16, i32, i64, isize, u8, u16, u32, u64, usize, f32, f64);
impl private::Sealed for DateTimeValue {}
impl DateTime for DateTimeValue {}
impl private::Sealed for str {}
impl Select for str {}
impl private::Sealed for String {}
impl Select for String {}
impl private::Sealed for bool {}
impl Select for bool {}
impl private::Sealed for crate::FormattedMessage {}
impl Select for crate::FormattedMessage {}
impl private::Sealed for crate::Verbatim<'_> {}
impl Select for crate::Verbatim<'_> {}
impl<T: private::Sealed + ?Sized> private::Sealed for &T {}
impl<T: Number + ?Sized> Number for &T {}
impl<T: DateTime + ?Sized> DateTime for &T {}
impl<T: Select + ?Sized> Select for &T {}

pub fn number<T: Number + ?Sized>(_: &T) {}
pub fn datetime<T: DateTime + ?Sized>(_: &T) {}
pub fn select<T: Select + ?Sized>(_: &T) {}

pub fn tag(
    callback: impl Fn(Vec<Part<String>>) -> Result<Vec<Part<String>>> + Send + Sync + 'static,
) -> Value<String> {
    Value::tag(callback)
}
