use fixed_decimal::Decimal;
use icu_locale::Locale;
use icu_plurals::{PluralCategory, PluralOperands, PluralRules};

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
