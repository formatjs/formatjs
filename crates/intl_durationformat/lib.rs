//! Duration records, options and native number/list rendering. Hosts own coercions.
mod options;
mod record;
mod render;
mod unit;
pub use options::{
    Configuration, Display, Options, PreparedUnit, Style, UnitInput, UnitOptions, UnitResolver,
    UnitStyle,
};
pub use record::Duration;
pub use render::{Part, RenderError, Renderer};
pub use unit::Unit;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    EmptyDuration,
    InvalidDuration,
    InvalidOption,
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for Error {}
