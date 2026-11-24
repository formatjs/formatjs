use crate::{Error, Unit};
#[derive(Debug, Clone, PartialEq, Eq)]
// ECMA-402 §13.5.1 https://tc39.es/ecma402/#sec-duration-records
pub struct Duration([i128; 10]);
impl Duration {
    pub fn from_numbers(values: [Option<f64>; 10]) -> Result<Self, Error> {
        // ECMA-402 §13.5.3 steps 23–25 validate the collected duration.
        // https://tc39.es/ecma402/#sec-todurationrecord
        if values.iter().all(Option::is_none) {
            return Err(Error::EmptyDuration);
        }
        let mut integers = [0; 10];
        for (output, input) in integers.iter_mut().zip(values) {
            let input = input.unwrap_or(0.0);
            if !input.is_finite()
                || input.fract() != 0.0
                || input < i128::MIN as f64
                || input >= -(i128::MIN as f64)
            {
                return Err(Error::InvalidDuration);
            }
            // A Number's shortest decimal can differ from its mathematical integer.
            *output = input as i128;
        }
        Self::from_integers(integers)
    }
    pub fn from_integers(values: [i128; 10]) -> Result<Self, Error> {
        // ECMA-402 §13.5.5: validate signs and bounds using exact integers.
        // https://tc39.es/ecma402/#sec-isvalidduration
        let sign = values
            .iter()
            .find(|value| **value != 0)
            .map(|value| value.signum())
            .unwrap_or(0);
        if values
            .iter()
            .any(|value| *value != 0 && value.signum() != sign)
            || values[..3]
                .iter()
                .any(|value| value.unsigned_abs() >= 1u128 << 32)
        {
            return Err(Error::InvalidDuration);
        }
        let scales = [
            86_400_000_000_000u128,
            3_600_000_000_000,
            60_000_000_000,
            1_000_000_000,
            1_000_000,
            1_000,
            1,
        ];
        let mut nanoseconds = 0u128;
        for (value, scale) in values[3..].iter().zip(scales) {
            nanoseconds = nanoseconds
                .checked_add(
                    value
                        .unsigned_abs()
                        .checked_mul(scale)
                        .ok_or(Error::InvalidDuration)?,
                )
                .ok_or(Error::InvalidDuration)?;
        }
        if nanoseconds >= (1u128 << 53) * 1_000_000_000 {
            return Err(Error::InvalidDuration);
        }
        Ok(Self(values))
    }
    pub fn get(&self, unit: Unit) -> i128 {
        self.0[unit as usize]
    }
    pub fn values(&self) -> &[i128; 10] {
        &self.0
    }
    // ECMA-402 §13.5.4: all nonzero fields share the validated sign.
    // https://tc39.es/ecma402/#sec-durationsign
    pub fn is_negative(&self) -> bool {
        self.0.iter().any(|value| *value < 0)
    }
}
