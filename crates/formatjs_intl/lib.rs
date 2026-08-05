use formatjs_icu_messageformat::{FormattedMessage, IcuMessageFormat, Part, Values};
use icu_locale::{Locale, fallback::LocaleFallbacker};
use std::collections::HashMap;
use std::error::Error as StdError;
use std::fmt;
use std::sync::{Arc, RwLock};

pub type Messages = HashMap<String, String>;

#[derive(Debug)]
pub enum Error {
    InvalidLocale(String),
    MissingDefaultLocale(String),
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
}

#[macro_export]
macro_rules! message {
    (
        id: $id:literal,
        default_message: $default_message:literal
        $(, description: $description:literal)?
        $(,)?
    ) => {{
        let descriptor = $crate::MessageDescriptor::new($id, $default_message);
        $(let descriptor = descriptor.with_description($description);)?
        descriptor
    }};
}

#[derive(Debug, Clone, Default)]
pub struct MessageCatalog {
    bundles: HashMap<String, Arc<Messages>>,
}

impl MessageCatalog {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&mut self, locale: impl AsRef<str>, messages: Messages) -> Result<()> {
        let locale = parse_locale(locale.as_ref())?;
        self.bundles.insert(locale.to_string(), Arc::new(messages));
        Ok(())
    }

    pub fn contains_locale(&self, locale: impl fmt::Display) -> bool {
        self.bundles.contains_key(&locale.to_string())
    }

    pub fn messages(&self, locale: impl fmt::Display) -> Option<Arc<Messages>> {
        self.bundles.get(&locale.to_string()).cloned()
    }

    pub fn available_locales(&self) -> impl Iterator<Item = &str> {
        self.bundles.keys().map(String::as_str)
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
    messages: Arc<Messages>,
    default_messages: Arc<Messages>,
    cache: Arc<IntlCache>,
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
            .messages(&default_locale)
            .ok_or_else(|| Error::MissingDefaultLocale(default_locale.to_string()))?;
        let locale = negotiate_locale(requested_locales, &default_locale, &catalog)?;
        let messages = catalog
            .messages(&locale)
            .unwrap_or_else(|| default_messages.clone());
        let locale_string = locale.to_string();

        Ok(Self {
            locale,
            locale_string,
            messages,
            default_messages,
            cache,
        })
    }

    pub fn locale(&self) -> &Locale {
        &self.locale
    }

    pub fn format_message<T: Clone>(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<T>,
    ) -> Result<FormattedMessage<T>> {
        let source = self.message_source(descriptor);
        Ok(self
            .cache
            .get_or_compile(source)?
            .format(&self.locale_string, values)?)
    }

    pub fn format_message_to_parts<T: Clone>(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<T>,
    ) -> Result<Vec<Part<T>>> {
        let source = self.message_source(descriptor);
        Ok(self
            .cache
            .get_or_compile(source)?
            .format_to_parts(&self.locale_string, values)?)
    }

    pub fn format_message_to_string(
        &self,
        descriptor: MessageDescriptor,
        values: &Values<String>,
    ) -> Result<String> {
        let source = self.message_source(descriptor);
        Ok(self
            .cache
            .get_or_compile(source)?
            .format_to_string(&self.locale_string, values)?)
    }

    fn message_source(&self, descriptor: MessageDescriptor) -> &str {
        self.messages
            .get(descriptor.id)
            .or_else(|| self.default_messages.get(descriptor.id))
            .map(String::as_str)
            .unwrap_or(descriptor.default_message)
    }
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

    const TASKS: MessageDescriptor = message!(
        id: "tasks.count",
        default_message: "{count, plural, one {# task} other {# tasks}}",
        description: "Task count"
    );

    fn catalog() -> Arc<MessageCatalog> {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", Messages::new()).unwrap();
        catalog
            .insert(
                "fr",
                HashMap::from([(
                    "tasks.count".to_owned(),
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
    fn falls_back_to_descriptor_default_message() {
        let intl = Intl::try_new(["en-US"], "en", catalog(), Arc::new(IntlCache::new())).unwrap();
        let values: Values = HashMap::from([("count".to_owned(), Value::from(1_i64))]);

        assert_eq!(
            intl.format_message_to_string(TASKS, &values).unwrap(),
            "1 task"
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
