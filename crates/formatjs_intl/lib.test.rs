#![cfg(feature = "compiled_data")]
use formatjs_icu_messageformat::Value;
use formatjs_icu_messageformat::{FormattedMessage as RichFormattedMessage, Part, Values};
use formatjs_intl::*;
use icu_locale::Locale;
use std::collections::HashMap;
use std::sync::Arc;
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

const INVALID_DEFAULT: MessageDescriptor = MessageDescriptor::new("invalid.default", "{broken");

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
fn format_message_macro_reports_format_failure_and_returns_default() {
    let cache = Arc::new(IntlCache::new());
    let errors = Arc::new(Mutex::new(Vec::new()));
    let recorded = errors.clone();
    let intl = Intl::try_new(["en"], "en", catalog(), cache.clone())
        .unwrap()
        .with_on_error(move |error| {
            recorded.lock().unwrap().push((
                error.descriptor.id.to_owned(),
                error.source,
                matches!(error.error, Error::Message(_)),
            ));
        });
    let values: Values = Values::new();
    assert_eq!(
        format_message!(&intl, id: "approval", default_message: "Approve {name}", values: &values),
        "Approve {name}"
    );
    assert_eq!(
        *errors.lock().unwrap(),
        vec![("approval".to_owned(), MessageSource::DefaultMessage, true)]
    );
    assert_eq!(cache.len().unwrap(), 1);
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
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new()))
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
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();
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
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();
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
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();
    let values = Values::new();

    assert_eq!(
        intl.format_message_to_string(INVALID_DEFAULT, &values)
            .unwrap(),
        "{translated"
    );
    assert_eq!(
        intl.format_message(INVALID_DEFAULT, &values).unwrap(),
        RichFormattedMessage::Literal("{translated".to_owned())
    );
    assert_eq!(
        intl.format_message_to_parts(INVALID_DEFAULT, &values)
            .unwrap(),
        vec![Part::Literal("{translated".to_owned())]
    );
}

#[test]
fn falls_back_on_empty_translation() {
    let mut catalog = MessageCatalog::new();
    catalog
        .insert(
            "fr",
            HashMap::from([("fallback".to_owned(), String::new())]),
        )
        .unwrap();
    catalog.insert("en", Messages::new()).unwrap();
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();
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
    let intl = Intl::try_new(["en"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();

    assert_eq!(
        intl.format_message_to_string(EMPTY_DEFAULT, &Values::new())
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

#[test]
fn hex_ids_match_web_and_format_translations() {
    let greeting = message_descriptor!(
        default_message: "  Hello,\n {name}! \u{0085}",
        description: "Greeting",
        id_encoding: "hex",
    );
    assert_eq!(greeting.id, "106d712534");
    assert_eq!(
        message_descriptor!(default_message: "Hello", description: "", id_encoding: "hex").id,
        "3615f80c9d"
    );
    assert_eq!(
        message_descriptor!(default_message: "Hello", description: "").id,
        message_descriptor!(default_message: "Hello").id
    );
    assert_eq!(
        message_descriptor!(id: "manual", default_message: "Hello", id_encoding: "hex").id,
        "manual"
    );
    let mut catalog = MessageCatalog::new();
    catalog.insert("en", HashMap::new()).unwrap();
    catalog
        .insert(
            "fr",
            HashMap::from([
                ("106d712534".to_owned(), "Bonjour, {name}!".to_owned()),
                ("3615f80c9d".to_owned(), "Bonjour".to_owned()),
            ]),
        )
        .unwrap();
    let intl = Intl::try_new(["fr"], "en", Arc::new(catalog), Arc::new(IntlCache::new())).unwrap();
    let values: Values = HashMap::from([("name".to_owned(), Value::from("Ada"))]);
    assert_eq!(
        format_message!(&intl, default_message: "Hello, {name}!", description: "Greeting", id_encoding: "hex", values: { name: "Ada" }),
        "Bonjour, Ada!"
    );
    assert_eq!(
        format_message!(&intl, default_message: "Hello, {name}!", description: "Greeting", id_encoding: "hex", values: &values),
        "Bonjour, Ada!"
    );
    assert_eq!(
        format_message!(&intl, default_message: "Hello", id_encoding: "hex"),
        "Bonjour"
    );
    assert_eq!(
        formatted_message!(&intl, default_message: "Hello", id_encoding: "hex").to_string(),
        "Bonjour"
    );
    let name = formatted_message!(&intl, id: "name", default_message: "Ada");
    assert_eq!(formatted_message!(&intl, default_message: "Hello, {name}!", description: "Greeting", id_encoding: "hex", values: { name: &name }).as_str(), "Bonjour, Ada!");
}
