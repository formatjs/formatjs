use formatjs_intl_pluralrules::digits::{Digits, Options};

#[test]
fn source_precision_rounding_matches_fixtures() {
    let rows = std::fs::read_to_string(std::env::var("PRECISION_FIXTURES").unwrap()).unwrap();
    let mut checked = 0;
    for row in rows.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        let options: Options = serde_json::from_str(fields[3]).unwrap();
        let digits = Digits::new(&options, false).unwrap();
        let actual = digits
            .format_with_precision(
                fields[0],
                fields[1].parse().unwrap(),
                fields[2].parse().unwrap(),
            )
            .unwrap();
        assert_eq!(actual.formatted_string, fields[5], "{row}");
        checked += 1;
    }
    assert_eq!(checked, 27);
}
