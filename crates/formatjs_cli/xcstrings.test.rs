use formatjs_cli::xcstrings::{VerificationIssue, VerificationOptions, verify_catalogs};
use serde_json::{Value, json};
use std::collections::BTreeMap;

fn unit(value: &str) -> Value {
    json!({"stringUnit":{"state":"translated","value":value}})
}
fn catalog(entries: Value) -> Value {
    json!({"sourceLanguage":"en","version":"1.0","strings":entries})
}
fn check(value: Value) -> Vec<VerificationIssue> {
    verify_catalogs(
        &BTreeMap::from([("Localizable.xcstrings".into(), value)]),
        None,
        VerificationOptions {
            structural_equality: true,
            ..Default::default()
        },
    )
    .unwrap()
}
fn pair(source: Value, target: Value) -> Value {
    catalog(json!({"message":{"localizations":{"en":source,"fr":target}}}))
}

#[test]
fn xcstrings_source_key_fallback_explicit_source_and_nontranslatable_entries() {
    assert_eq!(
        check(catalog(json!({
            "%@":{"localizations":{"fr":unit("%1$@")}},
            "opaque.key":{"localizations":{"en":unit("%ld"),"fr":unit("%1$li")}},
            "%n":{"shouldTranslate":false,"localizations":{"fr":unit("%💥")}}
        }))),
        []
    );
    let issues = check(catalog(json!({"%@":{"localizations":{"fr":unit("%s")}}})));
    assert!(issues[0].error.contains("Incompatible argument 1"));
    assert_eq!(issues[0].message_id, "Localizable.xcstrings: %@");
}

#[test]
fn xcstrings_preserves_argument_types_lengths_widths_and_reordering() {
    for (source, target) in [
        (
            "%@ %ld %u %.2f %C %S",
            "%6$S %5$C %4$E %3$X %2$li %1$@ %1$@ %%",
        ),
        ("%d %u %o %lld %f", "%1$D %2$U %3$O %4$qd %5$lf"),
        ("%*.*f %@", "%4$@ %3$*1$.*2$g"),
    ] {
        assert_eq!(check(pair(unit(source), unit(target))), []);
    }
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
        ("%@ %d", "%@"),
        ("%@", "%@ %d"),
    ] {
        assert!(
            !check(pair(unit(source), unit(target))).is_empty(),
            "{source} / {target}"
        );
    }
}

fn plural(one: &str, other: &str) -> Value {
    json!({"variations":{"plural":{"one":unit(one),"other":unit(other)}}})
}
fn substitution(argument: u32, specifier: &str, one: &str, other: &str) -> Value {
    let mut value = plural(one, other);
    value["argNum"] = json!(argument);
    value["formatSpecifier"] = json!(specifier);
    value
}

#[test]
fn xcstrings_plural_categories_differ_and_selector_may_be_omitted() {
    let source = plural("One item", "%lld items");
    let target = json!({"variations":{"plural":{"one":unit("Un élément"),"few":unit("%lld éléments"),"many":unit("%lld éléments"),"other":unit("%lld éléments")}}});
    assert_eq!(check(pair(source.clone(), target)), []);
    assert!(!check(pair(source, plural("Un", "%d éléments"))).is_empty());
    assert!(
        !check(pair(
            plural("One for %@", "%2$lld for %1$@"),
            plural("Un", "%2$lld pour %1$@")
        ))
        .is_empty()
    );
}

#[test]
fn xcstrings_device_fallback_and_nested_plural_paths() {
    let source = json!({"variations":{"device":{"mac":unit("Click %@"),"other":plural("One tap for %@","%2$lld taps for %1$@")}}});
    let target = json!({"variations":{"device":{"mac":unit("Cliquer %1$@"),"iphone":plural("Un toucher pour %@","%2$lld touches pour %1$@"),"other":plural("Un toucher pour %@","%2$lld touches pour %1$@")}}});
    assert_eq!(check(pair(source.clone(), target.clone())), []);
    let mut bad = target;
    bad["variations"]["device"]["iphone"]["variations"]["plural"]["one"] = unit("Un toucher");
    let issues = check(pair(source, bad));
    assert!(
        issues
            .iter()
            .any(|issue| issue.error.contains("device.iphone.plural.one")
                && issue.error.contains("Missing argument 1"))
    );
}

#[test]
fn xcstrings_substitutions_resolve_percent_arg_to_owning_position_and_type() {
    let source = json!({"stringUnit":{"value":"%#@cats@ and %#@dogs@"},"substitutions":{
        "cats":substitution(1,"lld","One cat","%arg cats"),
        "dogs":substitution(2,"lld","One dog","%arg dogs")
    }});
    let target = json!({"stringUnit":{"value":"%#@dogs@ et %#@cats@"},"substitutions":{
        "cats":substitution(1,"lld","Un chat","%arg chats"),
        "dogs":substitution(2,"lld","Un chien","%2$arg chiens")
    }});
    assert_eq!(check(pair(source.clone(), target.clone())), []);
    let mut bad = target.clone();
    bad["substitutions"]["dogs"]["formatSpecifier"] = json!("d");
    assert!(
        check(pair(source.clone(), bad))
            .iter()
            .any(|issue| issue.error.contains("Incompatible"))
    );
    let mut bad = target;
    bad["substitutions"]["dogs"]["variations"]["plural"]["other"] = unit("%1$@ chiens");
    assert!(
        check(pair(source, bad))
            .iter()
            .any(|issue| issue.error.contains("substitutions.dogs")
                && issue.error.contains("Incompatible argument 1"))
    );
}

