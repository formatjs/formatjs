use formatjs_icu_messageformat::{
    FormattedMessage as RichFormattedMessage, IcuMessageFormat, MessageFormatElement, Part, Values,
};
use formatjs_icu_messageformat::{Formatters, Options, ProviderFormatters};
use icu_locale::Locale;
use icu_locale::fallback::LocaleFallbacker;
use icu_provider::buf::{BufferMarker, BufferProvider};
use icu_provider::prelude::{
    DataError, DataMarkerInfo, DataRequest, DataResponse, DynamicDataProvider,
};
use icu_provider_adapters::fallback::LocaleFallbackProvider;
use std::collections::HashMap;
use std::error::Error as StdError;
use std::fmt;
use std::sync::{Arc, RwLock};

#[doc(hidden)]
pub use formatjs_icu_messageformat::{Value as __Value, Values as __Values};
#[doc(hidden)]
pub use formatjs_intl_macros::{
    __check_message_value, __message_descriptor, __validate_message_values,
};

#[doc(hidden)]
#[path = "argument_types.rs"]
pub mod __argument_types;

mod formatted_message;

pub use formatted_message::{
    FormattedMessage, MessageArgument, MessageValues, Verbatim, VerbatimSource,
};

pub type Messages = HashMap<String, String>;
pub type PrecompiledMessages = HashMap<String, Vec<MessageFormatElement>>;

type CompiledMessages = HashMap<String, Arc<IcuMessageFormat>>;

#[derive(Clone)]
enum StoredBundle {
    Source(Arc<Messages>),
    Precompiled(Arc<PrecompiledMessages>),
}

#[derive(Clone)]
enum CatalogBundle {
    Source(Arc<Messages>),
    Precompiled(Arc<CompiledMessages>),
}

impl CatalogBundle {
    fn get(&self, id: &str) -> Option<CatalogMessage<'_>> {
        match self {
            Self::Source(messages) => messages
                .get(id)
                .map(|message| CatalogMessage::Source(message)),
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
                write!(
                    formatter,
                    "Missing message \"{id}\" for locale \"{locale}\""
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
        $(, id_encoding: $id_encoding:literal)?
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
                    $crate::__Value::from($crate::__check_message_value!($crate; $default_message; $name; $value)),
                ),
            )+
        ]);
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            $(, id_encoding: $id_encoding)?
        );
        $intl.format_message_to_string_or_default(descriptor, &values)
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
        $intl.format_message_to_string_or_default(descriptor, $values)
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
        let descriptor = $crate::message_descriptor!(
            $(id: $id,)?
            default_message: $default_message
            $(, description: $description)?
            $(, id_encoding: $id_encoding)?
        );
        $intl.format_message_to_string_or_default(descriptor, &$crate::__Values::new())
    }};
}

#[derive(Clone, Default)]
pub struct MessageCatalog {
    bundles: HashMap<String, StoredBundle>,
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
            .insert(locale.to_string(), StoredBundle::Source(Arc::new(messages)));
        Ok(())
    }

    /// Inserts AST messages emitted by `formatjs compile --ast`.
    pub fn insert_precompiled(
        &mut self,
        locale: impl AsRef<str>,
        messages: PrecompiledMessages,
    ) -> Result<()> {
        let locale = parse_locale(locale.as_ref())?;
        self.bundles.insert(
            locale.to_string(),
            StoredBundle::Precompiled(Arc::new(messages)),
        );
        Ok(())
    }

    pub fn contains_locale(&self, locale: impl fmt::Display) -> bool {
        self.bundles.contains_key(&locale.to_string())
    }

    /// Returns source messages for a locale. Precompiled catalogs have no source map.
    pub fn messages(&self, locale: impl fmt::Display) -> Option<Arc<Messages>> {
        match self.bundles.get(&locale.to_string()) {
            Some(StoredBundle::Source(messages)) => Some(messages.clone()),
            _ => None,
        }
    }

    pub fn available_locales(&self) -> impl Iterator<Item = &str> {
        self.bundles.keys().map(String::as_str)
    }

    fn bundle(
        &self,
        locale: impl fmt::Display,
        cache: &IntlCache,
    ) -> Result<Option<CatalogBundle>> {
        self.bundles
            .get(&locale.to_string())
            .map(|bundle| cache.prepare_bundle(bundle))
            .transpose()
    }
}

/// Shared locale data and message cache for request-scoped `Intl` instances.
#[derive(Clone)]
pub struct IntlContext {
    cache: Arc<IntlCache>,
    fallbacker: Arc<LocaleFallbacker>,
    provider: Arc<dyn BufferProvider + Send + Sync>,
}

