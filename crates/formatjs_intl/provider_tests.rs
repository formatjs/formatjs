use super::*;
use formatjs_icu_messageformat::Value;
use icu::decimal::provider::{DecimalDigitsV1, DecimalSymbolsV1};
use icu::locale::fallback::provider::{LocaleLikelySubtagsLanguageV1, LocaleParentsV1};
use icu::plurals::provider::{PluralsCardinalV1, PluralsOrdinalV1};
use icu_provider::buf::{BufferFormat, BufferMarker};
use icu_provider::prelude::*;
use std::sync::Mutex;

#[derive(Default)]
struct TestProvider {
    comma: bool,
    omit_fallback: bool,
    requests: Arc<Mutex<Vec<(DataMarkerInfo, String)>>>,
}

impl DynamicDataProvider<BufferMarker> for TestProvider {
    fn load_data(
        &self,
        marker: DataMarkerInfo,
        request: DataRequest,
    ) -> std::result::Result<DataResponse<BufferMarker>, DataError> {
        let locale = request.id.locale.to_string();
        self.requests.lock().unwrap().push((marker, locale.clone()));
        let data: &'static [u8] = if marker == LocaleLikelySubtagsLanguageV1::INFO
            && !self.omit_fallback
        {
            br#"{"language_script":{},"language_region":{},"language":{"en":["Latn","US"],"es":["Latn","ES"],"fr":["Latn","FR"]},"und":["en","Latn","US"]}"#
        } else if marker == LocaleParentsV1::INFO && !self.omit_fallback {
            br#"{"parents":{"es-AR":["es",null,"419"]}}"#
        } else if marker == DecimalDigitsV1::INFO {
            br#"["0","1","2","3","4","5","6","7","8","9"]"#
        } else if marker == DecimalSymbolsV1::INFO && ["en", "fr"].contains(&locale.as_str()) {
            if self.comma {
                br#"{"strings":{"minus_sign_prefix":"-","minus_sign_suffix":"","plus_sign_prefix":"+","plus_sign_suffix":"","decimal_separator":",","grouping_separator":" ","numsys":"latn"},"grouping_sizes":{"primary":3,"secondary":3,"min_grouping":1}}"#
            } else {
                br#"{"strings":{"minus_sign_prefix":"-","minus_sign_suffix":"","plus_sign_prefix":"+","plus_sign_suffix":"","decimal_separator":".","grouping_separator":",","numsys":"latn"},"grouping_sizes":{"primary":3,"secondary":3,"min_grouping":1}}"#
            }
        } else if marker == PluralsCardinalV1::INFO && locale == "en" {
            br#"{"one":"i = 1 and v = 0"}"#
        } else if marker == PluralsCardinalV1::INFO && locale == "fr" {
            br#"{"one":"i = 0,1"}"#
        } else if marker == PluralsOrdinalV1::INFO && ["en", "fr"].contains(&locale.as_str()) {
            br#"{"one":"n = 1"}"#
        } else {
            return Err(DataErrorKind::IdentifierNotFound.with_req(marker, request));
        };
        let mut metadata = DataResponseMetadata::default();
        metadata.buffer_format = Some(BufferFormat::Json);
        Ok(DataResponse {
            metadata,
            payload: DataPayload::from_static_buffer(data),
        })
    }
}

fn context(comma: bool) -> IntlContext {
    IntlContext::try_with_provider(TestProvider {
        comma,
        ..Default::default()
    })
    .unwrap()
}

fn catalog(context: &IntlContext, precompiled: bool) -> Arc<MessageCatalog> {
    let source = "{n, number}";
    let mut catalog = MessageCatalog::new();
    catalog.insert("en", HashMap::new()).unwrap();
    if precompiled {
        let ast = context
            .cache
            .get_or_compile(source)
            .unwrap()
            .get_ast()
            .to_vec();
        catalog
            .insert_precompiled("fr", HashMap::from([("number".to_owned(), ast)]))
            .unwrap();
    } else {
        catalog
            .insert(
                "fr",
                HashMap::from([("number".to_owned(), source.to_owned())]),
            )
            .unwrap();
    }
    Arc::new(catalog)
}

