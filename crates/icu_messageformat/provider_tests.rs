use super::*;
use icu_provider::buf::{BufferFormat, BufferMarker};
use icu_provider::prelude::*;

struct TestProvider;

impl DynamicDataProvider<BufferMarker> for TestProvider {
    fn load_data(
        &self,
        marker: DataMarkerInfo,
        request: DataRequest,
    ) -> std::result::Result<DataResponse<BufferMarker>, DataError> {
        use icu::decimal::provider::{DecimalDigitsV1, DecimalSymbolsV1};
        use icu::plurals::provider::{PluralsCardinalV1, PluralsOrdinalV1};
        let locale = request.id.locale.to_string();
        let data: &'static [u8] = if marker == DecimalDigitsV1::INFO {
            br#"["0","1","2","3","4","5","6","7","8","9"]"#
        } else if marker == DecimalSymbolsV1::INFO && locale == "en" {
            br#"{"strings":{"minus_sign_prefix":"-","minus_sign_suffix":"","plus_sign_prefix":"+","plus_sign_suffix":"","decimal_separator":".","grouping_separator":",","numsys":"latn"},"grouping_sizes":{"primary":3,"secondary":3,"min_grouping":1}}"#
        } else if marker == DecimalSymbolsV1::INFO && locale == "fr" {
            br#"{"strings":{"minus_sign_prefix":"-","minus_sign_suffix":"","plus_sign_prefix":"+","plus_sign_suffix":"","decimal_separator":",","grouping_separator":" ","numsys":"latn"},"grouping_sizes":{"primary":3,"secondary":3,"min_grouping":1}}"#
        } else if marker == PluralsCardinalV1::INFO && locale == "en" {
            br#"{"one":"i = 1 and v = 0"}"#
        } else if marker == PluralsCardinalV1::INFO && locale == "fr" {
            br#"{"one":"i = 0,1"}"#
        } else if marker == PluralsOrdinalV1::INFO && locale == "en" {
            br#"{"one":"n % 10 = 1 and n % 100 != 11","two":"n % 10 = 2 and n % 100 != 12","few":"n % 10 = 3 and n % 100 != 13"}"#
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

fn options() -> Options {
    Options::with_formatters(Arc::new(ProviderFormatters::new(TestProvider)))
}

#[test]
fn external_data_formats_numbers_and_plurals_from_source_and_ast() {
    let source = "{n, number} {n, plural, one {single} other {multiple}}";
    let message = IcuMessageFormat::try_new_with_options(source, options()).unwrap();
    let ast = Parser::new(source, options().parser).parse().unwrap();
    let precompiled = IcuMessageFormat::from_ast_with_options(ast, options());
    for message in [&message, &precompiled] {
        for (locale, number, expected) in [
            ("en", 0.0, "0 multiple"),
            ("fr", 0.0, "0 single"),
            ("en", 1234.5, "1,234.5 multiple"),
            ("fr", 1234.5, "1 234,5 multiple"),
        ] {
            let values: Values = HashMap::from([("n".to_owned(), Value::from(number))]);
            assert_eq!(message.format_to_string(locale, &values).unwrap(), expected);
        }
    }
    let ordinal = IcuMessageFormat::try_new_with_options(
        "{n, selectordinal, one {first} two {second} few {third} other {other}}",
        options(),
    )
    .unwrap();
    let values: Values = HashMap::from([("n".to_owned(), Value::from(2_i64))]);
    assert_eq!(ordinal.format_to_string("en", &values).unwrap(), "second");
}

#[test]
fn missing_provider_data_returns_formatter_errors() {
    // One message per formatter constructor: number, YMD and YMDE in three lengths,
    // T with and without seconds, cardinal and ordinal plural rules.
    for (source, formatter) in [
        ("{n, number}", "number formatter"),
        ("{n, date, short}", "date formatter"),
        ("{n, date, medium}", "date formatter"),
        ("{n, date, long}", "date formatter"),
        ("{n, date, ::EEEEyMd}", "date formatter"),
        ("{n, date, ::EEEEyMMMd}", "date formatter"),
        ("{n, date, full}", "date formatter"),
        ("{n, time, short}", "time formatter"),
        ("{n, time, medium}", "time formatter"),
        (
            "{n, plural, one {one} other {other}}",
            "cardinal plural rules",
        ),
        (
            "{n, selectordinal, one {one} other {other}}",
            "ordinal plural rules",
        ),
    ] {
        let message = IcuMessageFormat::try_new_with_options(source, options()).unwrap();
        let values: Values = HashMap::from([("n".to_owned(), Value::from(0_i64))]);
        let error = message.format_to_string("de", &values).unwrap_err();
        assert_eq!(error.code, ErrorCode::Formatter, "{source}");
        assert_eq!(
            error.message,
            format!("Cannot load ICU4X data for the {formatter} in locale de"),
            "{source}"
        );
        assert!(std::error::Error::source(&error).is_some(), "{source}");
    }
}

#[test]
fn check_locale_fails_at_the_first_formatter_without_data() {
    let formatters = ProviderFormatters::new(TestProvider);
    // `en` has number data but no date data in the test provider.
    for (locale, formatter) in [("de", "number formatter"), ("en", "date formatter")] {
        let error = formatters
            .check_locale(&locale.parse().unwrap())
            .unwrap_err();
        assert_eq!(error.code, ErrorCode::Formatter);
        assert_eq!(
            error.message,
            format!("Cannot load ICU4X data for the {formatter} in locale {locale}")
        );
    }
}

mod blob {
    use super::*;
    use icu_provider_blob::BlobDataProvider;

    // `icu4x-datagen 2.3.0 --format blob --cldr-tag 48.2.1 --deduplication none`
    //
    //  --locales '^fr' '^pl' (`^`: locale plus ancestors, including `und`; no descendants)
    //  --markers DecimalSymbolsV1 DecimalDigitsV1 PluralsCardinalV1 PluralsOrdinalV1
    //    CalendarPreferredV1 DatetimePatternsDateGregorianV1 DatetimeNamesMonthGregorianV1
    //    DatetimeNamesYearGregorianV1 DatetimeNamesWeekdayV1 DatetimePatternsTimeV1
    //    DatetimeNamesDayperiodV1
    //  --out testdata/fr_pl.postcard
    static BLOB: &[u8] = include_bytes!("testdata/fr_pl.postcard");

    fn formatters() -> ProviderFormatters {
        ProviderFormatters::new(BlobDataProvider::try_new_from_static_blob(BLOB).unwrap())
    }

    fn compile(message: &str) -> IcuMessageFormat {
        let options = Options::with_formatters(Arc::new(formatters()));
        IcuMessageFormat::try_new_with_options(message, options).unwrap()
    }

    #[test]
    fn formats_numbers_and_dates_from_datagen_blob() {
        let values: Values = HashMap::from([("value".to_owned(), Value::from(1234.5))]);
        assert_eq!(
            compile("{value, number}")
                .format_to_string("fr", &values)
                .unwrap(),
            "1\u{202f}234,5"
        );

        let values: Values = HashMap::from([("value".to_owned(), Value::from(0_i64))]);
        assert_eq!(
            compile("{value, date, medium}")
                .format_to_string("fr", &values)
                .unwrap(),
            "1 janv. 1970"
        );
        assert_eq!(
            compile("{value, time, short}")
                .format_to_string("fr", &values)
                .unwrap(),
            "00:00"
        );
    }

    #[test]
    fn selects_plural_categories_from_datagen_blob() {
        let cardinal = compile("{count, plural, one {one} few {few} many {many} other {other}}");
        for (count, expected) in [(1_i64, "one"), (2, "few"), (5, "many"), (22, "few")] {
            let values: Values = HashMap::from([("count".to_owned(), Value::from(count))]);
            assert_eq!(cardinal.format_to_string("pl", &values).unwrap(), expected);
        }
        let values: Values = HashMap::from([("count".to_owned(), Value::from(1.5))]);
        assert_eq!(cardinal.format_to_string("pl", &values).unwrap(), "other");

        let ordinal = compile("{place, selectordinal, one {#er} other {#e}}");
        for (place, expected) in [(1_i64, "1er"), (2, "2e")] {
            let values: Values = HashMap::from([("place".to_owned(), Value::from(place))]);
            assert_eq!(ordinal.format_to_string("fr", &values).unwrap(), expected);
        }
    }

    #[test]
    fn missing_locale_error_names_formatter_and_locale() {
        use icu_provider::{DataError, DataErrorKind};

        let values: Values = HashMap::from([("value".to_owned(), Value::from(1_i64))]);
        let error = compile("{value, number}")
            .format_to_string("de", &values)
            .unwrap_err();
        assert_eq!(
            error.message,
            "Cannot load ICU4X data for the number formatter in locale de"
        );
        let source =
            std::error::Error::source(&error).and_then(|source| source.downcast_ref::<DataError>());
        assert_eq!(
            source.map(|error| error.kind),
            Some(DataErrorKind::IdentifierNotFound)
        );
    }

    #[test]
    fn check_locale_covers_every_formatter_for_blob_locales() {
        let formatters = formatters();
        for locale in ["fr", "pl"] {
            formatters.check_locale(&locale.parse().unwrap()).unwrap();
        }
        let error = formatters.check_locale(&"de".parse().unwrap()).unwrap_err();
        assert_eq!(
            error.message,
            "Cannot load ICU4X data for the number formatter in locale de"
        );
    }
}
