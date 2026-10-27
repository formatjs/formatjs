//! One Rust static archive for the SDK. Each polyfill keeps its own crate;
//! consumers link one copy of Rust's allocator and standard library.

pub use formatjs_intl_getcanonicallocales::{
    formatjs_canonicalize_locale, formatjs_locale_result_free,
};
pub use formatjs_intl_supportedvaluesof::ffi::{
    formatjs_supported_values_of, formatjs_values_free,
};