// Restores the auto traits the context had before it held `provider` outside the cache's
// `RwLock`; the provider only serves `&self` data loads.
impl std::panic::UnwindSafe for IntlContext {}
impl std::panic::RefUnwindSafe for IntlContext {}

impl IntlContext {
    /// Uses one provider for all formatters and locale negotiation.
    pub fn try_with_provider(
        provider: impl BufferProvider + Send + Sync + 'static,
    ) -> std::result::Result<Self, icu_provider::DataError> {
        let fallbacker = LocaleFallbacker::try_new_with_buffer_provider(&provider)?;
        let provider: Arc<dyn BufferProvider + Send + Sync> =
            Arc::new(LocaleFallbackProvider::new(provider, fallbacker.clone()));
        let options = Options::with_formatters(Arc::new(ProviderFormatters::new(provider.clone())));
        Ok(Self {
            cache: Arc::new(IntlCache::with_options(options)),
            fallbacker: Arc::new(fallbacker),
            provider,
        })
    }

    /// Checks every formatter for each catalog locale without root fallback for language data.
    /// Regional fallback, region defaults, global data, and explicit `und` remain valid.
    /// Generate blobs with `--deduplication none` or `retain-base-languages`;
    /// `maximal` removes root-identical locale data that this check requires.
    pub fn check_catalog(&self, catalog: &MessageCatalog) -> Result<()> {
        let formatters = ProviderFormatters::new(CatalogDataProvider(self.provider.clone()));
        let mut locales: Vec<&str> = catalog.available_locales().collect();
        locales.sort_unstable();
        for locale in locales {
            formatters.check_locale(&parse_locale(locale)?)?;
        }
        Ok(())
    }

    /// Picks the catalog locale for `requested_locales` with this context's fallback data;
    /// the free function `negotiate_locale` does the same with compiled data.
    pub fn negotiate_locale<I, S>(
        &self,
        requested_locales: I,
        default_locale: &Locale,
        catalog: &MessageCatalog,
    ) -> Result<Locale>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        negotiate_locale_with_fallbacker(
            requested_locales,
            default_locale,
            catalog,
            &self.fallbacker,
        )
    }
}

// Validate actual formatter loads while leaving runtime fallback unchanged.
struct CatalogDataProvider(Arc<dyn BufferProvider + Send + Sync>);

impl DynamicDataProvider<BufferMarker> for CatalogDataProvider {
    fn load_data(
        &self,
        marker: DataMarkerInfo,
        request: DataRequest,
    ) -> std::result::Result<DataResponse<BufferMarker>, DataError> {
        use icu::decimal::provider::DecimalDigitsV1;
        use icu_provider::DataMarker;
        use icu_provider::fallback::LocaleFallbackPriority;

        let response = self.0.load_data(marker, request)?;
        // Digit tables depend on numbering system, not language.
        if !marker.is_singleton
            && marker != DecimalDigitsV1::INFO
            && marker.fallback_config.priority == LocaleFallbackPriority::Language
            && !request.id.locale.language.is_unknown()
            && response
                .metadata
                .locale
                .is_some_and(|locale| locale.is_unknown())
        {
            return Err(
                DataError::custom("Locale data resolved to root (und)").with_req(marker, request)
            );
        }
        Ok(response)
    }
}

#[cfg_attr(feature = "compiled_data", derive(Default))]
pub struct IntlCache {
    state: RwLock<CacheState>,
}

#[cfg_attr(feature = "compiled_data", derive(Default))]
struct CacheState {
    options: Options,
    messages: HashMap<String, Arc<IcuMessageFormat>>,
    precompiled: HashMap<usize, PreparedCatalog>,
}

struct PreparedCatalog {
    // Retain the AST allocation so its address cannot be reused as a cache key.
    _source: Arc<PrecompiledMessages>,
    messages: Arc<CompiledMessages>,
}

impl IntlCache {
    #[cfg(feature = "compiled_data")]
    pub fn new() -> Self {
        Self::default()
    }

    /// Options are fixed for the lifetime of this cache.
    fn with_options(options: Options) -> Self {
        Self {
            state: RwLock::new(CacheState {
                options,
                messages: HashMap::new(),
                precompiled: HashMap::new(),
            }),
        }
    }

    pub fn len(&self) -> Result<usize> {
        self.state
            .read()
            .map(|state| state.messages.len())
            .map_err(|_| Error::CachePoisoned)
    }