#[test]
fn shared_catalog_uses_each_context_for_source_ast_and_descriptor_fallback() {
    let descriptor = MessageDescriptor::new("number", "{n, number}");
    let missing = MessageDescriptor::new("missing", "{n, number}");
    let values: Values = HashMap::from([("n".to_owned(), Value::from(1234.5))]);
    for precompiled in [false, true] {
        let first = context(false);
        let second = context(true);
        let catalog = catalog(&first, precompiled);
        for (context, expected) in [(&first, "1,234.5"), (&second, "1 234,5")] {
            let intl =
                Intl::try_new_with_context(["fr-CA"], "en", catalog.clone(), context).unwrap();
            assert_eq!(intl.locale().to_string(), "fr");
            assert_eq!(
                intl.format_message_to_string(descriptor, &values).unwrap(),
                expected
            );
            assert_eq!(
                intl.format_message_to_string(missing, &values).unwrap(),
                expected
            );
        }
    }
}

#[test]
fn cloned_context_reuses_source_and_precompiled_messages() {
    let context = context(false);
    let clone = context.clone();
    let source = "{n, number}";
    assert!(Arc::ptr_eq(
        &context.cache.get_or_compile(source).unwrap(),
        &clone.cache.get_or_compile(source).unwrap()
    ));
    let catalog = catalog(&context, true);
    let first = Intl::try_new_with_context(["fr"], "en", catalog.clone(), &context).unwrap();
    let second = Intl::try_new_with_context(["fr"], "en", catalog, &clone).unwrap();
    let (CatalogBundle::Precompiled(first), CatalogBundle::Precompiled(second)) =
        (&first.messages, &second.messages)
    else {
        panic!("expected AST catalogs")
    };
    assert!(Arc::ptr_eq(first, second));
}

#[test]
fn one_provider_serves_locale_fallback_and_every_formatter() {
    let provider = TestProvider::default();
    let requests = provider.requests.clone();
    let context = IntlContext::try_with_provider(provider).unwrap();
    let mut catalog = MessageCatalog::new();
    for locale in ["en", "fr", "es", "es-419"] {
        catalog.insert(locale, HashMap::new()).unwrap();
    }
    let catalog = Arc::new(catalog);
    let intl = Intl::try_new_with_context(["es-AR"], "en", catalog.clone(), &context).unwrap();
    assert_eq!(intl.locale().to_string(), "es-419");
    for locale in ["en", "fr"] {
        for (source, expected) in [
            ("{n, number}", Some("0")),
            (
                "{n, plural, one {one} other {other}}",
                Some(if locale == "fr" { "one" } else { "other" }),
            ),
            ("{n, selectordinal, one {one} other {other}}", Some("other")),
            ("{n, date}", None),
            ("{n, time}", None),
        ] {
            let message = context.cache.get_or_compile(source).unwrap();
            let values: Values = HashMap::from([("n".to_owned(), Value::from(0_i64))]);
            let start = requests.lock().unwrap().len();
            let result = message.format_to_string(locale, &values);
            if let Some(expected) = expected {
                assert_eq!(result.unwrap(), expected);
            } else {
                // Missing date/time markers must not fall back to baked ICU data.
                assert_eq!(
                    result.unwrap_err().code,
                    formatjs_icu_messageformat::ErrorCode::Formatter
                );
            }
            assert!(
                requests.lock().unwrap()[start..]
                    .iter()
                    .any(|(_, requested)| requested == locale)
            );
        }
    }
    let requests = requests.lock().unwrap();
    assert!(
        requests
            .iter()
            .any(|(marker, _)| *marker == LocaleParentsV1::INFO)
    );
    assert!(
        requests
            .iter()
            .any(|(marker, _)| *marker == LocaleLikelySubtagsLanguageV1::INFO)
    );
}

#[test]
fn incomplete_fallback_data_rejects_context() {
    assert!(
        IntlContext::try_with_provider(TestProvider {
            omit_fallback: true,
            ..Default::default()
        })
        .is_err()
    );
}
