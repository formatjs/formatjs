use std::fmt;

use formatjs_icu_messageformat::{DateTimeValue, Values};

use crate::{Intl, MessageDescriptor, Result};

/// Text produced by checked formatting or explicitly accepted as verbatim content.
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
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FormattedMessage(String);

impl FormattedMessage {
    /// Explicitly accepts content that should not be translated, such as a name or path.
    /// Applications decide which sources are appropriate; this performs no sanitization.
    pub fn verbatim(text: impl Into<String>) -> Self {
        Self(text.into())
    }

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

/// Checked replacements: formatted/verbatim messages, numbers, booleans, and dates.
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
/// # use formatjs_intl::{Intl, FormattedMessage, formatted_message};
/// # fn render(intl: &Intl, path: &str) -> FormattedMessage {
/// formatted_message!(
///     intl,
///     default_message: "Open {path}?",
///     values: { path: FormattedMessage::verbatim(path) },
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
        , values: { $($name:ident : $value:expr),+ $(,)? }
        $(,)?
    ) => {{
        const _: () = $crate::__validate_message_values!(
            $default_message; $($name),+
        );
        let mut values = $crate::MessageValues::new();
        $(values.insert(::core::stringify!($name), $value);)+
        $crate::formatted_message!(
            $intl,
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            , values: &values
        )
    }};
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        , values: $values:expr
        $(,)?
    ) => {{
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
        );
        $intl.format_message_typed_or_default(descriptor, $values)
    }};
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(,)?
    ) => {{
        const _: () = $crate::__validate_message_values!($default_message;);
        $crate::formatted_message!(
            $intl,
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            , values: &$crate::MessageValues::new()
        )
    }};
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use std::sync::{Arc, Mutex};

    use super::*;
    use crate::{IntlCache, MessageCatalog, MessageSource, message_descriptor};

    const SUMMARY: MessageDescriptor = message_descriptor!(
        id: "summary",
        default_message: "{count, plural, one {# item} other {# items}}: {nested} ({path})"
    );
    const TRANSLATED_SUMMARY: &str =
        "{count, plural, one {# élément} other {# éléments}} : {nested} ({path})";

    fn intl() -> Intl {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", HashMap::new()).unwrap();
        catalog
            .insert(
                "fr",
                HashMap::from([
                    (SUMMARY.id.into(), TRANSLATED_SUMMARY.into()),
                    ("done".into(), "Terminé".into()),
                ]),
            )
            .unwrap();
        Intl::try_new(
            ["fr-CA"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap()
    }

    #[test]
    fn typed_messages_preserve_locale_pluralization_and_nested_content() {
        let intl = intl();
        let nested = formatted_message!(&intl, id: "done", default_message: "Done");
        let path = FormattedMessage::verbatim("/tmp/{report}.txt");
        for (count, expected) in [
            (0, "0 élément : Terminé (/tmp/{report}.txt)"),
            (2, "2 éléments : Terminé (/tmp/{report}.txt)"),
        ] {
            let inline = formatted_message!(
                &intl, id: "summary",
                default_message: "{count, plural, one {# item} other {# items}}: {nested} ({path})",
                values: { count: count, nested: &nested, path: &path },
            );
            let mut values = MessageValues::new();
            values.insert("count", count);
            values.insert("nested", &nested);
            values.insert("path", &path);
            let mapped = formatted_message!(
                &intl, id: "summary",
                default_message: "{count, plural, one {# item} other {# items}}: {nested} ({path})",
                values: &values,
            );
            assert_eq!(inline.as_str(), expected);
            assert_eq!(mapped, inline);
            assert_eq!(intl.format_message_typed(SUMMARY, &values).unwrap(), inline);
            assert_eq!(inline.into_string(), expected);
        }
    }

    #[test]
    fn fallback_retains_typed_output_and_reports_missing_translation() {
        let failures = Arc::new(Mutex::new(Vec::new()));
        let captured = failures.clone();
        let intl = intl().with_on_error(move |error| {
            captured
                .lock()
                .unwrap()
                .push((error.descriptor.id.clone(), error.source));
        });
        let message = formatted_message!(
            &intl, id: "missing", default_message: "{count, plural, one {# item} other {# items}}",
            values: { count: 0 },
        );
        // The English fallback uses English plural rules, even for a French request.
        assert_eq!(message.as_str(), "0 items");
        assert_eq!(
            *failures.lock().unwrap(),
            [("missing".into(), MessageSource::Translation)]
        );
    }

    #[test]
    fn infrastructure_errors_remain_fallible_or_return_the_descriptor_default() {
        let intl = intl();
        let cache = intl.cache.clone();
        let _ = std::panic::catch_unwind(move || {
            let _messages = cache.messages.write().unwrap();
            panic!("poison cache");
        });
        let values = MessageValues::new();
        assert!(matches!(
            intl.format_message_typed(SUMMARY, &values),
            Err(crate::Error::CachePoisoned)
        ));
        assert_eq!(
            intl.format_message_typed_or_default(SUMMARY, &values)
                .as_str(),
            SUMMARY.default_message,
        );
    }
}
