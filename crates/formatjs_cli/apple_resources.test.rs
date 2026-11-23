use formatjs_cli::apple_resources::VerificationOptions;
use formatjs_cli::apple_resources::{parse_resource, verify_resources};
use formatjs_cli::verify::{MessageSyntax, verify_with_syntax};
use serde_json::json;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

#[test]
fn reads_native_strings_escapes_comments_and_utf16() {
    let text = r#"/* Permission explanation */
"NSCameraUsageDescription" = "Attach \"photos\" \UD83D\UDE00\n\101"; bare = Value;"#;
    let entries = parse_resource(Path::new("InfoPlist.strings"), text.as_bytes()).unwrap();
    assert_eq!(
        entries["NSCameraUsageDescription"].value,
        "Attach \"photos\" 😀\nA"
    );
    assert_eq!(
        entries["NSCameraUsageDescription"].description,
        "Permission explanation"
    );
    assert_eq!(entries["bare"].value, "Value");
    for little_endian in [true, false] {
        let mut data = if little_endian {
            vec![0xff, 0xfe]
        } else {
            vec![0xfe, 0xff]
        };
        for unit in text.encode_utf16() {
            data.extend(if little_endian {
                unit.to_le_bytes()
            } else {
                unit.to_be_bytes()
            });
        }
        assert_eq!(
            parse_resource(Path::new("InfoPlist.strings"), &data).unwrap(),
            entries
        );
    }
}

#[test]
fn rejects_duplicate_or_malformed_native_resources() {
    for text in [
        "\"key\"=\"one\";\"key\"=\"two\";",
        "\"key\"=\"unterminated",
        "\"key\"=\"\\UD800\";",
        "\"key\"=\"value\"",
        "/* unfinished",
    ] {
        assert!(
            parse_resource(Path::new("Localizable.strings"), text.as_bytes()).is_err(),
            "{text}"
        );
    }
    for text in [
        "<plist><dict><key>a</key><dict/><key>a</key><dict/></dict></plist>",
        "<plist><dict><key>a</key><dict><key>v</key><string>a</string><key>v</key><string>b</string></dict></dict></plist>",
        "<plist><dict><key>a</key><string>wrong type</string></dict></plist>",
        "<plist><dict><key>a</key></dict></plist>",
        "<plist><dict/><dict/></plist>",
    ] {
        assert!(
            parse_resource(Path::new("Localizable.stringsdict"), text.as_bytes()).is_err(),
            "{text}"
        );
    }
}

fn plural(one: &str, other: &str, kind: &str) -> Vec<u8> {
    format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><!-- Count for recipient --><key>items</key><dict>
<key>NSStringLocalizedFormatKey</key><string>%@ and %#@count@</string>
<key>count</key><dict><key>NSStringFormatSpecTypeKey</key><string>NSStringPluralRuleType</string>
<key>NSStringFormatValueTypeKey</key><string>{kind}</string>
<key>one</key><string>{one}</string><key>other</key><string>{other}</string>
</dict></dict></dict></plist>"#).into_bytes()
}

fn options() -> VerificationOptions {
    VerificationOptions {
        missing_keys: true,
        extra_keys: true,
        structural_equality: true,
    }
}

#[test]
fn verifies_native_compound_plurals_and_separate_table_namespaces() {
    let mut files = BTreeMap::from([
        (
            PathBuf::from("First/en.lproj/Localizable.stringsdict"),
            plural("One item", "%d items", "d"),
        ),
        (
            PathBuf::from("First/fr.lproj/Localizable.stringsdict"),
            plural("Un article", "%2$d articles", "d"),
        ),
        (
            PathBuf::from("Second/en.lproj/Localizable.strings"),
            br#""items"="Hello %@";"#.to_vec(),
        ),
        (
            PathBuf::from("Second/fr.lproj/Localizable.strings"),
            br#""items"="Bonjour %1$@";"#.to_vec(),
        ),
    ]);
    assert!(
        verify_resources(&files, Some("en"), options())
            .unwrap()
            .is_empty()
    );
    files.insert(
        PathBuf::from("First/fr.lproj/Localizable.stringsdict"),
        plural("Un article", "%2$s articles", "d"),
    );
    let issues = verify_resources(&files, Some("en"), options()).unwrap();
    assert!(
        issues
            .iter()
            .any(|issue| issue.locale == "fr" && issue.error.contains("argument")),
        "{issues:?}"
    );
    assert!(verify_resources(&files, None, options()).is_err());
}

#[test]
fn prefers_plural_entries_over_plain_fallbacks_and_rejects_unbound_variables() {
    let files = BTreeMap::from([
        (
            PathBuf::from("en.lproj/Localizable.stringsdict"),
            plural("one", "%d items", "d"),
        ),
        (
            PathBuf::from("en.lproj/Localizable.strings"),
            br#""items"="duplicate";"#.to_vec(),
        ),
    ]);
    let mut files = files;
    files.insert(
        PathBuf::from("fr.lproj/Localizable.stringsdict"),
        plural("un", "%d articles", "d"),
    );
    assert!(
        verify_resources(&files, Some("en"), options())
            .unwrap()
            .is_empty()
    );
    files.insert(
        PathBuf::from("fr.lproj/Localizable.stringsdict"),
        plural("un", "%s articles", "d"),
    );
    assert!(
        !verify_resources(&files, Some("en"), options())
            .unwrap()
            .is_empty()
    );
    let invalid = json!({"NSStringLocalizedFormatKey":"%#@missing@", "count":{}});
    assert!(formatjs_cli::apple_resources::plural_localization(&invalid).is_err());
}

#[test]
fn cli_dispatches_apple_verification_to_native_files() {
    let directory = tempfile::tempdir().unwrap();
    for (locale, text) in [("en", "Hello %@"), ("fr", "Bonjour %1$@")] {
        let path = directory
            .path()
            .join(format!("{locale}.lproj/InfoPlist.strings"));
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, format!("\"purpose\" = {text:?};")).unwrap();
    }
    let pattern = directory.path().join("**/*.strings");
    let run = || {
        verify_with_syntax(
            &[pattern.clone()],
            Some("en"),
            &[],
            true,
            true,
            true,
            false,
            MessageSyntax::ApplePrintf,
        )
    };
    run().unwrap();
    std::fs::write(
        directory.path().join("fr.lproj/InfoPlist.strings"),
        "\"purpose\"=\"Wrong %s\";",
    )
    .unwrap();
    assert!(run().is_err());
}

#[test]
fn verifies_empty_locale_missing_keys_and_extra_keys_per_table() {
    let files = BTreeMap::from([
        (
            PathBuf::from("en.lproj/Localizable.strings"),
            br#""hello"="Hello";"#.to_vec(),
        ),
        (PathBuf::from("fr.lproj/Localizable.strings"), Vec::new()),
        (
            PathBuf::from("de.lproj/Localizable.strings"),
            br#""hello"="Hallo"; "extra"="Extra";"#.to_vec(),
        ),
        (
            PathBuf::from("en.lproj/InfoPlist.strings"),
            br#""name"="App";"#.to_vec(),
        ),
        (
            PathBuf::from("ja.lproj/InfoPlist.strings"),
            br#""name"="App";"#.to_vec(),
        ),
    ]);
    let issues = verify_resources(&files, Some("en"), options()).unwrap();
    assert_eq!(issues.len(), 2, "{issues:?}");
    assert!(
        issues
            .iter()
            .any(|issue| issue.locale == "fr" && issue.error == "Missing translation key")
    );
    assert!(
        issues
            .iter()
            .any(|issue| issue.locale == "de" && issue.error == "Extra translation key")
    );
}
