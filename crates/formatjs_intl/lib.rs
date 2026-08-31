use formatjs_icu_messageformat::{
    FormattedMessage, IcuMessageFormat, MessageFormatElement, Part, Values,
};
use icu_locale::{Locale, fallback::LocaleFallbacker};
use std::collections::HashMap;
use std::error::Error as StdError;
use std::fmt;
use std::sync::{Arc, RwLock};

#[doc(hidden)]
pub use formatjs_icu_messageformat::{Value as __Value, Values as __Values};
#[doc(hidden)]
pub use formatjs_intl_macros::{__message_descriptor, __validate_message_values};

pub type Messages = HashMap<String, String>;
pub type PrecompiledMessages = HashMap<String, Vec<MessageFormatElement>>;

type CompiledMessages = HashMap<String, Arc<IcuMessageFormat>>;

#[derive(Clone)]
enum CatalogBundle {
    Source(Arc<Messages>),
    Precompiled(Arc<CompiledMessages>),
}

impl CatalogBundle {
    fn get(&self, id: &str) -> Option<CatalogMessage<'_>> {
        match self {
            Self::Source(messages) => messages.get(id).map(|message| CatalogMessage::Source(message)),
            Self::Precompiled(messages) => messages
                .get(id)
                .map(|message| CatalogMessage::Precompiled(message)),
        }
    }
}

#[derive(Debug)]
pub enum Error {
    InvalidLocale(String),
    MissingDefaultLocale(String),
    MissingTranslation { id: String, locale: String },
    CachePoisoned,
    Message(formatjs_icu_messageformat::Error),
}

impl fmt::Display for Error {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidLocale(locale) => write!(formatter, "Invalid locale: {locale}"),
            Self::MissingDefaultLocale(locale) => {
                write!(
                    formatter,
                    "Default locale has no translation catalog: {locale}"
                )
            }
            Self::MissingTranslation { id, locale } => {
                write!(formatter, "Missing message \"{id}\" for locale \"{locale}\"")
            }
            Self::CachePoisoned => formatter.write_str("Intl cache lock is poisoned"),
            Self::Message(error) => error.fmt(formatter),
        }
    }
}

impl StdError for Error {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        match self {
            Self::Message(error) => Some(error),
            _ => None,
        }
    }
}

impl From<formatjs_icu_messageformat::Error> for Error {
    fn from(error: formatjs_icu_messageformat::Error) -> Self {
        Self::Message(error)
    }
}

pub type Result<T> = std::result::Result<T, Error>;

/// Identifies the message source that failed during automatic fallback.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MessageSource {
    /// Message from the negotiated locale catalog.
    Translation,
    /// Message from the default locale catalog.
    DefaultCatalog,
    /// `default_message` from the message descriptor.
    DefaultMessage,
}

/// A recoverable message error reported while formatting falls back.
#[derive(Debug)]
pub struct FormatMessageError {
    /// Descriptor passed to the formatting call.
    pub descriptor: OwnedMessageDescriptor,
    /// Locale used for the failed formatting attempt.
    pub locale: String,
    /// Source of the message that failed.
    pub source: MessageSource,
    /// Formatting or infrastructure error.
    pub error: Error,
}

impl fmt::Display for FormatMessageError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            formatter,
            "Error formatting {:?} for message \"{}\" in locale \"{}\": {}",
            self.source, self.descriptor.id, self.locale, self.error
        )
    }
}

impl StdError for FormatMessageError {
    fn source(&self) -> Option<&(dyn StdError + 'static)> {
        Some(&self.error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MessageDescriptor {
    pub id: &'static str,
    pub default_message: &'static str,
    pub description: Option<&'static str>,
}

impl MessageDescriptor {
    pub const fn new(id: &'static str, default_message: &'static str) -> Self {
        Self {
            id,
            default_message,
            description: None,
        }
    }

    pub const fn with_description(mut self, description: &'static str) -> Self {
        self.description = Some(description);
        self
    }

    pub const fn as_ref(self) -> MessageDescriptorRef<'static> {
        MessageDescriptorRef {
            id: self.id,
            default_message: self.default_message,
            description: self.description,
        }
    }
}

/// Borrowed message descriptor for runtime-defined messages.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MessageDescriptorRef<'a> {
    pub id: &'a str,
    pub default_message: &'a str,
    pub description: Option<&'a str>,
}

impl<'a> MessageDescriptorRef<'a> {
    pub const fn new(id: &'a str, default_message: &'a str) -> Self {
        Self {
            id,
            default_message,
            description: None,
        }
    }

