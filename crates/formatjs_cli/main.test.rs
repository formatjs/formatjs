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
