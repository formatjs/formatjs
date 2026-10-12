#![cfg(feature = "compiled_data")]
use formatjs_intl::{Intl, MessageDescriptor};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use formatjs_intl::{IntlCache, MessageCatalog, MessageSource, message_descriptor};
use formatjs_intl::{MessageValues, Verbatim, VerbatimSource, formatted_message};

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

struct SelectedFile {
    path: String,
}

impl VerbatimSource for SelectedFile {
    fn as_verbatim(&self) -> &str {
        &self.path
    }
}

#[test]
fn typed_messages_preserve_locale_pluralization_and_nested_content() {
    let intl = intl();
    let nested = formatted_message!(&intl, id: "done", default_message: "Done");
    let file = SelectedFile {
        path: "/tmp/{report}.txt".into(),
    };
    let path = Verbatim::new(&file);
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
fn typed_messages_report_formatting_errors_and_preserve_fallback_text() {
    let errors = Arc::new(Mutex::new(Vec::new()));
    let captured = errors.clone();
    let intl = intl().with_on_error(move |error| {
        captured.lock().unwrap().push(error.source);
    });
    let values = MessageValues::new();
    assert_eq!(
        intl.format_message_typed(SUMMARY, &values)
            .unwrap()
            .as_str(),
        TRANSLATED_SUMMARY
    );
    assert_eq!(
        intl.format_message_typed_or_default(SUMMARY, &values)
            .as_str(),
        TRANSLATED_SUMMARY
    );
    assert!(errors.lock().unwrap().contains(&MessageSource::Translation));
}
