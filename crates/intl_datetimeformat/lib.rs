//! DateTimeFormat core. Gregorian arithmetic does not depend on host Date/ICU.
pub mod civil;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Error {
    InvalidDate,
}
impl std::fmt::Display for Error {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidDate => formatter.write_str("Invalid DateTimeFormat date"),
        }
    }
}
impl std::error::Error for Error {}
