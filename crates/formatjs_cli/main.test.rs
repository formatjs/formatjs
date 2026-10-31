use std::process::Command;

#[test]
fn command_help_exposes_all_commands() {
    let binary = std::env::var("FORMATJS_TEST_CLI").expect("CLI test binary");
    for command in [None, Some("extract"), Some("compile"), Some("verify")] {
        let mut process = Command::new(&binary);
        if let Some(command) = command {
            process.arg(command);
        }
        let output = process.arg("--help").output().unwrap();
        assert!(output.status.success());
        let help = String::from_utf8(output.stdout).unwrap();
        assert!(help.contains(command.unwrap_or("formatjs")));
    }
}

#[test]
fn java_printf_verify_cli_reports_source_and_translation_errors() {
    let directory = tempfile::tempdir().unwrap();
    let source = directory.path().join("en.json");
    let target = directory.path().join("fr.json");
    std::fs::write(&source, r#"{"message":"Hello %s, %2$d"}"#).unwrap();
    std::fs::write(&target, r#"{"message":"%2$d pour %1$s %<s"}"#).unwrap();
    let run = |syntax: &str| {
        Command::new(std::env::var("FORMATJS_TEST_CLI").unwrap())
            .args([
                "verify",
                "--source-locale",
                "en",
                "--structural-equality",
                "--message-syntax",
                syntax,
            ])
            .arg(&source)
            .arg(&target)
            .output()
            .unwrap()
    };
    assert!(run("java-printf").status.success());
    std::fs::write(&target, r#"{"message":"%1$d"}"#).unwrap();
    let output = run("java-printf");
    assert!(!output.status.success());
    let stderr = String::from_utf8(output.stderr).unwrap();
    assert!(stderr.contains("fr: message: Incompatible argument 1"));
    assert!(stderr.contains("Missing argument 2"));
    assert!(run("icu").status.success());
    assert!(!run("unknown").status.success());
    std::fs::write(&source, r#"{"message":"Hello %q"}"#).unwrap();
    let output = run("java-printf");
    assert!(!output.status.success());
    assert!(
        String::from_utf8(output.stderr)
            .unwrap()
            .contains("en: message: Invalid Java printf syntax")
    );
}
