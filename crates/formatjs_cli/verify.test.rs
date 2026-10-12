use formatjs_cli::verify::*;
use serde_json::Value;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_extract_keys() {
    let source = json!({"a":"value","b":{"c":"value2","d":{"e":"value3"}}});
    assert!(verify_missing_keys(
        &HashMap::from([("en".into(), source.clone()), ("fr".into(), source)]),
        "en"
    ));
    let missing = json!({"a":"value","b":{"c":"value2","d":{}}});
    assert!(!verify_missing_keys(
        &HashMap::from([
            ("en".into(), json!({"b":{"d":{"e":"value"}}})),
            ("fr".into(), missing)
        ]),
        "en"
    ));
}

#[test]
fn test_extract_keys_empty_object() {
    assert!(verify_missing_keys(
        &HashMap::from([("en".into(), json!({})), ("fr".into(), json!({}))]),
        "en"
    ));
}

#[test]
fn test_extract_keys_flat_object() {
    let source = json!({"a":"A","b":"B"});
    assert!(verify_missing_keys(
        &HashMap::from([("en".into(), source.clone()), ("fr".into(), source.clone())]),
        "en"
    ));
    assert!(!verify_missing_keys(
        &HashMap::from([("en".into(), source), ("fr".into(), json!({"a":"A"}))]),
        "en"
    ));
}

#[test]
fn test_flatten() {
    let source = json!({"a":"{name}","b":{"c":"{count, number}"}});
    let target = json!({"a":"Hola {name}","b.c":"{count, number}"});
    assert!(verify_structure(
        &HashMap::from([("en".into(), source), ("fr".into(), target)]),
        "en"
    ));
}

#[test]
fn test_flatten_ignores_non_string_values() {
    let source = json!({"string":"value","number":42,"array":[1,2,3],"null":null,"bool":true,"nested":{"valid":"nested_value","invalid":123}});
    let target = json!({"string":"translation","number":"{invalid","array":"{invalid","nested":{"valid":"translated","invalid":"{invalid"}});
    assert!(verify_structure(
        &HashMap::from([("en".into(), source), ("fr".into(), target)]),
        "en"
    ));
}

#[test]
fn test_flatten_empty_object() {
    assert!(verify_structure(
        &HashMap::from([("en".into(), json!({})), ("fr".into(), json!({}))]),
        "en"
    ));
}

#[test]
fn test_extract_locale_from_path() {
    for locale in ["en", "fr-FR"] {
        assert_locale_filename(locale);
    }
}

#[test]
fn test_extract_locale_from_path_complex() {
    for locale in ["zh-Hans-CN", "pt-BR"] {
        assert_locale_filename(locale);
    }
}

#[test]
fn test_should_ignore() {
    assert_ignore_patterns(
        &["**/node_modules/**", "**/*test*/**", "**/*test*.json"],
        &["node_modules/fr.json", "test/fr.json", "test_file.json"],
    );
}

#[test]
fn test_should_ignore_empty_patterns() {
    let directory = tempfile::tempdir().unwrap();
    let source = directory.path().join("en.json");
    fs::write(&source, "{}").unwrap();
    assert!(verify(&[source], Some("en"), &[], true, true, true, false).is_ok());
}

#[test]
fn test_verify_missing_keys() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello",
            "farewell": "Goodbye",
            "nested": {
                "key": "value"
            }
        }),
    );
    locales.insert(
        "es".to_string(),
        json!({
            "greeting": "Hola",
            "farewell": "Adiós",
            "nested": {
                "key": "valor"
            }
        }),
    );

    assert!(verify_missing_keys(&locales, "en"));
}

#[test]
fn test_check_missing_keys_with_missing() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello",
            "farewell": "Goodbye",
            "extra": "Extra key"
        }),
    );
    locales.insert(
        "es".to_string(),
        json!({
            "greeting": "Hola"
        }),
    );

    assert!(!verify_missing_keys(&locales, "en"));
}

#[test]
fn test_verify_extra_keys() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello",
            "farewell": "Goodbye"
        }),
    );
    locales.insert(
        "es".to_string(),
        json!({
            "greeting": "Hola",
            "farewell": "Adiós"
        }),
    );

    assert!(verify_extra_keys(&locales, "en"));
}

#[test]
fn test_check_extra_keys_with_extra() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello"
        }),
    );
    locales.insert(
        "es".to_string(),
        json!({
            "greeting": "Hola",
            "extra_key": "Extra value",
            "another_extra": "Another"
        }),
    );

    assert!(!verify_extra_keys(&locales, "en"));
}

#[test]
fn test_compare_message_structure_identical() {
    let source = "Hello {name}!";
    let target = "Hola {name}!";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
    assert!(!diagnostics(&result).contains("Some checks failed"));
}

