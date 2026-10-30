use crate::{Error, NumberFormat, Part, numeric::Numeric};

fn affix(kind: &str) -> bool {
    matches!(
        kind,
        "unit" | "minusSign" | "plusSign" | "percentSign" | "currency" | "literal"
    )
}
fn digits(kind: &str) -> bool {
    matches!(kind, "integer" | "fraction" | "exponentInteger")
}
fn affix_len(parts: &[Part], reverse: bool) -> usize {
    if reverse {
        parts
            .iter()
            .rev()
            .take_while(|part| affix(part.kind))
            .count()
    } else {
        parts.iter().take_while(|part| affix(part.kind)).count()
    }
}
fn same(a: &[Part], b: &[Part], shared_unit: bool) -> bool {
    a.len() == b.len()
        && a.iter().any(|part| part.kind != "literal")
        && a.iter()
            .zip(b)
            .all(|(a, b)| a.kind == b.kind && a.value == b.value)
        && (a
            .iter()
            .map(|part| part.value.chars().count())
            .sum::<usize>()
            > 1
            || shared_unit && a.len() == 1 && matches!(a[0].kind, "plusSign" | "minusSign"))
}
impl NumberFormat {
    pub fn format_range(&self, start: &str, end: &str) -> Result<String, Error> {
        Ok(self
            .format_range_to_parts(start, end)?
            .iter()
            .map(|part| part.value.as_str())
            .collect())
    }
    pub fn format_range_to_parts(&self, start: &str, end: &str) -> Result<Vec<Part>, Error> {
        let start = Numeric::parse(start)?;
        let end = Numeric::parse(end)?;
        if start.special == Some("NaN") || end.special == Some("NaN") {
            return Err(Error::Range("range"));
        }
        let mut a = self.partition(&start, false)?;
        let mut b = self.partition(&end, false)?;
        if a.iter().map(|part| part.value.as_str()).collect::<String>()
            == b.iter().map(|part| part.value.as_str()).collect::<String>()
        {
            let mut parts = self.partition(&start, true)?;
            for part in &mut parts {
                part.source = Some("shared");
            }
            return Ok(parts);
        }
        for part in &mut a {
            part.source = Some("startRange");
        }
        for part in &mut b {
            part.source = Some("endRange");
        }
        let mut separator = self.data.numbers.symbols[&self.system].range_sign.clone();
        let (a_prefix, b_prefix) = (affix_len(&a, false), affix_len(&b, false));
        let (a_suffix, b_suffix) = (affix_len(&a, true), affix_len(&b, true));
        let suffix_same = same(&a[a.len() - a_suffix..], &b[b.len() - b_suffix..], false);
        let shared_unit = suffix_same
            && a[a.len() - a_suffix..]
                .iter()
                .any(|part| matches!(part.kind, "currency" | "unit" | "percentSign"));
        let mut prefix = Vec::new();
        let mut suffix = Vec::new();
        if same(&a[..a_prefix], &b[..b_prefix], shared_unit) {
            prefix.extend(a.drain(..a_prefix));
            b.drain(..b_prefix);
        }
        if suffix_same {
            a.truncate(a.len().saturating_sub(a_suffix));
            suffix.extend(b.drain(b.len().saturating_sub(b_suffix)..));
        }
        for part in prefix.iter_mut().chain(&mut suffix) {
            part.source = Some("shared");
        }
        // Preserve CLDR's separator whitespace and add spacing only around
        // retained affixes, matching the TS range-collapse profile.
        if !a.is_empty() && !b.is_empty() && (!digits(a.last().unwrap().kind) || !digits(b[0].kind))
        {
            if separator
                .chars()
                .next()
                .is_none_or(|value| !value.is_whitespace())
            {
                separator.insert(0, ' ');
            }
            if separator
                .chars()
                .last()
                .is_some_and(|value| !value.is_whitespace())
            {
                separator.push(' ');
            }
        }
        prefix.extend(a);
        prefix.push(Part {
            kind: "literal",
            value: separator,
            source: Some("shared"),
        });
        prefix.extend(b);
        prefix.extend(suffix);
        Ok(prefix)
    }
}
