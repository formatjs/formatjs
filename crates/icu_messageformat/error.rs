use std::error::Error as StdError;
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorCode {
    MissingValue,
    InvalidValue,
    InvalidValueType,
    Parse,
    Formatter,
}

impl ErrorCode {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::MissingValue => "MISSING_VALUE",
            Self::InvalidValue => "INVALID_VALUE",
            Self::InvalidValueType => "INVALID_VALUE",
            Self::Parse => "PARSE_ERROR",
            Self::Formatter => "FORMAT_ERROR",
        }
    }
}

#[derive(Debug)]
pub struct Error {
    pub code: ErrorCode,
    pub message: String,
    pub original_message: Option<String>,
    source: Option<Box<dyn StdError + Send + Sync>>,
}

impl Error {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            original_message: None,
            source: None,
        }
    }

    pub fn with_original_message(mut self, original_message: Option<&str>) -> Self {
        self.original_message = original_message.map(str::to_owned);
        self
    }

    pub fn with_source(
        mut self,
        source: impl StdError + Send + Sync + 'static,
    ) -> Self {
        self.source = Some(Box::new(source));
        self
    }

    pub fn missing_value(variable: &str, original_message: Option<&str>) -> Self {
        Self::new(
            ErrorCode::MissingValue,
            format!(
                "The intl string context variable \"{variable}\" was not provided to the string \"{}\"",
                original_message.unwrap_or("undefined")
            ),
        )
        .with_original_message(original_message)
    }

    pub fn invalid_value(
        variable: &str,
        value: &str,
        options: impl IntoIterator<Item = impl AsRef<str>>,
        original_message: Option<&str>,
    ) -> Self {
        let options = options
            .into_iter()
            .map(|option| option.as_ref().to_owned())
            .collect::<Vec<_>>()
            .join("\", \"");
        Self::new(
            ErrorCode::InvalidValue,
            format!(
                "Invalid value for \"{variable}\": \"{value}\". Options are \"{options}\""
            ),
        )
        .with_original_message(original_message)
    }

    pub fn invalid_value_type(
        variable: &str,
        expected: &str,
        original_message: Option<&str>,
    ) -> Self {
        Self::new(
            ErrorCode::InvalidValueType,
            format!("Value for \"{variable}\" must be of type {expected}"),
        )
        .with_original_message(original_message)
    }
}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "[formatjs Error: {}] {}",
            self.code.as_str(),
            self.message
        )
    }
}

impl StdError for Error {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        self.source
            .as_deref()
            .map(|source| source as &(dyn StdError + 'static))
    }
}

pub type Result<T> = std::result::Result<T, Error>;
