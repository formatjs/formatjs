use std::fmt;

use formatjs_icu_messageformat::{DateTimeValue, Values};

use crate::{Intl, MessageDescriptor, Result};

/// Text produced by checked formatting.
///
/// This records the formatting path, not translation coverage, successful interpolation,
/// HTML escaping, or permission to display sensitive content. Normal catalog and
/// default-message fallback still apply. Unlike the low-level rich-text
/// `formatjs_icu_messageformat::FormattedMessage<T>`, its contents are private.
///
/// Raw strings cannot implicitly enter a typed presentation interface:
///
/// ```compile_fail
/// let _: formatjs_intl::FormattedMessage = String::from("request failed").into();
/// ```
///
/// ```compile_fail
/// let _: formatjs_intl::FormattedMessage = "request failed".into();
/// ```
///
/// There is no unchecked string constructor:
///
/// ```compile_fail
/// let error = std::io::Error::other("request failed");
/// let _ = formatjs_intl::FormattedMessage::verbatim(error.to_string());
/// ```
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FormattedMessage(String);

impl FormattedMessage {
    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn into_string(self) -> String {
        self.0
    }
}

impl fmt::Display for FormattedMessage {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl AsRef<str> for FormattedMessage {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

/// Application-owned content that may be interpolated without translation.
///
/// Implement this on domain types whose constructors control the text's origin,
/// such as a selected file or a product identity. Implementations are the application's
/// trust decision: do not implement this on generic text wrappers or diagnostic errors.
/// There are deliberately no implementations for strings, paths, or `Display` values.
/// Downstream crates cannot implement this foreign trait for standard-library types.
pub trait VerbatimSource {
    fn as_verbatim(&self) -> &str;
}

/// An interpolation-only borrow of application-approved content.
///
/// Raw diagnostic strings cannot be disguised as a one-placeholder message:
///
/// ```compile_fail
/// # fn render(intl: &formatjs_intl::Intl) {
/// use formatjs_intl::{Verbatim, formatted_message};
/// let error = std::io::Error::other("request failed");
/// formatted_message!(intl, default_message: "{detail}",
///     values: { detail: Verbatim::new(&error.to_string()) });
/// # }
/// ```
///
/// ```compile_fail
/// let _ = formatjs_intl::Verbatim::new("request failed");
/// ```
///
/// Even an approved source cannot directly become a formatted message:
///
/// ```compile_fail
/// use formatjs_intl::{FormattedMessage, Verbatim, VerbatimSource};
/// struct Product;
/// impl VerbatimSource for Product {
///     fn as_verbatim(&self) -> &str { "Example" }
/// }
/// let _: FormattedMessage = Verbatim::new(&Product).into();
/// ```
#[derive(Clone, Copy)]
pub struct Verbatim<'a>(&'a dyn VerbatimSource);

impl<'a> Verbatim<'a> {
    pub fn new(source: &'a dyn VerbatimSource) -> Self {
        Self(source)
    }
}

impl private::Sealed for Verbatim<'_> {}

impl MessageArgument for Verbatim<'_> {
    fn insert_into(self, values: &mut MessageValues, name: String) {
        values.0.insert(name, self.0.as_verbatim().into());
    }
}

/// Checked replacements: formatted messages, domain-owned verbatim arguments, numbers, booleans, and dates.
///
/// ```compile_fail
/// let mut values = formatjs_intl::MessageValues::new();
/// values.insert("detail", String::from("request failed"));
/// ```
///
/// ```compile_fail
/// let mut values = formatjs_intl::MessageValues::new();
/// values.insert("detail", "request failed");
/// ```
#[derive(Default)]
pub struct MessageValues(Values<String>);

impl MessageValues {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, name: impl Into<String>, value: impl MessageArgument) {
        value.insert_into(self, name.into());
    }
}

mod private {
    pub trait Sealed {}
}

/// An interpolation value accepted by checked formatting.
/// Sealed so unchecked string or rich-text values cannot implement this trait.
pub trait MessageArgument: private::Sealed {
    #[doc(hidden)]
    fn insert_into(self, values: &mut MessageValues, name: String);
}

impl private::Sealed for FormattedMessage {}

impl MessageArgument for FormattedMessage {
    fn insert_into(self, values: &mut MessageValues, name: String) {
        values.0.insert(name, self.0.into());
    }
}

macro_rules! arguments {
    ($($ty:ty),+ $(,)?) => {
        $(
            impl private::Sealed for $ty {}

            impl MessageArgument for $ty {
                fn insert_into(self, values: &mut MessageValues, name: String) {
                    values.0.insert(name, self.into());
                }
            }
        )+
    };
}

