use formatjs_intl_data::decode;
use formatjs_intl_pluralrules::LocaleRules;
use std::{fs, path::PathBuf, process::Command};

#[test]
fn rust_compiler_selects_parent_locale_and_rejects_missing_data() {
    let temp = PathBuf::from(std::env::var("TEST_TMPDIR").unwrap()).join("compiled locale records");
    fs::create_dir_all(&temp).unwrap();
    let runfiles = PathBuf::from(std::env::var("TEST_SRCDIR").unwrap())
        .join(std::env::var("TEST_WORKSPACE").unwrap());
    let tool = runfiles.join("crates/intl_pluralrules/compile_locales");
    let english = runfiles.join("crates/intl_pluralrules/locale-data/en.json");
    let french = runfiles.join("crates/intl_pluralrules/locale-data/fr.json");
    let run = |locale: &str, name: &str| {
        let directory = temp.join(name);
        fs::create_dir_all(&directory).unwrap();
        let result = Command::new(&tool)
            .arg("--input")
            .arg(&english)
            .args([
                "--known-locale",
                "en",
                "--known-locale",
                "fr",
                "--known-locale",
                "aa",
            ])
            .arg("--input")
            .arg(&french)
            .arg("--module")
            .arg(directory.join("locales.rs"))
            .arg("--packs")
            .arg(directory.join("packs"))
            .args(["--type", "crate::LocaleRules", "--locale", locale])
            .output()
            .unwrap();
        (result, directory)
    };
    let (result, directory) = run("FR-ca", "french");
    assert!(
        result.status.success(),
        "{}",
        String::from_utf8_lossy(&result.stderr)
    );
    assert!(!directory.join("packs/en.cbor").exists());
    let rules: LocaleRules = decode(&fs::read(directory.join("packs/fr.cbor")).unwrap()).unwrap();
    assert_eq!(rules.locale(), "fr");
    assert_eq!(rules.select_rounded("0", 0, false).unwrap(), "one");
    assert_eq!(rules.select_rounded("2", 0, false).unwrap(), "other");
    let fallback = temp.join("fallback");
    fs::create_dir_all(&fallback).unwrap();
    let output = Command::new(&tool)
        .arg("--input")
        .arg(&english)
        .args([
            "--known-locale",
            "aa",
            "--locale",
            "aa",
            "--type",
            "crate::LocaleRules",
        ])
        .arg("--module")
        .arg(fallback.join("locales.rs"))
        .arg("--packs")
        .arg(fallback.join("packs"))
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let rules: LocaleRules = decode(&fs::read(fallback.join("packs/en.cbor")).unwrap()).unwrap();
    assert_eq!(rules.select_rounded("0", 0, false).unwrap(), "other");
    for locale in ["zz", "en_US"] {
        let (result, directory) = run(locale, locale);
        assert!(!result.status.success());
        assert!(!directory.join("locales.rs").exists());
    }
}

#[test]
fn locale_selection_preserves_script_and_region() {
    let available = ["zh", "zh-Hans", "zh-Hant", "zh-Hant-HK"].map(str::to_owned);
    assert_eq!(
        formatjs_intl_data_build::select_locale(&available, "zh-TW").unwrap(),
        "zh-Hant"
    );
    assert_eq!(
        formatjs_intl_data_build::select_locale(&available, "zh-HK").unwrap(),
        "zh-Hant-HK"
    );
    assert!(formatjs_intl_data_build::select_locale(&available, "zz").is_err());
}
