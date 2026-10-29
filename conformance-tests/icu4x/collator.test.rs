use icu_collator::options::{AlternateHandling, CaseLevel, CollatorOptions, Strength};
use icu_collator::preferences::{CollationCaseFirst, CollationNumericOrdering};
use icu_collator::{Collator, CollatorPreferences};
use icu_locale::Locale;
use std::cmp::Ordering;

#[test]
fn ordering_matches_icu4c_icu4j_and_formatjs() {
    let data =
        std::fs::read_to_string(std::env::var("COLLATOR_CONFORMANCE_FIXTURES").unwrap()).unwrap();
    let mut checked = 0;
    for row in data.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 9);
        let locale: Locale = fields[1].parse().unwrap();
        let mut preferences: CollatorPreferences = locale.into();
        preferences.numeric_ordering = match fields[3] {
            "-" => preferences.numeric_ordering,
            "true" => Some(CollationNumericOrdering::True),
            "false" => Some(CollationNumericOrdering::False),
            other => panic!("Unknown numeric option {other}"),
        };
        preferences.case_first = match fields[4] {
            "-" => preferences.case_first,
            "upper" => Some(CollationCaseFirst::Upper),
            "lower" => Some(CollationCaseFirst::Lower),
            "false" => Some(CollationCaseFirst::False),
            other => panic!("Unknown caseFirst option {other}"),
        };
        let mut options = CollatorOptions::default();
        options.strength = match fields[2] {
            "-" => None,
            "base" | "case" => Some(Strength::Primary),
            "accent" => Some(Strength::Secondary),
            "variant" => Some(Strength::Tertiary),
            other => panic!("Unknown sensitivity {other}"),
        };
        if fields[2] == "case" {
            options.case_level = Some(CaseLevel::On);
        }
        options.alternate_handling = match fields[5] {
            "-" => None,
            "true" => Some(AlternateHandling::Shifted),
            "false" => Some(AlternateHandling::NonIgnorable),
            other => panic!("Unknown ignorePunctuation option {other}"),
        };
        let collator = Collator::try_new(preferences, options).unwrap();
        let actual = match collator.compare(fields[6], fields[7]) {
            Ordering::Less => -1,
            Ordering::Equal => 0,
            Ordering::Greater => 1,
        };
        assert_eq!(actual, fields[8].parse::<i32>().unwrap(), "ICU4X: {row}");
        checked += 1;
    }
    assert_eq!(checked, 27);
}