#[test]
fn xcstrings_rejects_missing_definitions_malformed_nodes_and_unsupported_ambiguity() {
    for target in [
        unit("%#@missing@"),
        unit("%arg"),
        unit("%n"),
        json!({"variations":{"plural":{"one":unit("%lld")}}}),
        json!({"stringUnit":{"value":"%@"},"variations":{"device":{"other":unit("%@")}}}),
        json!({"stringUnit":{"value":"%@"},"substitutions":{"unused":substitution(0,"lld","one","%arg")}}),
    ] {
        assert!(!check(pair(unit("%@"), target)).is_empty());
    }
    let issues = check(pair(
        plural("%lld %lld", "%lld %lld"),
        plural("%lld %lld", "%lld %lld"),
    ));
    assert!(
        issues
            .iter()
            .any(|issue| issue.error.contains("Ambiguous plural selector"))
    );
    assert!(
        check(pair(unit("%@ %💥"), unit("%@")))
            .iter()
            .any(|issue| issue.locale == "en")
    );
}

#[test]
fn xcstrings_separates_tables_infers_source_and_checks_missing_localizations() {
    let catalogs = BTreeMap::from([
        (
            "One.xcstrings".into(),
            catalog(json!({"key":{"localizations":{"fr":unit("literal")}}})),
        ),
        (
            "Two.xcstrings".into(),
            catalog(
                json!({"key":{"localizations":{"en":unit("%ld")}},"skip":{"shouldTranslate":false}}),
            ),
        ),
    ]);
    let issues = verify_catalogs(
        &catalogs,
        Some("en"),
        VerificationOptions {
            missing_keys: true,
            structural_equality: true,
        },
    )
    .unwrap();
    assert_eq!(issues.len(), 1);
    assert_eq!(issues[0].message_id, "Two.xcstrings: key");
    assert_eq!(issues[0].locale, "fr");
    assert!(verify_catalogs(&catalogs, Some("de"), VerificationOptions::default()).is_err());
    for (file, value) in [
        ("en.json", json!({"message":"%@"})),
        (
            "Localizable.xcstrings",
            json!({"sourceLanguage":"en","version":"9.0","strings":{}}),
        ),
        ("Invalid.xcstrings", Value::Null),
    ] {
        assert!(
            verify_catalogs(
                &BTreeMap::from([(file.into(), value)]),
                None,
                VerificationOptions::default()
            )
            .is_err()
        );
    }
    assert!(verify_catalogs(&BTreeMap::new(), None, VerificationOptions::default()).is_err());
}

#[test]
fn xcstrings_substitution_branches_preserve_nonselector_arguments_or_host_placement() {
    let source = json!({"stringUnit":{"value":"%#@items@"},"substitutions":{"items":substitution(1,"lld","One for %2$@","%arg for %2$@")}});
    let target = json!({"stringUnit":{"value":"%#@items@"},"substitutions":{"items":substitution(1,"lld","Un","%arg pour %2$@")}});
    let issues = check(pair(source.clone(), target));
    assert!(issues.iter().any(|issue| {
        issue
            .error
            .contains("substitutions.items.plural.one: Missing argument 2")
    }));
    let target = json!({"stringUnit":{"value":"%#@items@ pour %2$@"},"substitutions":{"items":substitution(1,"lld","Un","%arg")}});
    assert_eq!(check(pair(source, target)), []);
}

#[test]
fn xcstrings_plain_percent_text_is_not_implicitly_a_format() {
    assert_eq!(
        check(catalog(json!({
            "100%":{"localizations":{"fr":unit("100%")}},
            "50% off":{"localizations":{"fr":unit("50% de réduction")}},
            "Code %q":{"localizations":{"fr":unit("Code %q")}},
        }))),
        []
    );
    assert!(!check(pair(unit("%@: 100%%"), unit("%@: 100%"))).is_empty());
}

#[test]
fn xcstrings_substitution_ordinary_arguments_continue_after_percent_arg() {
    let source = json!({"stringUnit":{"value":"%1$@ %#@count@"},"substitutions":{"count":substitution(2,"lld","One for %3$@","%arg for %@")}});
    let target = json!({"stringUnit":{"value":"%#@count@ %1$@"},"substitutions":{"count":substitution(2,"lld","Un pour %3$@","%arg pour %3$@")}});
    assert_eq!(check(pair(source, target)), []);
}

#[test]
fn xcstrings_branch_requirements_follow_source_case_and_other_fallback() {
    let source = plural("One item", "%1$lld items for %2$@");
    let target = plural("Un élément", "%1$lld éléments pour %2$@");
    assert_eq!(check(pair(source.clone(), target)), []);
    let target = json!({"variations":{"plural":{"one":unit("Un élément"),"few":unit("%lld éléments"),"other":unit("%1$lld éléments pour %2$@")}}});
    assert!(check(pair(source, target)).iter().any(
        |issue| issue.locale == "fr" && issue.error.contains("plural.few: Missing argument 2")
    ));
    let source = json!({"stringUnit":{"value":"%#@items@"},"substitutions":{"items":substitution(1,"lld","One item","%arg for %2$@")}});
    let target = json!({"stringUnit":{"value":"%#@items@"},"substitutions":{"items":substitution(1,"lld","Un élément","%arg pour %2$@")}});
    assert_eq!(check(pair(source, target)), []);
}

#[test]
fn xcstrings_source_contract_supplies_types_for_gaps_in_plural_fragments() {
    let source = plural("One for %2$@", "%1$lld for %2$@");
    let target = plural("Un pour %2$@", "%1$lld pour %2$@");
    assert_eq!(check(pair(source, target)), []);
    let issues = check(pair(unit("%2$@"), unit("%2$@")));
    assert!(issues.iter().any(|issue| {
        issue.locale == "en"
            && issue
                .error
                .contains("Unknown source argument type at position 1")
    }));
}