#[test]
fn test_compare_message_structure_same_structure_different_text() {
    let source = "You have {count} items";
    let target = "Tienes {count} artículos";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_plural() {
    let source = "You have {count, plural, one {# item} other {# items}}";
    let target = "Tienes {count, plural, one {# artículo} other {# artículos}}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_missing_variable() {
    let source = "Hello {name}!";
    let target = "Hello!";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), false);
    assert!(!result.status.success());
    assert!(diagnostics(&result).contains("name"));
}

#[test]
fn test_compare_message_structure_different_variable_name() {
    let source = "Hello {name}!";
    let target = "Hello {username}!";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), false);
    assert!(!result.status.success());
}

#[test]
fn test_compare_message_structure_type_mismatch() {
    let source = "{count, plural, one {# item} other {# items}}";
    let target = "{count} items";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), false);
    assert!(!result.status.success());
    let error_msg = diagnostics(&result);
    assert!(error_msg.contains("count"));
    assert!(error_msg.contains("type"));
}

#[test]
fn test_compare_message_structure_date_format() {
    let source = "Today is {date, date, short}";
    let target = "Hoy es {date, date, short}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_date_type_mismatch() {
    let source = "Today is {date, date, short}";
    let target = "Today is {date}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), false);
    assert!(!result.status.success());
}

#[test]
fn test_compare_message_structure_number_format() {
    let source = "Price: {price, number, ::currency/USD}";
    let target = "Precio: {price, number, ::currency/USD}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_select() {
    let source = "{gender, select, male {He} female {She} other {They}}";
    let target = "{gender, select, male {Él} female {Ella} other {Ellos}}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_multiple_variables() {
    let source = "Hello {firstName} {lastName}! You have {count} messages.";
    let target = "Hola {firstName} {lastName}! Tienes {count} mensajes.";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_multiple_variables_missing_one() {
    let source = "Hello {firstName} {lastName}! You have {count} messages.";
    let target = "Hola {firstName}! Tienes {count} mensajes.";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), false);
    assert!(!result.status.success());
}

#[test]
fn test_compare_message_structure_complex_nested() {
    // Use # instead of {count} inside plural branches
    let source = "{count, plural, one {You have # {itemType, select, photo {photo} video {video} other {item}}} other {You have # {itemType, select, photo {photos} video {videos} other {items}}}}";
    let target = "{count, plural, one {Tienes # {itemType, select, photo {foto} video {video} other {artículo}}} other {Tienes # {itemType, select, photo {fotos} video {videos} other {artículos}}}}";
    let result = verify_pair(source, target);
    assert_eq!(result.status.success(), true);
}

#[test]
fn test_compare_message_structure_invalid_source() {
    let source = "Hello {name";
    let target = "Hola {name}";
    let result = verify_pair(source, target);
    assert!(!result.status.success());
}

#[test]
fn test_compare_message_structure_invalid_target() {
    let source = "Hello {name}";
    let target = "Hola {name";
    let result = verify_pair(source, target);
    assert!(!result.status.success());
}

#[test]
fn test_verify_structure() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello {name}!",
            "count": "You have {count, plural, one {# item} other {# items}}"
        }),
    );
    locales.insert(
        "es".to_string(),
        json!({
            "greeting": "Hola {name}!",
            "count": "Tienes {count, plural, one {# artículo} other {# artículos}}"
        }),
    );

    assert!(verify_structure(&locales, "en"));
}

#[test]
fn test_check_structural_equality_with_errors() {
    let mut locales = HashMap::new();
    locales.insert(
        "en".to_string(),
        json!({
            "greeting": "Hello {name}!",
            "count": "You have {count, plural, one {# item} other {# items}}"
        }),
    );
    locales.insert(
        "fr".to_string(),
        json!({
            "greeting": "Bonjour {username}!",
            "count": "Vous avez {count} articles"
        }),
    );

    assert!(!verify_structure(&locales, "en"));
}

#[test]
fn test_verify_with_brace_expansion_glob() {
    use tempfile::tempdir;

    let dir = tempdir().unwrap();
    let lang = dir.path().join("lang");
    std::fs::create_dir_all(&lang).unwrap();

    // Create source and target locale files
    std::fs::write(
        lang.join("en.json"),
        json!({
            "greeting": "Hello {name}!",
            "farewell": "Goodbye!"
        })
        .to_string(),
    )
    .unwrap();
    std::fs::write(
        lang.join("es.json"),
        json!({
            "greeting": "Hola {name}!",
            "farewell": "Adiós!"
        })
        .to_string(),
    )
    .unwrap();

    // Also create a .txt file that should NOT be matched
    std::fs::write(lang.join("notes.txt"), "not a translation file").unwrap();

    // Use brace expansion glob
    let pattern = PathBuf::from(format!("{}/**/*.{{json}}", dir.path().display()));

    let result = verify(&[pattern], Some("en"), &[], true, true, false, true);

    assert!(result.is_ok());
}

