use formatjs_cli::android_resources::{
    Resource, VerificationOptions, parse_resource, verify_resources,
};
use std::collections::BTreeMap;
use std::path::PathBuf;

fn xml(body: &str) -> Vec<u8> {
    format!("<resources>{body}</resources>").into_bytes()
}

#[test]
fn android_xml_decoding_precedes_android_escaping_without_typography_policy() {
    let resources = parse_resource(&xml(r#"
<string name="quoted">"L&apos;histoire"</string>
<string name="escaped">L\&apos;histoire</string>
<string name="curly">L’histoire&#160;« test »</string>
<string name="unicode">\u0025\u0031$s \uD83D\uDE00</string>
<string name="styled">Hello <b>%1$s</b> &amp; friends</string>
"#))
    .unwrap();
    for (key, expected) in [
        ("quoted", "L'histoire"),
        ("escaped", "L'histoire"),
        ("curly", "L’histoire\u{a0}« test »"),
        ("unicode", "%1$s 😀"),
        ("styled", "Hello %1$s & friends"),
    ] {
        let Resource::String(item) = &resources[&format!("string/{key}")] else {
            panic!()
        };
        assert_eq!(item.text, expected);
    }
    let data = br#"<!DOCTYPE resources [<!ENTITY brand "Example">]><resources><string name="brand">&brand;</string></resources>"#;
    let Resource::String(item) = &parse_resource(data).unwrap()["string/brand"] else {
        panic!()
    };
    assert_eq!(item.text, "Example");
}

#[test]
fn android_rejects_invalid_xml_escapes_and_plural_structure() {
    for body in [
        r#"<string name="s">L'histoire</string>"#,
        r#"<string name="s">L&apos;histoire</string>"#,
        r#"<string name="s">\u12zx</string>"#,
        r#"<string name="s">&nbsp;</string>"#,
        r#"<string name="s">&unknown;</string>"#,
        r#"<string name="s">one</string><string name="s">two</string>"#,
        r#"<plurals name="s"><item quantity="one">one</item></plurals>"#,
        r#"<plurals name="s"><item quantity="other">one</item><item quantity="other">two</item></plurals>"#,
        r#"<plurals name="s"><item quantity="invalid">one</item><item quantity="other">other</item></plurals>"#,
        r#"<string-array name="s"><string>wrong</string></string-array>"#,
    ] {
        assert!(parse_resource(&xml(body)).is_err(), "{body}");
    }
}

fn files(source: &str, target: &str) -> BTreeMap<PathBuf, Vec<u8>> {
    BTreeMap::from([
        ("res/values/strings.xml".into(), xml(source)),
        ("res/values-fr/strings.xml".into(), xml(target)),
    ])
}
fn options() -> VerificationOptions {
    VerificationOptions {
        missing_keys: true,
        extra_keys: true,
        structural_equality: true,
    }
}

#[test]
fn android_verifies_printf_after_xml_and_android_decoding() {
    let source = r#"<string name="s">%1$s %2$d</string>"#;
    let valid = r#"<string name="s">%2$d \u0025\u0031$s</string>"#;
    assert!(
        verify_resources(&files(source, valid), "en", options())
            .unwrap()
            .is_empty()
    );
    let invalid = r#"<string name="s">%1$d %2$d</string>"#;
    let issues = verify_resources(&files(source, invalid), "en", options()).unwrap();
    assert!(issues.iter().any(|i| i.locale == "fr"
        && i.message_id.contains("string/s")
        && i.error.contains("Incompatible argument 1")));
    let invalid_source = r#"<string name="s">%1$!</string>"#;
    assert!(
        !verify_resources(&files(invalid_source, valid), "en", options())
            .unwrap()
            .is_empty()
    );
}

#[test]
fn android_allows_locale_plural_categories_with_other_fallback_and_checks_each_item() {
    let source = r#"<plurals name="p"><item quantity="one">%1$d item</item><item quantity="other">%1$d items</item></plurals>"#;
    let target = r#"<plurals name="p"><item quantity="one">%1$d article</item><item quantity="many">%1$d articles</item><item quantity="other">%1$d articles</item></plurals>"#;
    assert!(
        verify_resources(&files(source, target), "en", options())
            .unwrap()
            .is_empty()
    );
    let target = target.replace("%1$d articles", "%1$s articles");
    let issues = verify_resources(&files(source, &target), "en", options()).unwrap();
    assert!(
        issues
            .iter()
            .any(|i| i.message_id.ends_with("plurals/p/many")
                && i.error.contains("Incompatible argument"))
    );
    assert!(
        verify_resources(&files(source, source), "en", options())
            .unwrap()
            .is_empty()
    );
}

#[test]
fn android_checks_array_items_and_formatting_mode() {
    let source = r#"<string-array name="a"><item>%s</item><item formatted="false">100% raw</item></string-array>"#;
    let target = r#"<string-array name="a"><item>%d</item><item formatted="false">100% brut</item></string-array>"#;
    let issues = verify_resources(&files(source, target), "en", options()).unwrap();
    assert_eq!(issues.len(), 1);
    assert!(issues[0].message_id.ends_with("array/a/0"));
    let issues = verify_resources(
        &files(
            source,
            r#"<string-array name="a"><item>%s</item></string-array>"#,
        ),
        "en",
        options(),
    )
    .unwrap();
    assert!(issues.iter().any(|i| i.error.contains("length changed")));
    let source = r#"<string name="s" formatted="false">%s % broken</string>"#;
    assert!(
        verify_resources(&files(source, source), "en", options())
            .unwrap()
            .is_empty()
    );
    let issues = verify_resources(
        &files(source, r#"<string name="s">%s</string>"#),
        "en",
        options(),
    )
    .unwrap();
    assert!(
        issues
            .iter()
            .any(|i| i.error.contains("formatting mode changed"))
    );
}

#[test]
fn android_groups_resource_files_by_res_directory_not_filename() {
    let files = BTreeMap::from([
        (
            "module/res/values/strings.xml".into(),
            xml(r#"<string name="s">Hello %s</string>"#),
        ),
        (
            "module/res/values-b+sr+Latn/other.xml".into(),
            xml(r#"<string name="s">Zdravo %s</string>"#),
        ),
        (
            "other/res/values/strings.xml".into(),
            xml(r#"<string name="s">%d</string>"#),
        ),
        (
            "other/res/values-b+sr+Latn/strings.xml".into(),
            xml(r#"<string name="s">%d</string>"#),
        ),
    ]);
    assert!(
        verify_resources(&files, "en", options())
            .unwrap()
            .is_empty()
    );
    let mut invalid = files.clone();
    invalid.insert(
        "module/res/values/duplicate.xml".into(),
        xml(r#"<string name="s">Duplicate</string>"#),
    );
    assert!(verify_resources(&invalid, "en", options()).is_err());
    assert!(verify_resources(&BTreeMap::new(), "en", options()).is_err());
}

#[test]
fn android_reports_missing_extra_keys_and_rejects_unsupported_configurations() {
    let files = files(
        r#"<string name="source">hello</string>"#,
        r#"<string name="extra">bonjour</string>"#,
    );
    let issues = verify_resources(&files, "en", options()).unwrap();
    assert!(issues.iter().any(|i| i.error == "Missing translation key"));
    assert!(issues.iter().any(|i| i.error == "Extra translation key"));
    let files = BTreeMap::from([("res/values-fr-night/strings.xml".into(), xml(""))]);
    assert!(verify_resources(&files, "en", options()).is_err());
}

#[test]
fn android_preserves_quoted_whitespace_and_excludes_nontranslatable_keys() {
    let parsed = parse_resource(&xml(
        r#"<string name="trim">  x  </string><string name="quoted">"  x  "</string>"#,
    ))
    .unwrap();
    let Resource::String(trim) = &parsed["string/trim"] else {
        panic!()
    };
    let Resource::String(quoted) = &parsed["string/quoted"] else {
        panic!()
    };
    assert_eq!(trim.text, "x");
    assert_eq!(quoted.text, "  x  ");
    let source = r#"<string name="s" translatable="false">Internal</string>"#;
    assert!(
        verify_resources(&files(source, ""), "en", options())
            .unwrap()
            .is_empty()
    );
}
