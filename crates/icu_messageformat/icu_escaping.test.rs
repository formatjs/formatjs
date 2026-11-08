use formatjs_icu_messageformat::{IcuMessageFormat, Value, Values};
use formatjs_icu_messageformat_parser::{Parser, ParserOptions, hoist_selectors, print_ast};
use std::{collections::HashMap, fs, process::Command};

#[test]
fn escapes_match_icu4j_fixtures_verified_by_icu4c() {
    let path = std::env::var("MESSAGEFORMAT_ESCAPE_FIXTURES").unwrap();
    let fixtures = fs::read_to_string(path).unwrap();
    let mut checked = 0;
    let mut printed_rows = String::from("case\tn\tg\tpattern\texpected\n");
    for row in fixtures.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 5, "Invalid fixture: {row}");
        let values: Values<String> = HashMap::from([
            ("0".into(), Value::from(3_i64)),
            ("1".into(), Value::from("x")),
            ("2".into(), Value::from("Y")),
            ("n".into(), Value::from(fields[1].parse::<i64>().unwrap())),
            ("g".into(), Value::from(fields[2])),
            ("x".into(), Value::from("X")),
            ("name".into(), Value::from("Ada")),
        ]);
        for capture_escapes in [false, true] {
            let parsed = Parser::new(
                fields[3],
                ParserOptions {
                    capture_escapes,
                    ..Default::default()
                },
            )
            .parse();
            if fields[4] == "!PARSE_ERROR" {
                assert!(parsed.is_err(), "Accepted invalid pattern: {row}");
                continue;
            }
            let ast = parsed.unwrap_or_else(|error| panic!("{row}: {error}"));
            let printed = print_ast(&ast);
            printed_rows.push_str(&format!(
                "{}-{capture_escapes}\t{}\t{}\t{printed}\t{}\n",
                fields[0], fields[1], fields[2], fields[4]
            ));
            let flattened = hoist_selectors(ast.clone());
            let flat_message = print_ast(&flattened);
            let direct = IcuMessageFormat::from_ast(ast)
                .format_to_string("en", &values)
                .unwrap();
            let roundtrip = IcuMessageFormat::try_new(&printed)
                .unwrap()
                .format_to_string("en", &values)
                .unwrap();
            assert_eq!(direct, fields[4], "{row}; capture={capture_escapes}");
            assert_eq!(
                roundtrip, fields[4],
                "{row}; printed={printed}; capture={capture_escapes}"
            );
            assert_eq!(
                IcuMessageFormat::from_ast(flattened)
                    .format_to_string("en", &values)
                    .unwrap(),
                fields[4],
                "Flattened AST: {row}"
            );
            assert_eq!(
                IcuMessageFormat::try_new(&flat_message)
                    .unwrap()
                    .format_to_string("en", &values)
                    .unwrap(),
                fields[4],
                "Flattened message: {row}; {flat_message}"
            );
            printed_rows.push_str(&format!(
                "{}-flat-{capture_escapes}\t{}\t{}\t{flat_message}\t{}\n",
                fields[0], fields[1], fields[2], fields[4]
            ));
        }
        checked += 1;
    }
    assert!(checked > 0);
    let path =
        std::env::temp_dir().join(format!("formatjs-icu-escapes-{}.tsv", std::process::id()));
    fs::write(&path, printed_rows).unwrap();
    let oracle = std::env::var("MESSAGEFORMAT_ESCAPE_ORACLE").unwrap();
    let output = Command::new(oracle)
        .arg("--verify")
        .arg(&path)
        .output()
        .unwrap();
    fs::remove_file(path).unwrap();
    assert!(
        output.status.success(),
        "ICU4J rejected printed patterns: {}",
        String::from_utf8_lossy(&output.stderr)
    );
}
