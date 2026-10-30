use crate::Error;

#[derive(Clone)]
pub(crate) struct Numeric {
    pub negative: bool,
    pub digits: String,
    pub point: i64,
    pub special: Option<&'static str>,
}
impl Numeric {
    // Input is ToIntlMathematicalValue's normalized wire representation. Keeping
    // a decimal point separately avoids bounding BigInt magnitude to ICU's i16.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1652-L1670
    pub fn parse(input: &str) -> Result<Self, Error> {
        let negative = input.starts_with('-');
        let text = input.strip_prefix(['-', '+']).unwrap_or(input);
        let special = match text {
            "NaN" => Some("NaN"),
            "Infinity" => Some("Infinity"),
            _ => None,
        };
        if special.is_some() {
            return Ok(Self {
                negative,
                digits: "0".into(),
                point: 1,
                special,
            });
        }
        let (mantissa, exponent) = text.split_once(['e', 'E']).unwrap_or((text, "0"));
        let exponent: i64 = exponent.parse().map_err(|_| Error::Range("value"))?;
        let (integer, fraction) = mantissa.split_once('.').unwrap_or((mantissa, ""));
        if integer.is_empty() && fraction.is_empty()
            || !integer
                .bytes()
                .chain(fraction.bytes())
                .all(|value| value.is_ascii_digit())
        {
            return Err(Error::Range("value"));
        }
        let mut digits = format!("{integer}{fraction}");
        let leading = digits.len() - digits.trim_start_matches('0').len();
        if leading == digits.len() {
            digits = "0".into();
            return Ok(Self {
                negative,
                digits,
                point: 1,
                special: None,
            });
        }
        let point = (integer.len() as i64)
            .checked_add(exponent)
            .and_then(|value| value.checked_sub(leading as i64))
            .ok_or(Error::Range("value"))?;
        digits.drain(..leading);
        Ok(Self {
            negative,
            digits,
            point,
            special: None,
        })
    }
    pub fn zero(&self) -> bool {
        self.special.is_none() && self.digits.bytes().all(|value| value == b'0')
    }
    pub fn magnitude(&self) -> i64 {
        if self.zero() { 0 } else { self.point - 1 }
    }
    pub fn shift(&mut self, exponent: i64) -> Result<(), Error> {
        if !self.zero() {
            self.point = self
                .point
                .checked_add(exponent)
                .ok_or(Error::Range("value"))?;
        }
        Ok(())
    }
    pub fn text(&self) -> Result<String, Error> {
        if let Some(special) = self.special {
            return Ok(format!(
                "{}{special}",
                if self.negative && special != "NaN" {
                    "-"
                } else {
                    ""
                }
            ));
        }
        let mut result = if self.point <= 0 {
            format!(
                "0.{}{}",
                "0".repeat(usize::try_from(-self.point).map_err(|_| Error::Range("value"))?),
                self.digits
            )
        } else {
            let point = usize::try_from(self.point).map_err(|_| Error::Range("value"))?;
            if point >= self.digits.len() {
                format!("{}{}", self.digits, "0".repeat(point - self.digits.len()))
            } else {
                format!("{}.{}", &self.digits[..point], &self.digits[point..])
            }
        };
        // All active precision limits are at most 100 fraction or 21 significant
        // digits. Retain a guard digit and sticky tail for enormous mantissas.
        if let Some(point) = result.find('.') {
            let significant = result
                .bytes()
                .position(|value| value.is_ascii_digit() && value != b'0')
                .unwrap_or(result.len());
            let limit = (point + 108).max(significant + 24);
            if result.len() > limit {
                let sticky = result.as_bytes()[limit..]
                    .iter()
                    .any(|value| *value != b'0');
                result.truncate(limit);
                if sticky {
                    result.push('1');
                }
            }
        }
        if self.negative {
            result.insert(0, '-');
        }
        Ok(result)
    }
}
