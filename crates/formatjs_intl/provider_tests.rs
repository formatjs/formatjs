use super::*;
use formatjs_icu_messageformat::{
    DateTimeFormatOptions, DateTimeKind, DateTimeValue, ExtendedNumberFormatOptions, Formatters,
    NumericValue, PluralCategory, PluralType, Value,
};

struct NamedFormatters(&'static str);

impl Formatters for NamedFormatters {
    fn format_number(
        &self,
        locale: &Locale,
        _: NumericValue,
        _: &ExtendedNumberFormatOptions,
    ) -> formatjs_icu_messageformat::Result<String> {
        Ok(format!("{}:{locale}", self.0))
    }
    fn format_datetime(
        &self,
        _: &Locale,
        _: DateTimeValue,
        _: DateTimeKind,
        _: &DateTimeFormatOptions,
    ) -> formatjs_icu_messageformat::Result<String> {
        unreachable!("test uses numbers only")
    }
    fn plural_category(
        &self,
        _: &Locale,
        _: NumericValue,
        _: PluralType,
    ) -> formatjs_icu_messageformat::Result<PluralCategory> {
        unreachable!("test uses numbers only")
    }
}

fn options(name: &'static str) -> Options {
    Options::with_formatters(Arc::new(NamedFormatters(name)))
}

#[test]
fn cache_configuration_is_isolated_and_reused() {
    let first = IntlCache::with_options(options("first"));
    let second = IntlCache::with_options(options("second"));
    let source = "{n, number}";
    let values: Values = HashMap::from([("n".to_owned(), Value::from(42_i64))]);
    let message = first.get_or_compile(source).unwrap();
    assert!(Arc::ptr_eq(
        &message,
        &first.get_or_compile(source).unwrap()
    ));
    assert_eq!(message.format_to_string("en", &values).unwrap(), "first:en");
    assert_eq!(
        second
            .get_or_compile(source)
            .unwrap()
            .format_to_string("en", &values)
            .unwrap(),
        "second:en"
    );
}

#[test]
fn source_precompiled_and_descriptor_fallback_use_explicit_options() {
    let source = "{n, number}";
    let descriptor = MessageDescriptor::new("number", source);
    let values: Values = HashMap::from([("n".to_owned(), Value::from(42_i64))]);
    let fallbacker = LocaleFallbacker::new_without_data();
    for precompiled in [false, true] {
        let mut catalog = MessageCatalog::new();
        catalog.insert("en", HashMap::new()).unwrap();
        if precompiled {
            let ast = IcuMessageFormat::try_new_with_options(source, options("catalog"))
                .unwrap()
                .get_ast()
                .to_vec();
            catalog
                .insert_precompiled_with_options(
                    "fr",
                    HashMap::from([("number".to_owned(), ast)]),
                    options("catalog"),
                )
                .unwrap();
        } else {
            catalog
                .insert(
                    "fr",
                    HashMap::from([("number".to_owned(), source.to_owned())]),
                )
                .unwrap();
        }
        let cache = Arc::new(IntlCache::with_options(options("cache")));
        let intl = Intl::try_new_with_fallbacker(
            ["fr-CA"],
            "en",
            Arc::new(catalog),
            cache.clone(),
            &fallbacker,
        )
        .unwrap();
        let expected = if precompiled {
            "catalog:fr"
        } else {
            "cache:fr"
        };
        assert_eq!(
            intl.format_message_to_string(descriptor, &values).unwrap(),
            expected
        );
        assert_eq!(cache.len().unwrap(), usize::from(!precompiled));
        let missing = MessageDescriptor::new("missing", source);
        assert_eq!(
            intl.format_message_to_string(missing, &values).unwrap(),
            "cache:en"
        );
    }
}

#[test]
fn locale_negotiation_uses_supplied_fallbacker() {
    let mut catalog = MessageCatalog::new();
    for locale in ["en", "es", "es-419"] {
        catalog.insert(locale, HashMap::new()).unwrap();
    }
    let locale = negotiate_locale_with_fallbacker(
        ["es-AR"],
        &"en".parse().unwrap(),
        &catalog,
        &LocaleFallbacker::new_without_data(),
    )
    .unwrap();
    assert_eq!(locale.to_string(), "es");
    #[cfg(feature = "compiled_data")]
    assert_eq!(
        negotiate_locale(["es-AR"], &"en".parse().unwrap(), &catalog)
            .unwrap()
            .to_string(),
        "es-419"
    );
}
