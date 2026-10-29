use formatjs_intl_getcanonicallocales::canonicalize_locale;
use formatjs_intl_locale::{Locale, LocaleOptions};
use icu_locale::{Locale as IcuLocale, LocaleCanonicalizer};

#[test]
fn private_use_suffixes_match_pinned_oracles() {
    let rows =
        std::fs::read_to_string(std::env::var("CANONICAL_PRIVATE_FIXTURES").unwrap()).unwrap();
    let canonicalizer = LocaleCanonicalizer::new_extended();
    let mut checked = 0;
    for row in rows.lines().skip(1) {
        let (input, expected) = row.split_once('\t').unwrap();
        let mut locale: IcuLocale = input.parse().unwrap();
        canonicalizer.canonicalize(&mut locale);
        assert_eq!(locale.to_string(), expected, "ICU4X: {input}");
        assert_eq!(
            canonicalize_locale(input).unwrap(),
            expected,
            "FormatJS: {input}"
        );
        assert_eq!(
            Locale::new(input, &LocaleOptions::default())
                .unwrap()
                .as_str(),
            expected,
            "Locale: {input}"
        );
        checked += 1;
    }
    assert_eq!(checked, 21);
}
