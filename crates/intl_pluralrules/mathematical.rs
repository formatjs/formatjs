//! Primitive numeric text after JS ToPrimitive. BigInt bypasses the Number
//! overflow/underflow clamp; strings follow StringNumericLiteral semantics.

fn whitespace(value: char) -> bool {
    matches!(value, '\u{0009}'..='\u{000d}' | '\u{0020}' | '\u{00a0}' | '\u{1680}' | '\u{2000}'..='\u{200a}' | '\u{2028}' | '\u{2029}' | '\u{202f}' | '\u{205f}' | '\u{3000}' | '\u{feff}')
}

pub(crate) fn parts(value: &str) -> Option<(&str, &str)> {
    let value = value.strip_prefix(['-', '+']).unwrap_or(value);
    let (integer, fraction) = value.split_once('.').unwrap_or((value, ""));
    if (integer.is_empty() && fraction.is_empty())
        || !integer
            .bytes()
            .chain(fraction.bytes())
            .all(|byte| byte.is_ascii_digit())
    {
        return None;
    }
    Some((integer, fraction))
}

fn radix(digits: &str, base: u32) -> String {
    if digits.is_empty()
        || !digits
            .chars()
            .all(|digit| digit.is_ascii() && digit.to_digit(base).is_some())
    {
        return "NaN".to_owned();
    }
    let digits = digits.trim_start_matches('0');
    if digits.is_empty() {
        return "0".to_owned();
    }
    if digits.len()
        > match base {
            2 => 1024,
            8 => 342,
            _ => 256,
        }
    {
        return "Infinity".to_owned();
    }
    let mut decimal = vec![0u8];
    for digit in digits.chars() {
        let mut carry = digit.to_digit(base).unwrap();
        for value in &mut decimal {
            let next = u32::from(*value) * base + carry;
            *value = (next % 10) as u8;
            carry = next / 10;
        }
        while carry != 0 {
            decimal.push((carry % 10) as u8);
            carry /= 10;
        }
    }
    let value: String = decimal
        .iter()
        .rev()
        .map(|digit| char::from(b'0' + digit))
        .collect();
    if value.parse::<f64>().unwrap().is_infinite() {
        "Infinity".to_owned()
    } else {
        value
    }
}

pub(crate) fn for_rounding(input: &str, bigint: bool) -> String {
    // ToIntlMathematicalValue 1–2: the host already performed ToPrimitive.
    // BigInt's mathematical value returns before Number-range clamping.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1652-L1653
    if bigint {
        let digits = input.strip_prefix('-').unwrap_or(input);
        if digits.is_empty() || !digits.bytes().all(|digit| digit.is_ascii_digit()) {
            return "NaN".to_owned();
        }
        let digits = digits.trim_start_matches('0');
        if digits.is_empty() {
            return "0".to_owned();
        }
        return format!("{}{digits}", if input.starts_with('-') { "-" } else { "" });
    }
    let input = input.trim_matches(whitespace);
    if input.is_empty() {
        return "0".to_owned();
    }
    match input {
        "Infinity" | "+Infinity" => return "Infinity".to_owned(),
        "-Infinity" => return "-Infinity".to_owned(),
        _ => {}
    }
    for (prefix, base) in [
        ("0x", 16),
        ("0X", 16),
        ("0o", 8),
        ("0O", 8),
        ("0b", 2),
        ("0B", 2),
    ] {
        if let Some(digits) = input.strip_prefix(prefix) {
            return radix(digits, base);
        }
    }
    let negative = input.starts_with('-');
    let unsigned = input.strip_prefix(['-', '+']).unwrap_or(input);
    let (mantissa, exponent) = unsigned.split_once(['e', 'E']).unwrap_or((unsigned, ""));
    let has_exponent = unsigned.len() != mantissa.len();
    let exponent_digits = exponent.strip_prefix(['-', '+']).unwrap_or(exponent);
    if has_exponent
        && (exponent_digits.is_empty()
            || !exponent_digits.bytes().all(|digit| digit.is_ascii_digit()))
    {
        return "NaN".to_owned();
    }
    let Some((integer, fraction)) = parts(mantissa) else {
        return "NaN".to_owned();
    };
    // A second sign belongs neither to a decimal mantissa nor its digits.
    if mantissa.starts_with(['-', '+']) {
        return "NaN".to_owned();
    }
    let exponent = exponent_digits.bytes().fold(0i64, |value, digit| {
        value
            .saturating_mul(10)
            .saturating_add(i64::from(digit - b'0'))
    });
    let exponent = if unsigned
        .split_once(['e', 'E'])
        .is_some_and(|(_, exponent)| exponent.starts_with('-'))
    {
        -exponent
    } else {
        exponent
    };
    let digits = format!("{integer}{fraction}");
    let leading = digits.bytes().take_while(|digit| *digit == b'0').count();
    let point = (integer.len() as i64)
        .saturating_sub(leading as i64)
        .saturating_add(exponent);
    if leading == digits.len() {
        return if negative { "-0" } else { "0" }.to_owned();
    }
    // Steps 5–10 parse numeric text, clamp only rounded infinities/zeros, then
    // retain decimal precision instead of replacing it with the rounded Number.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1660-L1670
    let digits = digits[leading..].trim_end_matches('0');
    let floating = format!(
        "{}{digits}e{}",
        if negative { "-" } else { "" },
        point.saturating_sub(digits.len() as i64)
    );
    let rounded = floating
        .parse::<f64>()
        .unwrap_or(if point > 0 { f64::INFINITY } else { 0.0 });
    if rounded.is_infinite() {
        return if negative { "-Infinity" } else { "Infinity" }.to_owned();
    }
    if rounded == 0.0 {
        return if negative { "-0" } else { "0" }.to_owned();
    }
    // Finite Number-range strings have at most 309 integer digits. All Intl
    // rounding settings inspect at most 100 fraction or 21 significant digits.
    // Keep 512 significant digits plus a nonzero sticky digit; discarded digits
    // cannot affect any supported rounding decision, even at a halfway boundary.
    let digits = if digits.len() > 512 {
        format!("{}1", &digits[..512])
    } else {
        digits.to_owned()
    };
    let mut result = if negative {
        "-".to_owned()
    } else {
        String::new()
    };
    if point <= 0 {
        result.push_str("0.");
        result.extend(std::iter::repeat_n('0', (-point) as usize));
        result.push_str(&digits);
    } else if point as usize >= digits.len() {
        result.push_str(&digits);
        result.extend(std::iter::repeat_n('0', point as usize - digits.len()));
    } else {
        let point = point as usize;
        result.push_str(&digits[..point]);
        result.push('.');
        result.push_str(&digits[point..]);
    }
    result
}
