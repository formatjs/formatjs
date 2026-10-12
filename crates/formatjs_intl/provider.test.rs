use formatjs_icu_messageformat::{IcuMessageFormat, Options, ProviderFormatters};
use formatjs_icu_messageformat::{Value, Values};
use formatjs_intl::*;
use icu::decimal::provider::{DecimalDigitsV1, DecimalSymbolsV1};
use icu::locale::fallback::provider::{LocaleLikelySubtagsLanguageV1, LocaleParentsV1};
use icu::plurals::provider::{PluralsCardinalV1, PluralsOrdinalV1};
use icu_locale::Locale;
use icu_locale::fallback::LocaleFallbacker;
use icu_provider::buf::BufferProvider;
use icu_provider::buf::{BufferFormat, BufferMarker};
use icu_provider::prelude::*;
use icu_provider_adapters::fallback::LocaleFallbackProvider;
use std::collections::HashMap;
use std::error::Error as _;
use std::sync::Arc;
use std::sync::Mutex;

#[derive(Clone, Default)]
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

fn catalog(precompiled: bool) -> Arc<MessageCatalog> {
    let source = "{n, number}";
    let mut catalog = MessageCatalog::new();
    catalog.insert("en", HashMap::new()).unwrap();
    if precompiled {
        let ast = formatjs_icu_messageformat_parser::Parser::new(
            source,
            formatjs_icu_messageformat_parser::ParserOptions::default(),
        )
        .parse()
        .unwrap();
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
        let catalog = catalog(precompiled);
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
fn cloned_context_formats_source_and_precompiled_messages() {
    let context = context(false);
    let clone = context.clone();
    let descriptor = MessageDescriptor::new("number", "{n, number}");
    let values = Values::from([("n".to_owned(), Value::from(1234.5))]);
    for precompiled in [false, true] {
        let catalog = catalog(precompiled);
        let first = Intl::try_new_with_context(["fr"], "en", catalog.clone(), &context).unwrap();
        let second = Intl::try_new_with_context(["fr"], "en", catalog, &clone).unwrap();
        assert_eq!(
            first.format_message_to_string(descriptor, &values).unwrap(),
            "1,234.5"
        );
        assert_eq!(
            second
                .format_message_to_string(descriptor, &values)
                .unwrap(),
            "1,234.5"
        );
    }
}

#[test]
fn one_provider_serves_locale_fallback_and_every_formatter() {
    let provider = TestProvider::default();
    let requests = provider.requests.clone();
    let context = IntlContext::try_with_provider(provider.clone()).unwrap();
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
            let message = message_with_provider(source, provider.clone());
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
            let requests = requests.lock().unwrap();
            assert!(requests.len() > start);
            if expected.is_some() {
                assert!(
                    requests[start..]
                        .iter()
                        .any(|(_, requested)| requested == locale)
                );
            }
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

#[test]
fn regional_locales_and_extensions_use_available_provider_data() {
    let provider = TestProvider::default();
    let requests = provider.requests.clone();
    let context = IntlContext::try_with_provider(provider.clone()).unwrap();
    let sources = [
        ("number", "{n, number}", "1"),
        ("cardinal", "{n, plural, one {one} other {other}}", "one"),
        (
            "ordinal",
            "{n, selectordinal, one {one} other {other}}",
            "one",
        ),
    ];
    let mut catalog = MessageCatalog::new();
    catalog.insert("en", HashMap::new()).unwrap();
    catalog
        .insert(
            "en-XX",
            sources
                .iter()
                .map(|(id, source, _)| (id.to_string(), source.to_string()))
                .collect(),
        )
        .unwrap();
    let catalog = Arc::new(catalog);
    let values: Values = HashMap::from([("n".to_owned(), Value::from(1_i64))]);
    for locale in ["en-XX", "en-XX-u-foo-x-private"] {
        let intl = Intl::try_new_with_context([locale], "en", catalog.clone(), &context).unwrap();
        assert_eq!(intl.locale().to_string(), "en-XX");
        for (id, source, expected) in sources {
            let start = requests.lock().unwrap().len();
            assert_eq!(
                intl.format_message_to_string(
                    MessageDescriptor::new(id, "wrong fallback"),
                    &values
                )
                .unwrap(),
                expected
            );
            assert!(
                requests.lock().unwrap()[start..]
                    .iter()
                    .any(|(_, locale)| locale == "en")
            );
            assert_eq!(
                message_with_provider(source, provider.clone())
                    .format_to_string(locale, &values)
                    .unwrap(),
                expected
            );
        }
    }
}

#[test]
fn context_stays_unwind_safe() {
    fn assert_unwind_safe<T: std::panic::UnwindSafe + std::panic::RefUnwindSafe>() {}
    assert_unwind_safe::<IntlContext>();
}

mod blob {
    use super::*;
    use icu_provider_blob::BlobDataProvider;

    // `icu4x-datagen 2.3.0 --format blob --cldr-tag 48.2.1 --deduplication none`
    //
    //  --locales '^en' '^fr' (`^`: locale plus ancestors, including `und`; no descendants)
    //  --markers DecimalSymbolsV1 DecimalDigitsV1 PluralsCardinalV1 PluralsOrdinalV1
    //    CalendarPreferredV1 DatetimePatternsDateGregorianV1 DatetimeNamesMonthGregorianV1
    //    DatetimeNamesYearGregorianV1 DatetimeNamesWeekdayV1 DatetimePatternsTimeV1
    //    DatetimeNamesDayperiodV1 LocaleLikelySubtagsLanguageV1 LocaleParentsV1
    //  --out testdata/en_fr.postcard
    static BLOB: &[u8] = include_bytes!("testdata/en_fr.postcard");

    const SUMMARY: MessageDescriptor = MessageDescriptor::new(
        "summary",
        "{count, plural, one {# task} other {# tasks}} · {total, number} · {when, date, medium}",
    );

    fn context() -> IntlContext {
        IntlContext::try_with_provider(BlobDataProvider::try_new_from_static_blob(BLOB).unwrap())
            .unwrap()
    }

    fn catalog(locales: &[&str]) -> MessageCatalog {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", Messages::new()).unwrap();
        for locale in locales {
            catalog
                .insert(
                    locale,
                    HashMap::from([(
                        SUMMARY.id.to_owned(),
                        "{count, plural, one {# tâche} other {# tâches}} · {total, number} · {when, date, medium}"
                            .to_owned(),
                    )]),
                )
                .unwrap();
        }
        catalog
    }

    #[test]
    fn regional_catalog_formats_with_parent_locale_data() {
        let context = context();
        let intl =
            Intl::try_new_with_context(["fr-CA"], "en", Arc::new(catalog(&["fr-CA"])), &context)
                .unwrap();
        let values: Values = HashMap::from([
            ("count".to_owned(), Value::from(2_i64)),
            ("total".to_owned(), Value::from(1234.5)),
            ("when".to_owned(), Value::from(0_i64)),
        ]);

        assert_eq!(intl.locale().to_string(), "fr-CA");
        assert_eq!(
            intl.format_message_to_string(SUMMARY, &values).unwrap(),
            "2 tâches · 1\u{202f}234,5 · 1 janv. 1970"
        );
    }

    #[test]
    fn check_catalog_accepts_regional_and_root_locales() {
        context()
            .check_catalog(&catalog(&["fr", "fr-CA", "fr-CA-u-nu-latn", "und-US"]))
            .unwrap();
    }

    // Without the check, `de` formats with root data ("1,234.5 · 1970 M01 1") and reports nothing.
    #[test]
    fn check_catalog_rejects_locales_that_resolve_to_root_data() {
        let error = context()
            .check_catalog(&catalog(&["fr", "es", "de"]))
            .unwrap_err();
        let message = error.to_string();
        assert!(
            message.contains("number formatter in locale de"),
            "{message}"
        );
        assert!(
            error
                .source()
                .unwrap()
                .source()
                .unwrap()
                .to_string()
                .contains("root (und)")
        );
    }

    #[test]
    fn check_catalog_rejects_partial_locale_data_without_changing_runtime_fallback() {
        use icu::datetime::provider::semantic_skeletons::DatetimePatternsDateGregorianV1;
        use icu::datetime::provider::semantic_skeletons::DatetimePatternsTimeV1;

        struct RootOnlyMarker {
            provider: BlobDataProvider,
            marker: DataMarkerInfo,
        }
        impl DynamicDataProvider<BufferMarker> for RootOnlyMarker {
            fn load_data(
                &self,
                marker: DataMarkerInfo,
                request: DataRequest,
            ) -> std::result::Result<DataResponse<BufferMarker>, DataError> {
                if marker == self.marker && request.id.locale.language.as_str() == "fr" {
                    return Err(DataErrorKind::IdentifierNotFound.with_req(marker, request));
                }
                self.provider.load_data(marker, request)
            }
        }

        for (marker, formatter) in [
            (DatetimePatternsDateGregorianV1::INFO, "date formatter"),
            (DatetimePatternsTimeV1::INFO, "time formatter"),
            (PluralsOrdinalV1::INFO, "ordinal plural rules"),
        ] {
            let context = IntlContext::try_with_provider(RootOnlyMarker {
                provider: BlobDataProvider::try_new_from_static_blob(BLOB).unwrap(),
                marker,
            })
            .unwrap();
            let error = context.check_catalog(&catalog(&["fr"])).unwrap_err();
            assert!(error.to_string().contains(formatter), "{error}");
            assert!(error.to_string().contains("in locale fr"), "{error}");
            assert!(
                error
                    .source()
                    .unwrap()
                    .source()
                    .unwrap()
                    .to_string()
                    .contains("root (und)")
            );

            let source = "{when, date, medium}";
            let message = message_with_provider(
                source,
                RootOnlyMarker {
                    provider: BlobDataProvider::try_new_from_static_blob(BLOB).unwrap(),
                    marker,
                },
            );
            let values = Values::from([("when".to_owned(), Value::from(0_i64))]);
            let formatted = message.format_to_string("fr", &values).unwrap();
            if marker == DatetimePatternsDateGregorianV1::INFO {
                assert_eq!(formatted, "1970 janv. 1");
            } else {
                assert_eq!(formatted, "1 janv. 1970");
            }
        }
    }

    #[test]
    fn negotiates_locales_through_either_provider() {
        let catalog = catalog(&["fr"]);
        let default_locale: Locale = "en".parse().unwrap();
        for (provider, context) in [("synthetic", super::context(false)), ("blob", context())] {
            for (requested, expected) in [("fr-CA", "fr"), ("de", "en")] {
                let negotiated = context
                    .negotiate_locale([requested], &default_locale, &catalog)
                    .unwrap();
                assert_eq!(negotiated.to_string(), expected, "{provider}: {requested}");
            }
        }
    }
}

fn message_with_provider(
    source: &str,
    provider: impl BufferProvider + Send + Sync + 'static,
) -> IcuMessageFormat {
    let fallbacker = LocaleFallbacker::try_new_with_buffer_provider(&provider).unwrap();
    let provider = LocaleFallbackProvider::new(provider, fallbacker);
    IcuMessageFormat::try_new_with_options(
        source,
        Options::with_formatters(Arc::new(ProviderFormatters::new(provider))),
    )
    .unwrap()
}
