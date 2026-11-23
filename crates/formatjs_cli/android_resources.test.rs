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
        plural_categories: false,
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

fn entity_xml(body: &str) -> Vec<u8> {
    format!(r#"<!DOCTYPE resources [<!ENTITY brand "Example"><!ENTITY otherBrand "Example">]><resources>{body}</resources>"#).into_bytes()
}

fn entity_issues(
    source: &str,
    target: &str,
    structural: bool,
) -> Vec<formatjs_cli::android_resources::VerificationIssue> {
    let files = BTreeMap::from([
        ("res/values/strings.xml".into(), entity_xml(source)),
        ("res/values-fr/strings.xml".into(), entity_xml(target)),
    ]);
    verify_resources(
        &files,
        "en",
        VerificationOptions {
            structural_equality: structural,
            ..VerificationOptions::default()
        },
    )
    .unwrap()
}

#[test]
fn android_structural_equality_preserves_entity_names_and_counts() {
    let source = r#"<string name="s">&brand; and &brand;</string>"#;
    for target in [
        r#"<string name="s">Example and Example</string>"#,
        r#"<string name="s">&brand;</string>"#,
        r#"<string name="s">&brand; &brand; &brand;</string>"#,
        r#"<string name="s">&otherBrand; &otherBrand;</string>"#,
    ] {
        assert!(entity_issues(source, target, false).is_empty());
        let issues = entity_issues(source, target, true);
        assert_eq!(issues.len(), 1, "{target}");
        assert!(issues[0].error.contains("entity references changed"));
        assert!(issues[0].message_id.contains("string/s"));
        assert_eq!(issues[0].locale, "fr");
    }
    assert!(
        entity_issues(
            r#"<string name="s">&brand; &otherBrand; &brand;</string>"#,
            r#"<string name="s">&otherBrand; &brand; &brand;</string>"#,
            true
        )
        .is_empty()
    );
}

#[test]
fn android_entities_are_compared_per_array_and_plural_item_with_other_fallback() {
    let source =
        r#"<string-array name="a"><item>&brand;</item><item>&otherBrand;</item></string-array>"#;
    let target =
        r#"<string-array name="a"><item>&otherBrand;</item><item>&brand;</item></string-array>"#;
    let issues = entity_issues(source, target, true);
    assert_eq!(issues.len(), 2);
    assert!(
        issues
            .iter()
            .any(|issue| issue.message_id.ends_with("array/a/0"))
    );
    assert!(
        issues
            .iter()
            .any(|issue| issue.message_id.ends_with("array/a/1"))
    );
    let source = r#"<plurals name="p"><item quantity="one">&brand;</item><item quantity="other">&otherBrand;</item></plurals>"#;
    let target = r#"<plurals name="p"><item quantity="one">&brand;</item><item quantity="many">&otherBrand;</item><item quantity="other">&otherBrand;</item></plurals>"#;
    assert!(entity_issues(source, target, true).is_empty());
    let target = target.replace(
        "quantity=\"many\">&otherBrand;",
        "quantity=\"many\">&brand;",
    );
    let issues = entity_issues(source, &target, true);
    assert_eq!(issues.len(), 1);
    assert!(issues[0].message_id.ends_with("plurals/p/many"));
}

#[test]
fn android_entity_spelling_check_ignores_cdata_comments_and_predefined_references() {
    let source = r#"<string name="s"><![CDATA[&brand;]]><!-- &brand; -->&amp;brand; &apos; &quot; &#160; &#xA0;</string>"#;
    let target =
        r#"<string name="s">"&amp;brand; &amp;brand; &apos; &quot; &#xA0; &#160;"</string>"#;
    // Quote apostrophes in both values to satisfy Android syntax independently.
    let source = source.replace("&apos;", "\\&apos;");
    let target = target.replace("&apos;", "\\&apos;");
    assert!(entity_issues(&source, &target, true).is_empty());
    let source = r#"<string name="s" formatted="false">100% &brand;</string>"#;
    assert_eq!(
        entity_issues(
            source,
            r#"<string name="s" formatted="false">100% Example</string>"#,
            true
        )
        .len(),
        1
    );
    let source = r#"<string name="s"><annotation value="&brand;">text</annotation></string>"#;
    let target = r#"<string name="s"><annotation value="&otherBrand;">text</annotation></string>"#;
    assert_eq!(entity_issues(source, target, true).len(), 1);
}

#[test]
fn android_markup_preserves_tags_attributes_counts_and_nesting() {
    let source = r##"<string name="s" formatted="false"><b><i>100%</i></b><font color="#fff" size="12">Hello</font></string>"##;
    let target = r##"<string name="s" formatted="false"><font size="12" color="#fff">Bonjour</font><b><i>100%</i></b></string>"##;
    assert!(entity_issues(source, target, true).is_empty());
    for invalid in [
        target.replace("<b><i>100%</i></b>", "<b>100%</b>"),
        target.replace("<b><i>100%</i></b>", "<i><b>100%</b></i>"),
        target.replace("#fff", "#000"),
        target.replace(" size=\"12\"", ""),
        target.replace("<i>100%</i>", "<i>100%</i><i>100%</i>"),
    ] {
        assert!(entity_issues(source, &invalid, false).is_empty());
        let issues = entity_issues(source, &invalid, true);
        assert_eq!(issues.len(), 1, "{invalid}: {issues:?}");
        assert!(issues[0].error.contains("markup changed"));
        assert_eq!(issues[0].locale, "fr");
        assert!(issues[0].message_id.ends_with("string/s/"));
    }
}

#[test]
fn android_markup_ignores_xliff_wrappers_and_xml_prefix_spelling() {
    let source = r#"<string name="s" xmlns:x="urn:oasis:names:tc:xliff:document:1.2" xmlns:a="urn:test"><b a:role="title"><x:g id="person">%1$s</x:g></b><i>Hi</i></string>"#;
    let target = r#"<string name="s" xmlns:y="urn:oasis:names:tc:xliff:document:1.2" xmlns:z="urn:test"><y:g id="salutation"><i>Salut</i></y:g><b z:role="title">%1$s</b></string>"#;
    assert!(entity_issues(source, target, true).is_empty());
    for invalid in [
        target.replace("urn:test", "urn:other"),
        target.replace("<i>Salut</i>", "<g>Salut</g>"),
        target.replace("z:role=\"title\"", "z:role=\"body\""),
    ] {
        let issues = entity_issues(source, &invalid, true);
        assert_eq!(issues.len(), 1);
        assert!(issues[0].error.contains("markup changed"));
    }
    // Escaped HTML and CDATA are text, not native styling spans.
    assert!(
        entity_issues(
            r#"<string name="s">&lt;b&gt;Hi&lt;/b&gt;</string>"#,
            r#"<string name="s"><![CDATA[<i>Salut</i>]]></string>"#,
            true,
        )
        .is_empty()
    );
}

#[test]
fn android_resource_references_preserve_targets_and_literal_distinction() {
    for reference in [
        "@string/name",
        "@android:string/ok",
        "@com.example:string/name",
        "@*com.example:string/name",
        "@+id/name",
        "@null",
        "@empty",
        "?attr/name",
        "?android:attr/name",
    ] {
        let source = format!(r#"<string name="s" formatted="false"> {reference} </string>"#);
        assert!(entity_issues(&source, &source, true).is_empty());
        for literal in [
            format!("\\{reference}"),
            format!("\"{reference}\""),
            "translated".into(),
        ] {
            let target = format!(r#"<string name="s" formatted="false">{literal}</string>"#);
            assert!(entity_issues(&source, &target, false).is_empty());
            for (before, after) in [(&source, &target), (&target, &source)] {
                let issues = entity_issues(before, after, true);
                assert_eq!(issues.len(), 1, "{before}: {after}: {issues:?}");
                assert!(issues[0].error.contains("resource reference changed"));
            }
        }
    }
    for (source, target) in [
        ("@string/name", "@string/other"),
        ("@android:string/name", "@string/name"),
        ("?attr/name", "@attr/name"),
        ("@null", "@empty"),
    ] {
        let source = format!(r#"<string name="s">{source}</string>"#);
        let target = format!(r#"<string name="s">{target}</string>"#);
        let issues = entity_issues(&source, &target, true);
        assert_eq!(issues.len(), 1);
        assert!(issues[0].error.contains("resource reference changed"));
    }
}

#[test]
fn android_resource_reference_detection_precedes_android_unescaping() {
    for (source, target) in [
        ("?name", "?attr/name"),
        ("?android:name", "?android:attr/name"),
        ("&#64;string/name", "@string/name"),
        ("<![CDATA[@string/name]]>", "@string/name"),
        ("@string/<!-- comment -->name", "@string/name"),
        (r#"\@string/name"#, r#""@string/name""#),
        (r#"\u0040string/name"#, r#"\@string/name"#),
        ("<b>@string/name</b>", "<b>Salut</b>"),
        ("email@example.com", "adresse@example.fr"),
        ("@string/name suffix", "translated"),
        ("ordinary", "短文"),
    ] {
        let source = format!(r#"<string name="s">{source}</string>"#);
        let target = format!(r#"<string name="s">{target}</string>"#);
        assert!(
            entity_issues(&source, &target, true).is_empty(),
            "{source}: {target}"
        );
    }
    let source = r#"<string name="s">\u0040string/name</string>"#;
    let target = r#"<string name="s">@string/name</string>"#;
    let issues = entity_issues(source, target, true);
    assert_eq!(issues.len(), 1);
    assert!(issues[0].error.contains("resource reference changed"));
}

#[test]
fn android_markup_and_references_are_compared_per_array_and_plural_item() {
    let source = r#"<string-array name="a"><item><b>One</b></item><item>@string/name</item></string-array><plurals name="p"><item quantity="other"><i>%1$d</i></item></plurals>"#;
    let target = r#"<string-array name="a"><item>Un</item><item>@string/other</item></string-array><plurals name="p"><item quantity="many"><b>%1$d</b></item><item quantity="other"><i>%1$d</i></item></plurals>"#;
    let issues = entity_issues(source, target, true);
    assert_eq!(issues.len(), 3);
    for (suffix, error) in [
        ("array/a/0", "markup changed"),
        ("array/a/1", "resource reference changed"),
        ("plurals/p/many", "markup changed"),
    ] {
        assert!(
            issues
                .iter()
                .any(|issue| issue.message_id.ends_with(suffix) && issue.error.contains(error)),
            "{issues:?}"
        );
    }
}

#[test]
fn android_resource_references_resolve_package_namespace_prefixes() {
    for (source, target) in [
        (
            r#"<string name="s" xmlns:a="http://schemas.android.com/apk/res/android">@a:string/ok</string>"#,
            r#"<string name="s">@android:string/ok</string>"#,
        ),
        (
            r#"<string name="s" xmlns:a="http://schemas.android.com/apk/res-auto">@a:string/name</string>"#,
            r#"<string name="s">@string/name</string>"#,
        ),
        (
            r#"<string name="s" xmlns:a="http://schemas.android.com/apk/res/com.example">@*a:string/name</string>"#,
            r#"<string name="s">@*com.example:string/name</string>"#,
        ),
        (
            r#"<string name="s" xmlns:a="http://schemas.android.com/apk/res/android">?a:name</string>"#,
            r#"<string name="s">?android:attr/name</string>"#,
        ),
        (
            r#"<string name="s" xmlns:x="urn:oasis:names:tc:xliff:document:1.2"><x:g id="alias">@string/name</x:g></string>"#,
            r#"<string name="s">@string/name</string>"#,
        ),
    ] {
        assert!(
            entity_issues(source, target, true).is_empty(),
            "{source}: {target}"
        );
    }
    let source = r#"<string name="s" xmlns:a="http://schemas.android.com/apk/res/android">@a:string/ok</string>"#;
    let target = source.replace("/res/android", "/res/com.example");
    let issues = entity_issues(source, &target, true);
    assert_eq!(issues.len(), 1);
    assert!(issues[0].error.contains("resource reference changed"));
}

fn plurals(quantities: &[&str]) -> String {
    let items: String = quantities
        .iter()
        .map(|quantity| format!(r#"<item quantity="{quantity}">%d {quantity}</item>"#))
        .collect();
    format!(r#"<plurals name="count">{items}</plurals>"#)
}

fn plural_issues(directory: &str, quantities: &[&str], enabled: bool) -> Vec<(String, String)> {
    let files = BTreeMap::from([
        (
            "res/values/strings.xml".into(),
            xml(&plurals(&["one", "other"])),
        ),
        (
            format!("res/{directory}/strings.xml").into(),
            xml(&plurals(quantities)),
        ),
    ]);
    verify_resources(
        &files,
        "en",
        VerificationOptions {
            plural_categories: enabled,
            ..VerificationOptions::default()
        },
    )
    .unwrap()
    .into_iter()
    .map(|issue| (issue.locale, issue.message_id))
    .collect()
}

#[test]
fn android_plural_categories_reject_quantities_the_locale_never_selects() {
    let six = ["zero", "one", "two", "few", "many", "other"];
    let unused = |locale: &str, quantities: &[&str]| {
        quantities
            .iter()
            .map(|quantity| (locale.to_string(), format!("res: plurals/count/{quantity}")))
            .collect::<Vec<_>>()
    };
    assert_eq!(
        plural_issues("values-es", &six, true),
        unused("es", &["few", "two", "zero"])
    );
    assert_eq!(
        plural_issues("values-pt-rBR", &six, true),
        unused("pt-BR", &["few", "two", "zero"])
    );
    assert_eq!(
        plural_issues("values-ja", &["one", "other"], true),
        unused("ja", &["one"])
    );
    assert_eq!(
        plural_issues("values-b+sr+Latn", &six, true),
        unused("sr-Latn", &["many", "two", "zero"])
    );
    assert_eq!(
        plural_issues("values-iw", &six, true),
        unused("he", &["few", "many", "zero"])
    );
    assert_eq!(
        plural_issues("values-vi", &["one", "other"], true),
        unused("vi", &["one"])
    );
    assert_eq!(
        plural_issues("values-gl", &["one", "many", "other"], true),
        unused("gl", &["many"])
    );
    assert!(plural_issues("values-ar", &six, true).is_empty());
    assert!(plural_issues("values-ja", &["one", "other"], false).is_empty());
}

#[test]
fn android_plural_categories_check_the_source_and_skip_unknown_languages() {
    let files = BTreeMap::from([
        (
            "res/values/strings.xml".into(),
            xml(&plurals(&["one", "few", "other"])),
        ),
        (
            "res/values-qaa/strings.xml".into(),
            xml(&plurals(&["one", "few", "other"])),
        ),
    ]);
    let issues = verify_resources(
        &files,
        "en",
        VerificationOptions {
            plural_categories: true,
            ..VerificationOptions::default()
        },
    )
    .unwrap();
    assert_eq!(issues.len(), 1);
    assert_eq!(issues[0].locale, "en");
    assert_eq!(issues[0].message_id, "res: plurals/count/few");
    assert!(issues[0].error.contains("allowed: one, other"));
}
