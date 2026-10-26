//! UCA level comparisons with the existing CLDR FractionalUCA/LDML profile.
use crate::{
    CaseFirst, Collator, Sensitivity,
    data::{Data, Element},
};
use icu_casemap::CaseMapper;
use icu_normalizer::DecomposingNormalizer;
use serde_json::Value;
use std::{cmp::Ordering, collections::BTreeSet, sync::Arc};
#[derive(Clone)]
pub struct Entry {
    points: Vec<u32>,
    elements: Vec<Element>,
}
// CompareStrings consumes UTF-16 and combines valid surrogate pairs.
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L243
fn points(input: &[u16]) -> Vec<u32> {
    char::decode_utf16(input.iter().copied())
        .map(|value| match value {
            Ok(value) => value as u32,
            Err(error) => error.unpaired_surrogate() as u32,
        })
        .collect()
}
fn nfd(input: &str) -> String {
    DecomposingNormalizer::new_nfd()
        .normalize(input)
        .into_owned()
}
fn root_at(data: &Data, input: &[u32], start: usize) -> (Vec<Element>, usize) {
    // Context-sensitive mappings precede root longest-match contractions.
    // https://www.unicode.org/reports/tr10/#Contextual_Sensitive_Mappings
    // https://www.unicode.org/reports/tr10/#Contractions
    let mut prefix = None;
    for entry in &data.prefixes {
        if input[..start].ends_with(&entry.prefix)
            && input[start..].starts_with(&entry.code_points)
            && prefix.is_none_or(|best: &crate::data::Prefix| {
                entry.prefix.len() + entry.code_points.len()
                    > best.prefix.len() + best.code_points.len()
            })
        {
            prefix = Some(entry);
        }
    }
    if let Some(entry) = prefix {
        return (entry.elements.clone(), entry.code_points.len());
    }
    let mut node = &data.trie;
    let mut matched = None;
    for (offset, point) in input[start..].iter().enumerate() {
        let Some(next) = node.next.get(point) else {
            break;
        };
        node = next;
        if let Some(index) = node.value {
            matched = Some((index, offset + 1));
        }
    }
    matched
        .map(|(index, length)| (data.elements[index].clone(), length))
        // Keep TS's explicit implicit-weight profile for non-table code points,
        // including lone UTF-16 surrogates. Do not substitute replacement characters.
        .unwrap_or_else(|| (vec![[0xff0000 + i64::from(input[start]), 0, 0, 0, 0]], 1))
}
fn elements(data: &Data, input: &[u32], tailoring: &[Entry]) -> Vec<Element> {
    let mut result = Vec::new();
    let mut start = 0;
    while start < input.len() {
        let (matched, length) = tailoring
            .iter()
            .find(|entry| input[start..].starts_with(&entry.points))
            .map(|entry| (entry.elements.clone(), entry.points.len()))
            .unwrap_or_else(|| root_at(data, input, start));
        result.extend(matched);
        start += length;
    }
    result
}
fn text(rule: &[Value], index: usize) -> &str {
    rule.get(index).and_then(Value::as_str).unwrap_or("")
}
fn level(rule: &[Value]) -> usize {
    match text(rule, 1) {
        "primary" => 0,
        "secondary" => 1,
        "tertiary" => 2,
        _ => 3,
    }
}
fn relation_group(
    data: &Data,
    entries: &mut Vec<Entry>,
    reset: &[Value],
    relations: &[&Vec<Value>],
) {
    if relations.is_empty() {
        return;
    }
    let anchor = elements(
        data,
        &nfd(text(reset, 1))
            .chars()
            .map(u32::from)
            .collect::<Vec<_>>(),
        &[],
    );
    if anchor.is_empty() {
        return;
    }
    let before = reset
        .get(2)
        .and_then(Value::as_u64)
        .map(|value| value as usize);
    let mut totals = [0i64; 4];
    for rule in relations {
        totals[level(rule)] += 1;
    }
    let mut seen = [0i64; 4];
    let mut previous = anchor.clone();
    for rule in relations {
        let level = level(rule);
        seen[level] += 1;
        // LDML resets/relations modify the last non-zero CE at this strength.
        // Tertiary chains retain the previous expansion; other levels use the reset.
        // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-collation.md#L765-L775
        let source = if level == 2 { &previous } else { &anchor };
        let index = source
            .iter()
            .rposition(|element| element[..=level].iter().any(|weight| *weight != 0));
        let mut element = index.map(|index| source[index]).unwrap_or([0; 5]);
        let offset = if before == Some(level + 1) {
            seen[level] - totals[level] - 1
        } else {
            seen[level]
        };
        if level < 3 {
            element[level] += offset;
        }
        let mut current: Vec<_> = source.iter().take(index.unwrap_or(0)).copied().collect();
        current.push(element);
        previous = current;
        let points = nfd(text(rule, 2))
            .chars()
            .map(u32::from)
            .collect::<Vec<_>>();
        if !points.is_empty() {
            entries.push(Entry {
                points,
                elements: previous.clone(),
            });
        }
    }
}
pub fn tailoring(
    data: &Data,
    locale: &str,
    collation: &str,
    visited: &mut BTreeSet<String>,
) -> Arc<Vec<Entry>> {
    let key = format!("{locale}|{collation}");
    if let Some(cached) = {
        data.cache
            .lock()
            .expect("collation cache poisoned")
            .get(&key)
            .cloned()
    } {
        return cached;
    }
    if !visited.insert(key.clone()) {
        return Arc::new(Vec::new());
    }
    let packed = data
        .tailorings
        .get(locale)
        .and_then(|values| values.get(collation))
        .or_else(|| {
            (collation == "search")
                .then(|| {
                    data.tailorings
                        .get("root")
                        .and_then(|values| values.get("search"))
                })
                .flatten()
        });
    let mut entries = Vec::new();
    if let Some(packed) = packed {
        let mut reset: Option<&Vec<Value>> = None;
        let mut relations = Vec::new();
        for rule in &packed.rules {
            match text(rule, 0) {
                "setting" => {
                    if let Some(reset) = reset {
                        relation_group(data, &mut entries, reset, &relations);
                    }
                    relations.clear();
                    // Imports contribute entries in rule order. The visited set
                    // prevents recursive LDML imports from looping.
                    // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
                    if text(rule, 1) == "import" {
                        if let Some((locale, collation)) = text(rule, 2).rsplit_once("-u-co-") {
                            let locale = if locale == "und" { "root" } else { locale };
                            entries.extend(
                                tailoring(data, locale, collation, visited).iter().cloned(),
                            );
                        }
                    }
                }
                "reset" => {
                    if let Some(reset) = reset {
                        relation_group(data, &mut entries, reset, &relations);
                    }
                    relations.clear();
                    reset = Some(rule);
                }
                "relation" => relations.push(rule),
                _ => {}
            }
        }
        if let Some(reset) = reset {
            relation_group(data, &mut entries, reset, &relations);
        }
    }
    // Stable longest-first order preserves equal-length LDML rule precedence.
    entries.sort_by_key(|entry| std::cmp::Reverse(entry.points.len()));
    let entries = Arc::new(entries);
    data.cache
        .lock()
        .expect("collation cache poisoned")
        .insert(key, entries.clone());
    entries
}
fn map_valid_chunks(input: &[u16], mut map: impl FnMut(&str) -> String) -> Vec<u16> {
    let mut result = Vec::new();
    let mut chunk = String::new();
    // ICU text APIs accept Unicode scalar strings. Split around lone surrogates
    // so normalization/casing never replaces or merges their original code units.
    for value in char::decode_utf16(input.iter().copied()) {
        match value {
            Ok(value) => chunk.push(value),
            Err(error) => {
                result.extend(map(&chunk).encode_utf16());
                chunk.clear();
                result.push(error.unpaired_surrogate());
            }
        }
    }
    result.extend(map(&chunk).encode_utf16());
    result
}
fn prepare(model: &Collator, input: &[u16]) -> Vec<u16> {
    // CompareStrings is implementation-defined; keep the TS UCA profile.
    // Sensitivity selects normalization/mark/case preparation and comparison levels.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L241-L280
    let opts = &model.resolved;
    map_valid_chunks(input, |value| {
        let mut value = nfd(value);
        if matches!(opts.sensitivity, Sensitivity::Base | Sensitivity::Case) {
            value.retain(|value| !('\u{0300}'..='\u{036f}').contains(&value));
        }
        if matches!(opts.sensitivity, Sensitivity::Base | Sensitivity::Accent)
            || opts.case_first != CaseFirst::False
        {
            value = CaseMapper::new()
                .lowercase_to_string(&value, &model.language)
                .into_owned();
        }
        value
    })
}
fn prepared(model: &Collator, left: &[u16], right: &[u16]) -> Ordering {
    let left = elements(model.data, &points(left), &model.tailoring);
    let right = elements(model.data, &points(right), &model.tailoring);
    let levels = match model.resolved.sensitivity {
        Sensitivity::Base => 1,
        Sensitivity::Accent => 2,
        Sensitivity::Case => 3,
        Sensitivity::Variant => 4,
    };
    // Compare level by level, dropping zero weights. ignorePunctuation filters
    // CLDR variable CEs consistently with the TS profile's shifted approximation.
    // https://www.unicode.org/reports/tr10/#Multi_Level_Comparison
    for level in 0..levels {
        let weights = |elements: &[Element]| {
            elements
                .iter()
                .filter(|element| !model.resolved.ignore_punctuation || element[4] & 1 == 0)
                .map(|element| element[level])
                .filter(|weight| *weight != 0)
                .collect::<Vec<_>>()
        };
        let left = weights(&left);
        let right = weights(&right);
        for index in 0..left.len().max(right.len()) {
            let result = left
                .get(index)
                .copied()
                .unwrap_or(0)
                .cmp(&right.get(index).copied().unwrap_or(0));
            if result != Ordering::Equal {
                return result;
            }
        }
    }
    Ordering::Equal
}
fn numeric_parts(input: &[u16]) -> (Vec<&[u16]>, Vec<&[u16]>) {
    let mut parts = Vec::new();
    let mut digits = Vec::new();
    let mut start = 0;
    let mut index = 0;
    while index < input.len() {
        if (b'0' as u16..=b'9' as u16).contains(&input[index]) {
            parts.push(&input[start..index]);
            let digit_start = index;
            while index < input.len() && (b'0' as u16..=b'9' as u16).contains(&input[index]) {
                index += 1;
            }
            digits.push(&input[digit_start..index]);
            start = index;
        } else {
            index += 1;
        }
    }
    parts.push(&input[start..]);
    (parts, digits)
}
fn numeric(model: &Collator, left: &[u16], right: &[u16]) -> Ordering {
    let (left_parts, left_digits) = numeric_parts(left);
    let (right_parts, right_digits) = numeric_parts(right);
    for index in 0..left_parts.len().max(right_parts.len()) {
        let result = prepared(
            model,
            left_parts.get(index).copied().unwrap_or(&[]),
            right_parts.get(index).copied().unwrap_or(&[]),
        );
        if result != Ordering::Equal {
            return result;
        }
        if let (Some(left), Some(right)) = (left_digits.get(index), right_digits.get(index)) {
            // Compare arbitrarily long decimal runs without integer/float overflow.
            // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L293-L295
            let left = &left[left
                .iter()
                .position(|value| *value != b'0' as u16)
                .unwrap_or(left.len() - 1)..];
            let right = &right[right
                .iter()
                .position(|value| *value != b'0' as u16)
                .unwrap_or(right.len() - 1)..];
            let result = left.len().cmp(&right.len()).then_with(|| left.cmp(right));
            if result != Ordering::Equal {
                return result;
            }
        } else {
            let result = prepared(
                model,
                left_digits.get(index).copied().unwrap_or(&[]),
                right_digits.get(index).copied().unwrap_or(&[]),
            );
            if result != Ordering::Equal {
                return result;
            }
        }
    }
    Ordering::Equal
}
fn case_key(model: &Collator, input: &[u16]) -> Vec<u8> {
    let normalized = map_valid_chunks(input, nfd);
    points(&normalized)
        .into_iter()
        .filter_map(char::from_u32)
        .filter_map(|value| {
            let value = value.to_string();
            let mapper = CaseMapper::new();
            let lower = mapper.lowercase_to_string(&value, &model.language);
            let upper = mapper.uppercase_to_string(&value, &model.language);
            (lower != upper).then_some(if value == lower {
                0
            } else if value == upper {
                2
            } else {
                1
            })
        })
        .collect()
}
pub fn compare(model: &Collator, left: &[u16], right: &[u16]) -> i8 {
    let prepared_left = prepare(model, left);
    let prepared_right = prepare(model, right);
    let mut result = if model.resolved.numeric {
        numeric(model, &prepared_left, &prepared_right)
    } else {
        prepared(model, &prepared_left, &prepared_right)
    };
    if result == Ordering::Equal
        && model.resolved.case_first != CaseFirst::False
        && matches!(
            model.resolved.sensitivity,
            Sensitivity::Case | Sensitivity::Variant
        )
    {
        // A canonical, per-string key preserves total ordering. base/accent
        // ignore case regardless of caseFirst; titlecase sorts between cases.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/collator.html#L261-L295
        result = case_key(model, left).cmp(&case_key(model, right));
        if model.resolved.case_first == CaseFirst::Upper {
            result = result.reverse();
        }
    }
    match result {
        Ordering::Less => -1,
        Ordering::Equal => 0,
        Ordering::Greater => 1,
    }
}
