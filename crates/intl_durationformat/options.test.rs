use formatjs_intl_durationformat::{
    Configuration, Display, Error, Options, Style, Unit, UnitStyle,
};
#[test]
fn digital_chain_promotes_clock_padding_and_fractional_units() {
    let options = Options {
        style: Style::Digital,
        ..Default::default()
    };
    let result = Configuration::new(&options).unwrap();
    assert_eq!(result.units[Unit::Hours as usize].style, UnitStyle::Numeric);
    assert_eq!(
        result.units[Unit::Minutes as usize].style,
        UnitStyle::TwoDigit
    );
    assert_eq!(
        result.units[Unit::Seconds as usize].style,
        UnitStyle::TwoDigit
    );
    for unit in [Unit::Milliseconds, Unit::Microseconds, Unit::Nanoseconds] {
        let option = result.units[unit as usize];
        assert_eq!(
            (option.style, option.display),
            (UnitStyle::Fractional, Display::Auto)
        );
    }
}
#[test]
fn explicit_styles_change_display_defaults_and_validate_transitions() {
    let default = Configuration::new(&Options::default()).unwrap();
    let explicit = Configuration::new(&Options {
        years: Some(UnitStyle::Short),
        ..Default::default()
    })
    .unwrap();
    assert_eq!(default.units[0].display, Display::Auto);
    assert_eq!(explicit.units[0].display, Display::Always);
    for options in [
        Options {
            hours: Some(UnitStyle::Numeric),
            minutes: Some(UnitStyle::Long),
            ..Default::default()
        },
        Options {
            milliseconds: Some(UnitStyle::Numeric),
            milliseconds_display: Some(Display::Always),
            ..Default::default()
        },
        Options {
            years: Some(UnitStyle::Numeric),
            ..Default::default()
        },
        Options {
            milliseconds: Some(UnitStyle::Fractional),
            ..Default::default()
        },
    ] {
        assert_eq!(Configuration::new(&options), Err(Error::InvalidOption));
    }
    assert_eq!(
        Configuration::new(&Options {
            fractional_digits: Some(2.9),
            ..Default::default()
        })
        .unwrap()
        .fractional_digits,
        Some(2)
    );
}
