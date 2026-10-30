use formatjs_intl_localematcher::*;

#[test]
fn shared_icu_fixtures() {
    let fixtures: serde_json::Value = serde_json::from_str(include_str!(
        "../../packages/intl-localematcher/tests/icu-match-fixtures.json"
    ))
    .unwrap();
    for case in fixtures.as_array().unwrap() {
        let supported: Vec<_> = case["supported"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap())
            .collect();
        let requested: Vec<_> = case["requested"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap())
            .collect();
        let default_locale = case["defaultLocale"]
            .as_str()
            .unwrap_or(supported.first().copied().unwrap_or("en"));
        let matcher = LocaleMatcher::new(&supported, default_locale).unwrap();
        let result = matcher.best_match(&requested).unwrap();
        assert_eq!(
            result.locale,
            case["expected"].as_str().unwrap(),
            "{}",
            case["description"]
        );
        if let Some(index) = case["desiredIndex"].as_str() {
            assert_eq!(
                result.desired_index.map(|i| i as isize).unwrap_or(-1),
                index.parse::<isize>().unwrap(),
                "{}",
                case["description"]
            );
        }
    }
}

#[test]
fn icu4j_differential_grid() {
    let grid = std::fs::read_to_string(std::env::var("ICU_MATCHER_GRID").unwrap()).unwrap();
    for line in grid.lines() {
        let fields: Vec<_> = line.split('\t').collect();
        let requested: Vec<_> = fields[0].split(',').collect();
        let supported: Vec<_> = fields[1].split(',').collect();
        let matcher = LocaleMatcher::new(&supported, fields[2]).unwrap();
        let prepared: Vec<_> = requested
            .iter()
            .map(|tag| DesiredLocale::new(tag).unwrap())
            .collect();
        for _ in 0..2 {
            let result = matcher.best_match(&requested).unwrap();
            assert_eq!(matcher.best_match_prepared(&prepared), result, "{line}");
            assert_eq!(result.locale, fields[3], "{line}");
            assert_eq!(
                result.desired_index.map(|i| i as isize).unwrap_or(-1),
                fields[4].parse::<isize>().unwrap(),
                "{line}"
            );
        }
    }
}