    pub fn is_empty(&self) -> Result<bool> {
        self.len().map(|len| len == 0)
    }

    fn prepare_bundle(&self, bundle: &StoredBundle) -> Result<CatalogBundle> {
        let source = match bundle {
            StoredBundle::Source(messages) => return Ok(CatalogBundle::Source(messages.clone())),
            StoredBundle::Precompiled(source) => source,
        };
        let key = Arc::as_ptr(source) as usize;
        if let Some(prepared) = self
            .state
            .read()
            .map_err(|_| Error::CachePoisoned)?
            .precompiled
            .get(&key)
        {
            return Ok(CatalogBundle::Precompiled(prepared.messages.clone()));
        }
        let mut state = self.state.write().map_err(|_| Error::CachePoisoned)?;
        if let Some(prepared) = state.precompiled.get(&key) {
            return Ok(CatalogBundle::Precompiled(prepared.messages.clone()));
        }
        let messages = Arc::new(
            source
                .iter()
                .map(|(id, ast)| {
                    (
                        id.clone(),
                        Arc::new(IcuMessageFormat::from_ast_with_options(
                            ast.clone(),
                            state.options.clone(),
                        )),
                    )
                })
                .collect(),
        );
        state.precompiled.insert(
            key,
            PreparedCatalog {
                _source: source.clone(),
                messages: Arc::clone(&messages),
            },
        );
        Ok(CatalogBundle::Precompiled(messages))
    }

    fn get_or_compile(&self, source: &str) -> Result<Arc<IcuMessageFormat>> {
        let options = {
            let state = self.state.read().map_err(|_| Error::CachePoisoned)?;
            if let Some(message) = state.messages.get(source) {
                return Ok(message.clone());
            }
            state.options.clone()
        };
        let message = Arc::new(IcuMessageFormat::try_new_with_options(source, options)?);
        let mut state = self.state.write().map_err(|_| Error::CachePoisoned)?;
        Ok(state
            .messages
            .entry(source.to_owned())
            .or_insert(message)
            .clone())
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
    #[cfg(feature = "compiled_data")]
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
        Self::try_new_with_fallbacker(
            requested_locales,
            default_locale,
            catalog,
            cache,
            &LocaleFallbacker::new().static_to_owned(),
        )
    }

    pub fn try_new_with_context<I, S>(
        requested_locales: I,
        default_locale: impl AsRef<str>,
        catalog: Arc<MessageCatalog>,
        context: &IntlContext,
    ) -> Result<Self>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        Self::try_new_with_fallbacker(
            requested_locales,
            default_locale,
            catalog,
            context.cache.clone(),
            &context.fallbacker,
        )
    }

    fn try_new_with_fallbacker<I, S>(
        requested_locales: I,
        default_locale: impl AsRef<str>,
        catalog: Arc<MessageCatalog>,
        cache: Arc<IntlCache>,
        fallbacker: &LocaleFallbacker,
    ) -> Result<Self>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let default_locale = parse_locale(default_locale.as_ref())?;
        let default_messages = catalog
            .bundle(&default_locale, &cache)?
            .ok_or_else(|| Error::MissingDefaultLocale(default_locale.to_string()))?;
        let locale = negotiate_locale_with_fallbacker(
            requested_locales,
            &default_locale,
            &catalog,
            fallbacker,
        )?;
        let messages = catalog
            .bundle(&locale, &cache)?
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
    ) -> Result<RichFormattedMessage<T>> {
        self.format_message_ref(descriptor.as_ref(), values)
    }

    pub fn format_message_ref<T: Clone>(
        &self,
        descriptor: MessageDescriptorRef<'_>,
        values: &Values<T>,
    ) -> Result<RichFormattedMessage<T>> {
        self.format_with_fallback(
            descriptor,
            |message, locale| message.format(locale, values),
            RichFormattedMessage::Literal,
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

#[cfg(feature = "compiled_data")]
pub fn negotiate_locale<I, S>(
    requested_locales: I,
    default_locale: &Locale,
    catalog: &MessageCatalog,
) -> Result<Locale>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    negotiate_locale_with_fallbacker(
        requested_locales,
        default_locale,
        catalog,
        &LocaleFallbacker::new().static_to_owned(),
    )
}

fn negotiate_locale_with_fallbacker<I, S>(
    requested_locales: I,
    default_locale: &Locale,
    catalog: &MessageCatalog,
    fallbacker: &LocaleFallbacker,
) -> Result<Locale>
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
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