    pub const fn with_description(mut self, description: &'a str) -> Self {
        self.description = Some(description);
        self
    }
}

/// Owned descriptor snapshot attached to recovered formatting errors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OwnedMessageDescriptor {
    pub id: String,
    pub default_message: String,
    pub description: Option<String>,
}

impl From<MessageDescriptorRef<'_>> for OwnedMessageDescriptor {
    fn from(descriptor: MessageDescriptorRef<'_>) -> Self {
        Self {
            id: descriptor.id.to_owned(),
            default_message: descriptor.default_message.to_owned(),
            description: descriptor.description.map(str::to_owned),
        }
    }
}

#[macro_export]
macro_rules! message_descriptor {
    ($($tokens:tt)*) => {{
        const DATA: (&str, &str, ::core::option::Option<&str>) =
            $crate::__message_descriptor!($($tokens)*);
        $crate::MessageDescriptor {
            id: DATA.0,
            default_message: DATA.1,
            description: DATA.2,
        }
    }};
}

/// Formats an extractable message and returns its default message if infrastructure fails.
#[macro_export]
macro_rules! format_message {
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
        let values = $crate::__Values::from([
            $(
                (
                    ::std::string::String::from(::core::stringify!($name)),
                    $crate::__Value::from($value),
                ),
            )+
        ]);
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
        );
        $intl.format_message_to_string_or_default(descriptor, &values)
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
        $intl.format_message_to_string_or_default(descriptor, $values)
    }};
    (
        $intl:expr,
        $(id: $id:literal,)?
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(,)?
    ) => {{
        const _: () = $crate::__validate_message_values!($default_message;);
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
        );
        $intl.format_message_to_string_or_default(descriptor, &$crate::__Values::new())
    }};
}

#[derive(Clone, Default)]
pub struct MessageCatalog {
    bundles: HashMap<String, CatalogBundle>,
}

impl fmt::Debug for MessageCatalog {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter
            .debug_struct("MessageCatalog")
            .field("available_locales", &self.bundles.keys())
            .finish()
    }
}

impl MessageCatalog {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, locale: impl AsRef<str>, messages: Messages) -> Result<()> {
        let locale = parse_locale(locale.as_ref())?;
        self.bundles
            .insert(locale.to_string(), CatalogBundle::Source(Arc::new(messages)));
        Ok(())
    }

    /// Inserts AST messages emitted by `formatjs compile --ast`.
    pub fn insert_precompiled(
        &mut self,
        locale: impl AsRef<str>,
        messages: PrecompiledMessages,
    ) -> Result<()> {
        let locale = parse_locale(locale.as_ref())?;
        let messages = messages
            .into_iter()
            .map(|(id, ast)| (id, Arc::new(IcuMessageFormat::from_ast(ast))))
            .collect();
        self.bundles.insert(
            locale.to_string(),
            CatalogBundle::Precompiled(Arc::new(messages)),
        );
        Ok(())
    }

    pub fn contains_locale(&self, locale: impl fmt::Display) -> bool {
        self.bundles.contains_key(&locale.to_string())
    }

    /// Returns source messages for a locale. Precompiled catalogs have no source map.
    pub fn messages(&self, locale: impl fmt::Display) -> Option<Arc<Messages>> {
        match self.bundles.get(&locale.to_string()) {
            Some(CatalogBundle::Source(messages)) => Some(messages.clone()),
            _ => None,
        }
    }

    pub fn available_locales(&self) -> impl Iterator<Item = &str> {
        self.bundles.keys().map(String::as_str)
    }

    fn bundle(&self, locale: impl fmt::Display) -> Option<CatalogBundle> {
        self.bundles.get(&locale.to_string()).cloned()
    }
}

#[derive(Default)]
pub struct IntlCache {
    messages: RwLock<HashMap<String, Arc<IcuMessageFormat>>>,
}

impl IntlCache {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn len(&self) -> Result<usize> {
        self.messages
            .read()
            .map(|messages| messages.len())
            .map_err(|_| Error::CachePoisoned)
    }

