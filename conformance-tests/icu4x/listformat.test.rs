use icu_list::{
    ListFormatter,
    options::{ListFormatterOptions, ListLength},
};
use icu_locale::Locale;

fn unhex(value: &str) -> Result<String, std::string::FromUtf16Error> {
    let units: Vec<u16> = if value == "_" {
        Vec::new()
    } else {
        (0..value.len())
            .step_by(4)
            .map(|index| u16::from_str_radix(&value[index..index + 4], 16).unwrap())
            .collect()
    };
    String::from_utf16(&units)
}

#[test]
fn list_output_matches_independent_icu_oracles() {
    let rows = std::fs::read_to_string(std::env::var("LIST_FORMAT_FIXTURES").unwrap()).unwrap();
    let difference_rows =
        std::fs::read_to_string(std::env::var("ICU4X_LIST_DIFFERENCES").unwrap()).unwrap();
    let mut expected_differences = std::collections::BTreeMap::new();
    for row in difference_rows.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 6);
        assert_ne!(fields[4], fields[5]);
        assert!(
            expected_differences
                .insert(fields[..4].join("\t"), (fields[4], fields[5]))
                .is_none()
        );
    }
    let mut used = 0;
    let mut checked = 0;
    let mut utf16_only = 0;
    let mut differences = Vec::new();
    for row in rows.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 6);
        let input: Result<Vec<_>, _> = if fields[3] == "-" {
            Ok(Vec::new())
        } else {
            fields[3].split(',').map(unhex).collect()
        };
        let Ok(input) = input else {
            // ICU4X accepts Unicode scalar strings; C/J and Hermes also check
            // these original UTF-16 inputs without replacement characters.
            utf16_only += 1;
            continue;
        };
        let locale: Locale = fields[0].parse().unwrap();
        let length = match fields[2] {
            "long" => ListLength::Wide,
            "short" => ListLength::Short,
            "narrow" => ListLength::Narrow,
            other => panic!("Unknown list length {other}"),
        };
        let options = ListFormatterOptions::default().with_length(length);
        let formatter = match fields[1] {
            "conjunction" => ListFormatter::try_new_and(locale.into(), options),
            "disjunction" => ListFormatter::try_new_or(locale.into(), options),
            "unit" => ListFormatter::try_new_unit(locale.into(), options),
            other => panic!("Unknown list type {other}"),
        }
        .unwrap();
        let actual = formatter.format_to_string(input.iter().map(String::as_str));
        let expected =
            if let Some((preferred, icu4x)) = expected_differences.get(&fields[..4].join("\t")) {
                assert_eq!(
                    fields[5], *preferred,
                    "Preferred oracle output changed: {row}"
                );
                used += 1;
                unhex(icu4x).unwrap()
            } else {
                unhex(fields[5]).unwrap()
            };
        if actual != expected {
            let encoded: String = if actual.is_empty() {
                "_".into()
            } else {
                actual
                    .encode_utf16()
                    .map(|unit| format!("{unit:04x}"))
                    .collect()
            };
            differences.push(format!("{row}\t{encoded}"));
        }
        checked += 1;
    }
    assert_eq!((checked, utf16_only), (3069, 99));
    assert_eq!(used, expected_differences.len(), "Unused ICU4X differences");
    assert!(
        differences.is_empty(),
        "ICU4X differences ({}):\n{}",
        differences.len(),
        differences.join("\n")
    );
}