#[test]
fn test_verify_with_nested_directory_glob() {
    use tempfile::tempdir;

    let dir = tempdir().unwrap();

    // Create nested locale directories
    let en_dir = dir.path().join("locales/en");
    let fr_dir = dir.path().join("locales/fr");
    std::fs::create_dir_all(&en_dir).unwrap();
    std::fs::create_dir_all(&fr_dir).unwrap();

    std::fs::write(
        en_dir.join("en.json"),
        json!({"greeting": "Hello!"}).to_string(),
    )
    .unwrap();
    std::fs::write(
        fr_dir.join("fr.json"),
        json!({"greeting": "Bonjour!"}).to_string(),
    )
    .unwrap();

    let pattern = PathBuf::from(format!("{}/**/*.json", dir.path().display()));

    let result = verify(&[pattern], Some("en"), &[], true, true, false, true);

    assert!(result.is_ok());
}

#[test]
fn test_verify_with_literal_file_paths() {
    use tempfile::tempdir;

    let dir = tempdir().unwrap();

    std::fs::write(
        dir.path().join("en.json"),
        json!({"greeting": "Hello!"}).to_string(),
    )
    .unwrap();
    std::fs::write(
        dir.path().join("es.json"),
        json!({"greeting": "Hola!"}).to_string(),
    )
    .unwrap();

    // Pass literal file paths (no globs)
    let result = verify(
        &[dir.path().join("en.json"), dir.path().join("es.json")],
        Some("en"),
        &[],
        true,
        true,
        false,
        true,
    );

    assert!(result.is_ok());
}

#[test]
fn test_should_ignore_with_glob_patterns() {
    assert_ignore_patterns(
        &["**/node_modules/**", "**/*.bak"],
        &["node_modules/pkg/fr.json", "fr.bak"],
    );
}

fn verify_catalogs(
    locales: &HashMap<String, Value>,
    source: &str,
    missing: bool,
    extra: bool,
    structure: bool,
) -> bool {
    let directory = tempfile::tempdir().unwrap();
    let files: Vec<_> = locales
        .iter()
        .map(|(locale, messages)| {
            let path = directory.path().join(format!("{locale}.json"));
            std::fs::write(&path, serde_json::to_vec(messages).unwrap()).unwrap();
            path
        })
        .collect();
    let mut process = std::process::Command::new(std::env::var("FORMATJS_TEST_CLI").unwrap());
    process
        .arg("verify")
        .args(&files)
        .args(["--source-locale", source]);
    if missing {
        process.arg("--missing-keys");
    }
    if extra {
        process.arg("--extra-keys");
    }
    if structure {
        process.arg("--structural-equality");
    }
    process.output().unwrap().status.success()
}
fn verify_missing_keys(locales: &HashMap<String, Value>, source: &str) -> bool {
    verify_catalogs(locales, source, true, false, false)
}
fn verify_extra_keys(locales: &HashMap<String, Value>, source: &str) -> bool {
    verify_catalogs(locales, source, false, true, false)
}
fn verify_structure(locales: &HashMap<String, Value>, source: &str) -> bool {
    verify_catalogs(locales, source, false, false, true)
}
fn verify_pair(source: &str, target: &str) -> std::process::Output {
    let directory = tempfile::tempdir().unwrap();
    let en = directory.path().join("en.json");
    let fr = directory.path().join("fr.json");
    std::fs::write(&en, serde_json::to_vec(&json!({"message":source})).unwrap()).unwrap();
    std::fs::write(&fr, serde_json::to_vec(&json!({"message":target})).unwrap()).unwrap();
    std::process::Command::new(std::env::var("FORMATJS_TEST_CLI").unwrap())
        .arg("verify")
        .arg(en)
        .arg(fr)
        .args(["--source-locale", "en", "--structural-equality"])
        .output()
        .unwrap()
}
fn diagnostics(output: &std::process::Output) -> String {
    format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    )
}
fn assert_locale_filename(locale: &str) {
    let directory = tempfile::tempdir().unwrap();
    let nested = directory.path().join("deep/locales");
    std::fs::create_dir_all(&nested).unwrap();
    let source = nested.join(format!("{locale}.json"));
    std::fs::write(&source, "{}").unwrap();
    assert!(verify(&[source], Some(locale), &[], true, true, true, false).is_ok());
}
fn assert_ignore_patterns(patterns: &[&str], ignored: &[&str]) {
    let directory = tempfile::tempdir().unwrap();
    let source = directory.path().join("en.json");
    std::fs::write(&source, "{}").unwrap();
    let mut files = vec![source];
    for name in ignored {
        let path = directory.path().join(name);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, "invalid JSON").unwrap();
        files.push(path);
    }
    assert!(
        verify(
            &files,
            Some("en"),
            &patterns.iter().map(|s| s.to_string()).collect::<Vec<_>>(),
            true,
            true,
            true,
            false
        )
        .is_ok()
    );
    assert!(verify(&files, Some("en"), &[], true, true, true, false).is_err());
}