    pub fn is_empty(&self) -> Result<bool> {
        self.len().map(|len| len == 0)
    }

    fn get_or_compile(&self, source: &str) -> Result<Arc<IcuMessageFormat>> {
        if let Some(message) = self
            .messages
            .read()
            .map_err(|_| Error::CachePoisoned)?
            .get(source)
            .cloned()
        {
            return Ok(message);
        }

        let message = Arc::new(IcuMessageFormat::try_new(source)?);
        let mut messages = self.messages.write().map_err(|_| Error::CachePoisoned)?;
        Ok(messages.entry(source.to_owned()).or_insert(message).clone())
    }
}

pub struct Intl {
    locale: Locale,
    locale_string: String,
    default_locale_string: String,
    messages: CatalogBundle,
    default_messages: CatalogBundle,
    cache: Arc<IntlCache>,
    on_error: Option<Arc<dyn Fn(&FormatMessageError) + Send + Sync>>,
}

impl Intl {
    pub fn try_new<I, S>(
        requested_locales: I,
        default_locale: impl AsRef<str>,
        catalog: Arc<MessageCatalog>,
        cache: Arc<IntlCache>,
    ) -> Result<Self>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let default_locale = parse_locale(default_locale.as_ref())?;
        let default_messages = catalog
            .bundle(&default_locale)
            .ok_or_else(|| Error::MissingDefaultLocale(default_locale.to_string()))?;
        let locale = negotiate_locale(requested_locales, &default_locale, &catalog)?;
        let messages = catalog
            .bundle(&locale)
            .unwrap_or_else(|| default_messages.clone());
        let locale_string = locale.to_string();
        let default_locale_string = default_locale.to_string();