arguments!(i64, u64, f64, bool, DateTimeValue);

macro_rules! numeric_arguments {
    ($target:ty; $($source:ty),+ $(,)?) => {
        $(
            impl private::Sealed for $source {}

            impl MessageArgument for $source {
                fn insert_into(self, values: &mut MessageValues, name: String) {
                    (self as $target).insert_into(values, name);
                }
            }
        )+
    };
}

numeric_arguments!(i64; i8, i16, i32, isize);
numeric_arguments!(u64; u8, u16, u32, usize);
numeric_arguments!(f64; f32);

impl<T: MessageArgument + Clone> private::Sealed for &T {}

impl<T: MessageArgument + Clone> MessageArgument for &T {
    fn insert_into(self, values: &mut MessageValues, name: String) {
        T::clone(self).insert_into(values, name);
    }
}

impl Intl {
    /// Formats a static descriptor with checked replacements, preserving normal fallback.
    /// Descriptor text is application-authored; use [`crate::message_descriptor!`]
    /// to make it extractable. Only infrastructure errors escape the fallback chain.
    pub fn format_message_typed(
        &self,
        descriptor: MessageDescriptor,
        values: &MessageValues,
    ) -> Result<FormattedMessage> {
        self.format_message_to_string(descriptor, &values.0)
            .map(FormattedMessage)
    }

    /// Checked formatting that returns the descriptor default on infrastructure errors.
    pub fn format_message_typed_or_default(
        &self,
        descriptor: MessageDescriptor,
        values: &MessageValues,
    ) -> FormattedMessage {
        FormattedMessage(self.format_message_to_string_or_default(descriptor, &values.0))
    }
}

/// Formats extractable text with checked replacements and returns [`FormattedMessage`].
/// Uses the same IDs, locale negotiation, fallback, and error reporting as
/// [`crate::format_message!`]. Inline replacement names are checked at compile time.
///
/// ```
/// # use formatjs_intl::{Intl, FormattedMessage, Verbatim, VerbatimSource, formatted_message};
/// struct SelectedFile { name: String }
/// impl VerbatimSource for SelectedFile {
///     fn as_verbatim(&self) -> &str { &self.name }
/// }
/// # fn render(intl: &Intl, file: &SelectedFile) -> FormattedMessage {
/// formatted_message!(
///     intl,
///     default_message: "Open {path}?",
///     values: { path: Verbatim::new(file) },
/// )
/// # }
/// ```
///
/// Raw strings and unchecked maps cannot bypass the replacement check:
///
/// ```compile_fail
/// # fn render(intl: &formatjs_intl::Intl) {
/// formatjs_intl::formatted_message!(intl, default_message: "Failed: {detail}",
///     values: { detail: "request failed" });
/// # }
/// ```
///
/// ```compile_fail
/// # fn render(intl: &formatjs_intl::Intl) {
/// let values = formatjs_icu_messageformat::Values::<String>::new();
/// formatjs_intl::formatted_message!(intl, default_message: "Failed: {detail}",
///     values: &values);
/// # }
/// ```
///
/// ```compile_fail
/// # fn render(intl: &formatjs_intl::Intl) {
/// formatjs_intl::formatted_message!(intl, default_message: "Hello, {name}!");
/// # }
/// ```
///
/// ```compile_fail
/// # fn render(intl: &formatjs_intl::Intl) {
/// formatjs_intl::formatted_message!(intl, default_message: "{count} items",
///     values: { wrong_name: 2 });
/// # }
/// ```
#[macro_export]
macro_rules! formatted_message {
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(, id_encoding: $id_encoding:literal)?
        , values: { $($name:ident : $value:expr),+ $(,)? }
        $(,)?
    ) => {{
        const _: () = $crate::__validate_message_values!(
            $default_message; $($name),+
        );
        let mut values = $crate::MessageValues::new();
        $(values.insert(::core::stringify!($name), $crate::__check_message_value!($crate; $default_message; $name; $value));)+
        $crate::formatted_message!(
            $intl,
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            $(, id_encoding: $id_encoding)?
            , values: &values
        )
    }};
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(, id_encoding: $id_encoding:literal)?
        , values: $values:expr
        $(,)?
    ) => {{
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            $(, id_encoding: $id_encoding)?
        );
        $intl.format_message_typed_or_default(descriptor, $values)
    }};
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(, id_encoding: $id_encoding:literal)?
        $(,)?
    ) => {{
        const _: () = $crate::__validate_message_values!($default_message;);
        $crate::formatted_message!(
            $intl,
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            $(, id_encoding: $id_encoding)?
            , values: &$crate::MessageValues::new()
        )
    }};
}
