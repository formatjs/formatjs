use formatjs_cli::apple_printf::{VerificationIssue, verify_catalogs};
use serde_json::{Value, json};
use std::collections::HashMap;
fn check(source: &str, target: &str) -> Vec<VerificationIssue> {
    verify_catalogs(
        &HashMap::from([
            ("en".into(), json!({"message":source})),
            ("fr".into(), json!({"message":target})),
        ]),
        "en",
    )
    .unwrap()
}
#[test]
fn apple_printf_allows_reordering_aliases_reuse_and_presentation_changes() {
    assert_eq!(
        check(
            "%@ %ld %u %.2f %C %S",
            "%6$S %5$C %4$E %3$X %2$li %1$@ %1$@ %%"
        ),
        []
    );
    assert_eq!(check("%d %u %o %lld %f", "%1$D %2$U %3$O %4$qd %5$lf"), []);
    assert_eq!(check("%*.*f %@", "%4$@ %3$*1$.*2$g"), []);
}
#[test]
fn apple_printf_preserves_types_lengths_and_dynamic_argument_roles() {
    for (source, target) in [
        ("%@", "%s"),
        ("%s", "%S"),
        ("%d", "%ld"),
        ("%ld", "%lld"),
        ("%d", "%u"),
        ("%f", "%Lf"),
        ("%C", "%c"),
        ("%p", "%@"),
        ("%*.*f", "%3$*2$.*1$f"),
    ] {
        let issues = check(source, target);
        assert_eq!(issues.len(), 1, "{source} / {target}");
        assert!(
            issues[0].error.contains("Incompatible argument"),
            "{issues:?}"
        );
    }
    assert!(check("%@ %d", "%@")[0].error.contains("Missing argument 2"));
    assert!(
        check("%@", "%@ %d")[0]
            .error
            .contains("Unexpected argument 2")
    );
}
#[test]
fn apple_printf_validates_source_extra_messages_and_catalog_shape() {
    let catalogs = HashMap::from([
        ("en".into(), json!({"source":"%#@count@"})),
        ("fr".into(), json!({"extra":"%n"})),
    ]);
    let issues = verify_catalogs(&catalogs, "en").unwrap();
    assert_eq!(issues.len(), 2);
    assert_eq!(issues[0].locale, "en");
    assert!(issues[0].error.contains("UnsupportedNamedReference"));
    assert!(issues[1].error.contains("UnsupportedWriteCount"));
    for invalid in [
        json!({"items":["%@"]}),
        json!({"x":{"y":"%@"},"x.y":"%d"}),
        Value::Null,
    ] {
        assert!(verify_catalogs(&HashMap::from([("en".into(), invalid)]), "en").is_err());
    }
    assert!(verify_catalogs(&HashMap::new(), "en").is_err());
}