        Ok(Self {
            locale,
            locale_string,
            default_locale_string,
            messages,
            default_messages,
            cache,
            on_error: None,
        })
    }

    /// Registers a handler for message errors recovered through automatic fallback.
    pub fn with_on_error(
        mut self,
        on_error: impl Fn(&FormatMessageError) + Send + Sync + 'static,
    ) -> Self {
        self.on_error = Some(Arc::new(on_error));
        self
    }

    pub fn locale(&self) -> &Locale {
        &self.locale
    }

    pub fn format_message<T: Clone>(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<T>,
    ) -> Result<FormattedMessage<T>> {
        self.format_message_ref(descriptor.as_ref(), values)
    }

    pub fn format_message_ref<T: Clone>(
        &self,
        descriptor: MessageDescriptorRef<'_>,
        values: &Values<T>,
    ) -> Result<FormattedMessage<T>> {
        self.format_with_fallback(
            descriptor,
            |message, locale| message.format(locale, values),
            FormattedMessage::Literal,
        )
    }

    pub fn format_message_to_parts<T: Clone>(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<T>,
    ) -> Result<Vec<Part<T>>> {
        self.format_message_to_parts_ref(descriptor.as_ref(), values)
    }

    pub fn format_message_to_parts_ref<T: Clone>(
        &self,
        descriptor: MessageDescriptorRef<'_>,
        values: &Values<T>,
    ) -> Result<Vec<Part<T>>> {
        self.format_with_fallback(
            descriptor,
            |message, locale| message.format_to_parts(locale, values),
            |source| vec![Part::Literal(source)],
        )
    }

    pub fn format_message_to_string(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<String>,
    ) -> Result<String> {
        self.format_message_to_string_ref(descriptor.as_ref(), values)
    }

    pub fn format_message_to_string_ref(
        &self,
        descriptor: MessageDescriptorRef<'_>,
        values: &Values<String>,
    ) -> Result<String> {
        self.format_with_fallback(
            descriptor,
            |message, locale| message.format_to_string(locale, values),
            |source| source,
        )
    }

    /// Formats a string, returning `default_message` if infrastructure prevents formatting.
    pub fn format_message_to_string_or_default(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<String>,
    ) -> String {
        self.format_message_to_string(descriptor, values)
            .unwrap_or_else(|_| descriptor.default_message.to_owned())
    }

    /// Formats a runtime-defined string descriptor, returning its default on infrastructure errors.
    pub fn format_message_to_string_or_default_ref(
        &self,
        descriptor: MessageDescriptorRef<'_>,
        values: &Values<String>,
    ) -> String {
        self.format_message_to_string_ref(descriptor, values)
            .unwrap_or_else(|_| descriptor.default_message.to_owned())
    }

    fn format_with_fallback<'a, T>(
        &'a self,
        descriptor: MessageDescriptorRef<'a>,
        format: impl Fn(&IcuMessageFormat, &str) -> formatjs_icu_messageformat::Result<T>,
        verbatim: impl Fn(String) -> T,
    ) -> Result<T> {
        self.report_missing_translation(descriptor);
        let candidates = self.message_candidates(descriptor);
        let verbatim_source = candidates
            .iter()
            .find_map(|candidate| match candidate.message {
                CatalogMessage::Source(message) if !message.is_empty() => Some(message),
                _ => None,
            })
            .unwrap_or(descriptor.id)
            .to_owned();

        for candidate in candidates {
            let result = match candidate.message {
                CatalogMessage::Source(source) => self
                    .cache
                    .get_or_compile(source)
                    .and_then(|message| format(&message, candidate.locale).map_err(Error::from)),
                CatalogMessage::Precompiled(message) => {
                    format(message, candidate.locale).map_err(Error::from)
                }
            };
            match result {
                Ok(message) => return Ok(message),
                Err(error) => {
                    let is_message_error = matches!(error, Error::Message(_));
                    let error = FormatMessageError {
                        descriptor: descriptor.into(),
                        locale: candidate.locale.to_owned(),
                        source: candidate.source,
                        error,
                    };
                    self.report_error(&error);
                    if !is_message_error {
                        return Err(error.error);
                    }
                }
            }
        }

        Ok(verbatim(verbatim_source))
    }

    fn message_candidates<'a>(
        &'a self,
        descriptor: MessageDescriptorRef<'a>,
    ) -> Vec<MessageCandidate<'a>> {
        let mut candidates = Vec::with_capacity(3);

        if let Some(message) = self.messages.get(descriptor.id) {
            push_candidate(
                &mut candidates,
                message,
                &self.locale_string,
                MessageSource::Translation,
            );
        }
        if self.locale_string != self.default_locale_string {
            if let Some(message) = self.default_messages.get(descriptor.id) {
                push_candidate(
                    &mut candidates,
                    message,
                    &self.default_locale_string,
                    MessageSource::DefaultCatalog,
                );
            }
        }
        push_candidate(
            &mut candidates,
            CatalogMessage::Source(descriptor.default_message),
            &self.default_locale_string,
            MessageSource::DefaultMessage,
        );

        candidates
    }

    fn report_missing_translation(&self, descriptor: MessageDescriptorRef<'_>) {
        if self.on_error.is_none() {
            return;
        }
        let missing = matches!(
            self.messages.get(descriptor.id),
            None | Some(CatalogMessage::Source(""))
        );
        if missing
            && (self.locale_string != self.default_locale_string
                || descriptor.default_message.is_empty())
        {
            self.report_error(&FormatMessageError {
                descriptor: descriptor.into(),
                locale: self.locale_string.clone(),
                source: MessageSource::Translation,
                error: Error::MissingTranslation {
                    id: descriptor.id.to_owned(),
                    locale: self.locale_string.clone(),
                },
            });
        }
    }

    fn report_error(&self, error: &FormatMessageError) {
        if let Some(on_error) = &self.on_error {
            on_error(error);
        }
    }
}

struct MessageCandidate<'a> {
    message: CatalogMessage<'a>,
    locale: &'a str,
    source: MessageSource,
}

#[derive(Clone, Copy)]
enum CatalogMessage<'a> {
    Source(&'a str),
    Precompiled(&'a IcuMessageFormat),
}

fn push_candidate<'a>(
    candidates: &mut Vec<MessageCandidate<'a>>,
    message: CatalogMessage<'a>,
    locale: &'a str,
    source: MessageSource,
) {
    if matches!(message, CatalogMessage::Source("")) {
        return;
    }
    let duplicate = candidates.iter().any(|candidate| {
        if candidate.locale != locale {
            return false;
        }
        match (candidate.message, message) {
            (CatalogMessage::Source(left), CatalogMessage::Source(right)) => left == right,
            (CatalogMessage::Precompiled(left), CatalogMessage::Precompiled(right)) => {
                std::ptr::eq(left, right)
            }
            _ => false,
        }
    });
    if duplicate {
        return;
    }
    candidates.push(MessageCandidate {
        message,
        locale,
        source,
    });
}

