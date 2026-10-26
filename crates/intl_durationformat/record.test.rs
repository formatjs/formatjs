use formatjs_intl_durationformat::{Duration, Error, Unit};
#[test]
fn duration_bounds_include_exact_subseconds_and_common_sign() {
    let mut values = [0i128; 10];
    values[6] = (1i128 << 53) - 1;
    values[9] = 999_999_999;
    assert!(Duration::from_integers(values).is_ok());
    values[9] += 1;
    assert_eq!(Duration::from_integers(values), Err(Error::InvalidDuration));
    values[9] = 0;
    values[6] = 1i128 << 53;
    assert_eq!(Duration::from_integers(values), Err(Error::InvalidDuration));
    for index in 0..3 {
        let mut values = [0; 10];
        values[index] = (1i128 << 32) - 1;
        assert!(Duration::from_integers(values).is_ok());
        values[index] += 1;
        assert_eq!(Duration::from_integers(values), Err(Error::InvalidDuration));
    }
    let mut values = [0; 10];
    values[0] = -1;
    values[6] = 1;
    assert_eq!(Duration::from_integers(values), Err(Error::InvalidDuration));
    values[6] = -1;
    assert!(Duration::from_integers(values).unwrap().is_negative());
}
#[test]
fn number_records_preserve_mathematical_integers_and_reject_invalid_fields() {
    let mut values = [None; 10];
    assert_eq!(Duration::from_numbers(values), Err(Error::EmptyDuration));
    values[9] = Some(1_000_000_000_000_000_100.0);
    assert_eq!(
        Duration::from_numbers(values)
            .unwrap()
            .get(Unit::Nanoseconds),
        1_000_000_000_000_000_128
    );
    for value in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY, 1.5, 1e300] {
        values[9] = Some(value);
        assert_eq!(Duration::from_numbers(values), Err(Error::InvalidDuration));
    }
    values[9] = Some(-0.0);
    let value = Duration::from_numbers(values).unwrap();
    assert_eq!(value.get(Unit::Nanoseconds), 0);
    assert!(!value.is_negative());
    assert_eq!(
        Duration::from_integers([i128::MIN; 10]),
        Err(Error::InvalidDuration)
    );
}
