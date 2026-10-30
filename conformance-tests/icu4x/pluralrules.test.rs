use fixed_decimal::Decimal;
use icu_locale::Locale;
use icu_plurals::{PluralCategory, PluralOperands, PluralRules, PluralRulesWithRanges};

#[test]
fn cardinal_and_ordinal_outputs_match_icu4c_and_icu4j() {
    let data = std::fs::read_to_string(std::env::var("PLURAL_RULES_FIXTURES").unwrap()).unwrap();
    let mut checked = 0;
    for row in data.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 4);
        let locale: Locale = fields[0].parse().unwrap();
        let rules = match fields[1] {
            "cardinal" => PluralRules::try_new_cardinal(locale.into()),
            "ordinal" => PluralRules::try_new_ordinal(locale.into()),
            other => panic!("Unknown plural type {other}"),
        }
        .unwrap();
        let decimal: Decimal = fields[2].parse().unwrap();
        let operands = PluralOperands::from(&decimal);
        let actual = match rules.category_for(operands) {
            PluralCategory::Zero => "zero",
            PluralCategory::One => "one",
            PluralCategory::Two => "two",
            PluralCategory::Few => "few",
            PluralCategory::Many => "many",
            PluralCategory::Other => "other",
        };
        assert_eq!(actual, fields[3], "ICU4X plural mismatch: {row}");
        checked += 1;
    }
    assert_eq!(checked, 720);
}

#[test]
fn cardinal_ranges_match_icu4c_and_icu4j() {
    let data = std::fs::read_to_string(std::env::var("PLURAL_RANGE_FIXTURES").unwrap()).unwrap();
    let differences =
        std::fs::read_to_string(std::env::var("PLURAL_RANGE_DIFFERENCES").unwrap()).unwrap();
    let mut differences = differences
        .lines()
        .skip(1)
        .map(|row| {
            let fields: Vec<_> = row.split('\t').map(str::to_owned).collect();
            assert_eq!(fields.len(), 7);
            (fields[..3].join("\t"), fields)
        })
        .collect::<std::collections::BTreeMap<_, _>>();
    assert_eq!(differences.len(), 18);
    let name = |category| match category {
        PluralCategory::Zero => "zero",
        PluralCategory::One => "one",
        PluralCategory::Two => "two",
        PluralCategory::Few => "few",
        PluralCategory::Many => "many",
        PluralCategory::Other => "other",
    };
    let mut checked = 0;
    for row in data.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 5);
        let locale: Locale = fields[0].parse().unwrap();
        let ranges = PluralRulesWithRanges::try_new_cardinal(locale.clone().into()).unwrap();
        let start: Decimal = fields[1].parse().unwrap();
        let end: Decimal = fields[2].parse().unwrap();
        let raw =
            ranges.category_for_range(PluralOperands::from(&start), PluralOperands::from(&end));
        let raw_name = name(raw);
        let difference = differences.remove(&fields[..3].join("\t"));
        if let Some(expected) = &difference {
            assert_eq!(
                expected[..5].iter().map(String::as_str).collect::<Vec<_>>(),
                fields
            );
        }
        let expected_raw = difference.as_ref().map_or(fields[3], |row| row[5].as_str());
        let expected_ecma = difference.as_ref().map_or(fields[4], |row| row[6].as_str());
        assert_eq!(
            raw_name, expected_raw,
            "ICU4X raw plural range mismatch: {row}"
        );
        // ECMA-402 resolves identical formatted endpoints as a single value.
        let category = if fields[1] == fields[2] {
            PluralRules::try_new_cardinal(locale.into())
                .unwrap()
                .category_for(PluralOperands::from(&start))
        } else {
            raw
        };
        let actual = name(category);
        assert_eq!(actual, expected_ecma, "ICU4X plural range mismatch: {row}");
        checked += 1;
    }
    assert_eq!(checked, 224);
    assert!(differences.is_empty(), "Unused plural range differences");
}