pub fn negotiate_locale<I, S>(
    requested_locales: I,
    default_locale: &Locale,
    catalog: &MessageCatalog,
) -> Result<Locale>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    let fallbacker = LocaleFallbacker::new();
    for requested in requested_locales {
        let requested = parse_locale(requested.as_ref())?;
        let mut fallback = fallbacker
            .for_config(Default::default())
            .fallback_for(requested.into());

        loop {
            let candidate = fallback.get();
            if catalog.contains_locale(candidate) {
                return parse_locale(&candidate.to_string());
            }
            if candidate.is_unknown() {
                break;
            }
            fallback.step();
        }
    }

    Ok(default_locale.clone())
}

fn parse_locale(locale: &str) -> Result<Locale> {
    locale
        .parse()
        .map_err(|_| Error::InvalidLocale(locale.to_owned()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use formatjs_icu_messageformat::Value;
    use std::sync::Mutex;

    const TASKS: MessageDescriptor = message_descriptor!(
        default_message: "{count, plural, one {# task} other {# tasks}}",
        description: "Task count"
    );

    const EXPLICIT_ID: MessageDescriptor = message_descriptor!(
        id: "tasks.explicit",
        default_message: "Explicit task"
    );

    const GREETING: MessageDescriptor = message_descriptor!(
        default_message: "Hello, {name}!",
        description: "Greeting"
    );

    const FALLBACK: MessageDescriptor = MessageDescriptor::new(
        "fallback",
        "{count, plural, one {default one} other {default other}}",
    );

    const INVALID_DEFAULT: MessageDescriptor =
        MessageDescriptor::new("invalid.default", "{broken");

    const EMPTY_DEFAULT: MessageDescriptor = MessageDescriptor::new("empty.default", "");

    #[test]
    fn message_descriptor_generates_or_preserves_id() {
        assert_eq!(TASKS.id.len(), 10);
        assert_eq!(TASKS.id, "LURAmALj1U");
        assert_eq!(GREETING.id, "EG1xJTTqQy");
        assert_eq!(EXPLICIT_ID.id, "tasks.explicit");
    }

    #[test]
    fn format_message_macro_formats_with_optional_values() {
        let intl = Intl::try_new(["fr"], "en", catalog(), Arc::new(IntlCache::new())).unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(2_i64))]);

        assert_eq!(
            format_message!(
                &intl,
                default_message: "{count, plural, one {# task} other {# tasks}}",
                description: "Task count",
                values: { count: 2_i64 },
            ),
            "2 tâches"
        );
        assert_eq!(
            format_message!(
                &intl,
                default_message: "{count, plural, one {# task} other {# tasks}}",
                description: "Task count",
                values: &values,
            ),
            "2 tâches"
        );
        assert_eq!(
            format_message!(
                &intl,
                id: "approval.title",
                default_message: "Approve to continue",
            ),
            "Approve to continue"
        );
    }

    #[test]
    fn format_message_macro_reports_cache_failure_and_returns_default() {
        let cache = Arc::new(IntlCache::new());
        let poisoned_cache = cache.clone();
        let _ = std::panic::catch_unwind(move || {
            let _messages = poisoned_cache.messages.write().unwrap();
            panic!("poison cache");
        });
        let errors = Arc::new(Mutex::new(Vec::new()));
        let captured_errors = errors.clone();
        let intl = Intl::try_new(["en"], "en", catalog(), cache)
            .unwrap()
            .with_on_error(move |error| {
                captured_errors.lock().unwrap().push((
                    error.descriptor.id.to_owned(),
                    error.source,
                    matches!(error.error, Error::CachePoisoned),
                ));
            });

        assert_eq!(
            format_message!(
                &intl,
                default_message: "Approve to continue",
                description: "Approval card title",
            ),
            "Approve to continue"
        );
        assert_eq!(
            *errors.lock().unwrap(),
            vec![("n5ixSZR8gf".to_owned(), MessageSource::DefaultMessage, true)]
        );
    }

    fn catalog() -> Arc<MessageCatalog> {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", Messages::new()).unwrap();
        catalog
            .insert(
                "fr",
                HashMap::from([(
                    TASKS.id.to_owned(),
                    "{count, plural, one {# tâche} other {# tâches}}".to_owned(),
                )]),
            )
            .unwrap();
        catalog.insert("zh-Hant", Messages::new()).unwrap();
        Arc::new(catalog)
    }

    #[test]
    fn negotiates_with_icu4x_fallback() {
        let catalog = catalog();
        let default_locale: Locale = "en".parse().unwrap();
        assert_eq!(
            negotiate_locale(["fr-CA"], &default_locale, &catalog)
                .unwrap()
                .to_string(),
            "fr"
        );
        assert_eq!(
            negotiate_locale(["zh-Hant-TW"], &default_locale, &catalog)
                .unwrap()
                .to_string(),
            "zh-Hant"
        );
        assert_eq!(
            negotiate_locale(["de"], &default_locale, &catalog)
                .unwrap()
                .to_string(),
            "en"
        );
    }

    #[test]
    fn loads_translation_and_reuses_compiled_message() {
        let cache = Arc::new(IntlCache::new());
        let intl = Intl::try_new(["fr-CA"], "en", catalog(), cache.clone()).unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(2_i64))]);

        assert_eq!(
            intl.format_message_to_string(TASKS, &values).unwrap(),
            "2 tâches"
        );
        assert_eq!(
            intl.format_message_to_string(TASKS, &values).unwrap(),
            "2 tâches"
        );
        assert_eq!(intl.locale().to_string(), "fr");
        assert_eq!(cache.len().unwrap(), 1);
    }

    #[test]
    fn loads_formatjs_cli_precompiled_ast_without_using_cache() {
        let messages: PrecompiledMessages = serde_json::from_str(
            r##"{
                "tasks.precompiled": [{
                    "type": 6,
                    "value": "count",
                    "options": {
                        "one": {"value": [{"type": 0, "value": "# tâche"}]},
                        "other": {"value": [{"type": 7}, {"type": 0, "value": " tâches"}]}
                    },
                    "offset": 0,
                    "pluralType": "cardinal"
                }]
            }"##,
        )
        .unwrap();
        let mut catalog = MessageCatalog::new();
        catalog.insert_precompiled("fr", messages).unwrap();
        let cache = Arc::new(IntlCache::new());
        let intl = Intl::try_new(["fr"], "fr", Arc::new(catalog), cache.clone()).unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(2_i64))]);
        let descriptor = MessageDescriptor::new(
            "tasks.precompiled",
            "{count, plural, one {# task} other {# tasks}}",
        );

        assert_eq!(
            intl.format_message_to_string(descriptor, &values).unwrap(),
            "2 tâches"
        );
        assert!(cache.is_empty().unwrap());
    }

    #[test]
    fn falls_back_to_descriptor_default_message() {
        let intl = Intl::try_new(["en-US"], "en", catalog(), Arc::new(IntlCache::new())).unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(1_i64))]);

        assert_eq!(
            intl.format_message_to_string(TASKS, &values).unwrap(),
            "1 task"
        );
    }

    #[test]
    fn reports_missing_translation_before_fallback() {
        let errors = Arc::new(Mutex::new(Vec::new()));
        let captured_errors = errors.clone();
        let intl = Intl::try_new(["fr"], "en", catalog(), Arc::new(IntlCache::new()))
            .unwrap()
            .with_on_error(move |error| {
                captured_errors.lock().unwrap().push((
                    error.descriptor.id.to_owned(),
                    error.locale.clone(),
                    matches!(error.error, Error::MissingTranslation { .. }),
                ));
            });

        let descriptor = MessageDescriptor::new("missing", "Fallback");
        assert_eq!(
            intl.format_message_to_string(descriptor, &Values::new())
                .unwrap(),
            "Fallback"
        );
        assert_eq!(
            *errors.lock().unwrap(),
            vec![("missing".to_owned(), "fr".to_owned(), true)]
        );
    }

    #[test]
    fn falls_back_after_translation_format_error() {
        let mut catalog = MessageCatalog::new();
        catalog
            .insert(
                "fr",
                HashMap::from([("fallback".to_owned(), "{broken".to_owned())]),
            )
            .unwrap();
        catalog
            .insert(
                "en",
                HashMap::from([(
                    "fallback".to_owned(),
                    "{count, plural, one {catalog one} other {catalog other}}".to_owned(),
                )]),
            )
            .unwrap();
        let errors = Arc::new(Mutex::new(Vec::new()));
        let captured_errors = errors.clone();
        let intl = Intl::try_new(
            ["fr"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap()
        .with_on_error(move |error| {
            captured_errors
                .lock()
                .unwrap()
                .push((error.source, error.locale.clone()));
        });
        let values: Values = HashMap::from([("count".to_owned(), Value::from(2_i64))]);

        assert_eq!(
            intl.format_message_to_string(FALLBACK, &values).unwrap(),
            "catalog other"
        );
        assert_eq!(
            *errors.lock().unwrap(),
            vec![(MessageSource::Translation, "fr".to_owned())]
        );
    }

    #[test]
    fn formats_fallback_with_default_locale() {
        let mut catalog = MessageCatalog::new();
        catalog.insert("fr", Messages::new()).unwrap();
        catalog.insert("en", Messages::new()).unwrap();
        let intl = Intl::try_new(
            ["fr"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(0_i64))]);

        assert_eq!(
            intl.format_message_to_string(FALLBACK, &values).unwrap(),
            "default other"
        );
    }

    #[test]
    fn falls_back_from_default_catalog_to_descriptor() {
        let mut catalog = MessageCatalog::new();
        catalog.insert("fr", Messages::new()).unwrap();
        catalog
            .insert(
                "en",
                HashMap::from([("fallback".to_owned(), "{broken".to_owned())]),
            )
            .unwrap();
        let intl = Intl::try_new(
            ["fr"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(1_i64))]);

        assert_eq!(
            intl.format_message_to_string(FALLBACK, &values).unwrap(),
            "default one"
        );
    }

    #[test]
    fn renders_verbatim_message_after_all_formatting_fails() {
        let mut catalog = MessageCatalog::new();
        catalog
            .insert(
                "fr",
                HashMap::from([("invalid.default".to_owned(), "{translated".to_owned())]),
            )
            .unwrap();
        catalog.insert("en", Messages::new()).unwrap();
        let intl = Intl::try_new(
            ["fr"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap();
        let values = Values::new();

        assert_eq!(
            intl
                .format_message_to_string(INVALID_DEFAULT, &values)
                .unwrap(),
            "{translated"
        );
        assert_eq!(
            intl.format_message(INVALID_DEFAULT, &values).unwrap(),
            FormattedMessage::Literal("{translated".to_owned())
        );
        assert_eq!(
            intl
                .format_message_to_parts(INVALID_DEFAULT, &values)
                .unwrap(),
            vec![Part::Literal("{translated".to_owned())]
        );
    }

    #[test]
    fn falls_back_on_empty_translation() {
        let mut catalog = MessageCatalog::new();
        catalog.insert(
            "fr",
            HashMap::from([("fallback".to_owned(), String::new())]),
        )
        .unwrap();
        catalog.insert("en", Messages::new()).unwrap();
        let intl = Intl::try_new(
            ["fr"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(1_i64))]);

        assert_eq!(
            intl.format_message_to_string(FALLBACK, &values).unwrap(),
            "default one"
        );
    }

    #[test]
    fn falls_back_to_id_without_message_source() {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", Messages::new()).unwrap();
        let intl = Intl::try_new(
            ["en"],
            "en",
            Arc::new(catalog),
            Arc::new(IntlCache::new()),
        )
        .unwrap();

        assert_eq!(
            intl
                .format_message_to_string(EMPTY_DEFAULT, &Values::new())
                .unwrap(),
            "empty.default"
        );
    }

    #[test]
    fn requires_default_catalog() {
        let error = match Intl::try_new(
            ["fr"],
            "en",
            Arc::new(MessageCatalog::new()),
            Arc::new(IntlCache::new()),
        ) {
            Ok(_) => panic!("expected missing default locale error"),
            Err(error) => error,
        };
        assert!(matches!(error, Error::MissingDefaultLocale(locale) if locale == "en"));
    }
}
