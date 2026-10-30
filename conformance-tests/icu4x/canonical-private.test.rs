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

fn extension_option_rows() -> Vec<[String; 4]> {
    let rows = std::fs::read_to_string(std::env::var("LOCALE_EXTENSION_OPTIONS_FIXTURES").unwrap())
        .unwrap();
    let rows: Vec<_> = rows
        .lines()
        .skip(1)
        .map(|row| {
            row.split('\t')
                .map(str::to_owned)
                .collect::<Vec<_>>()
                .try_into()
                .unwrap()
        })
        .collect();
    assert_eq!(rows.len(), 12);
    rows
}

#[test]
fn extension_options_match_pinned_icu4x() {
    let canonicalizer = LocaleCanonicalizer::new_extended();
    for [input, key, value, expected] in extension_option_rows() {
        let mut locale: IcuLocale = input.parse().unwrap();
        locale
            .extensions
            .unicode
            .keywords
            .set(key.parse().unwrap(), value.parse().unwrap());
        canonicalizer.canonicalize(&mut locale);
        assert_eq!(
            locale.to_string(),
            expected,
            "ICU4X: {input}, {key}={value}"
        );
    }
}

#[test]
fn extension_options_preserve_other_extensions() {
    for [input, key, value, expected] in extension_option_rows() {
        let options = match key.as_str() {
            "kn" => LocaleOptions {
                numeric: Some(value.parse().unwrap()),
                ..Default::default()
            },
            "ca" => LocaleOptions {
                calendar: Some(value),
                ..Default::default()
            },
            _ => panic!("Unexpected option: {key}"),
        };
        assert_eq!(
            Locale::new(&input, &options).unwrap().as_str(),
            expected,
            "Locale: {input}"
        );
    }
}
