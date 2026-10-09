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
    for source in [
        "{n, number}",
        "{n, plural, one {one} other {other}}",
        "{n, selectordinal, one {one} other {other}}",
        "{n, date}",
        "{n, time}",
    ] {
        let message = IcuMessageFormat::try_new_with_options(source, options()).unwrap();
        let values: Values = HashMap::from([("n".to_owned(), Value::from(0_i64))]);
        assert_eq!(
            message.format_to_string("de", &values).unwrap_err().code,
            ErrorCode::Formatter
        );
    }
}
