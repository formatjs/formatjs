//! Shared numeric calendars and optional DateTimeFormat providers.
#![cfg_attr(not(feature = "provider"), no_std)]
#[path = "core.rs"]
pub mod calendar;
mod date_math;
#[cfg(feature = "provider")]
#[path = "provider.rs"]
mod provider;
pub mod table_calendar;
#[cfg(feature = "provider")]
pub use provider::Provider;
#[cfg(feature = "provider")]
mod arithmetic;
#[cfg(feature = "compiled_data")]
mod compiled;
#[cfg(feature = "provider")]
pub mod ffi;
#[cfg(feature = "provider")]
mod tables;
