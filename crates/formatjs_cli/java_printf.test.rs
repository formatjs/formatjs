use formatjs_cli::java_printf::{VerificationIssue, verify_catalogs};
use serde_json::{Value, json};
use std::collections::HashMap;

fn check(source: Value, target: Value) -> Vec<VerificationIssue> {
    verify_catalogs(
        &HashMap::from([("en".into(), source), ("fr".into(), target)]),
        "en",
    )
    .unwrap()
}

#[test]
fn java_printf_reorders_resolved_indices_and_allows_repeated_references_and_presentation_changes() {
    let issues = check(
        json!({"message": "%s has %d items, %3$.2f; %4$tY %4$tm. {literal}"}),
        json!({"message": "%4$tF: %3$8.3e; %2$x éléments pour %1$S %<s %% %n. {texte}"}),
    );
    assert_eq!(issues, []);
}

#[test]
fn java_printf_reports_missing_extra_and_incompatible_arguments() {
    let issues = check(
        json!({"missing": "%1$s %2$d", "extra": "%s", "type": "%s"}),
        json!({"missing": "%1$s", "extra": "%1$s %2$s", "type": "%d"}),
    );
    assert_eq!(
        issues,
        [
            VerificationIssue {
                locale: "fr".into(),
                message_id: "extra".into(),
                error: "Unexpected argument 2".into()
            },
            VerificationIssue {
                locale: "fr".into(),
                message_id: "missing".into(),
                error: "Missing argument 2".into()
            },
            VerificationIssue {
                locale: "fr".into(),
                message_id: "type".into(),
                error: "Incompatible argument 1: {String} vs {Integer}".into()
            },
        ]
    );
}

#[test]
fn java_printf_checks_runtime_type_constraints_introduced_by_flags_and_conversions() {
    for (source, target) in [
        ("%s", "%#s"),
        ("%d", "%+x"),
        ("%f", "%a"),
        ("%b", "%s"),
        ("%c", "%d"),
    ] {
        let issues = check(json!({"message": source}), json!({"message": target}));
        assert_eq!(issues.len(), 1, "{source} / {target}");
        assert!(issues[0].error.contains("Incompatible argument 1"));
    }
}

#[test]
fn java_printf_checks_every_syntax_even_without_a_shared_target_key() {
    let issues = check(
        json!({"bad": "%q", "unused": "%1$"}),
        json!({"extra": "%<s"}),
    );
    assert_eq!(
        issues
            .iter()
            .map(|issue| (issue.locale.as_str(), issue.message_id.as_str()))
            .collect::<Vec<_>>(),
        [("en", "bad"), ("en", "unused"), ("fr", "extra")]
    );
    assert!(
        issues[0]
            .error
            .contains("UnknownConversion('q') at bytes 0..2")
    );
    assert!(issues[1].error.contains("MissingConversion"));
    assert!(issues[2].error.contains("MissingPreviousArgument"));
    assert!(
        verify_catalogs(&HashMap::from([("en".into(), json!({"bad": "%q"}))]), "en")
            .unwrap()
            .len()
            == 1
    );
}

#[test]
fn java_printf_nested_messages_keep_ids_and_reject_ambiguous_or_non_string_leaves() {
    assert_eq!(
        check(
            json!({"screen": {"title": "%s"}}),
            json!({"screen": {"title": "%1$s"}})
        ),
        []
    );
    for messages in [
        json!({"array": ["%s", "%s"]}),
        json!({"number": 3}),
        json!({"nil": null}),
        json!({"nested": {"id": "%s"}, "nested.id": "%d"}),
    ] {
        assert!(verify_catalogs(&HashMap::from([("en".into(), messages)]), "en").is_err());
    }
    assert!(
        verify_catalogs(&HashMap::new(), "en")
            .unwrap_err()
            .to_string()
            .contains("Missing source en.json")
    );
}
