//! UCA level comparisons with the existing CLDR FractionalUCA/LDML profile.
use crate::{
    CaseFirst, Collator, Sensitivity,
    data::{Data, Element, PrimaryReordering},
};
use icu_normalizer::DecomposingNormalizer;
use serde_json::Value;
use std::{
    cmp::Ordering,
    collections::{BTreeMap, BTreeSet},
    sync::Arc,
};
const VARIABLE: i64 = 1;
const NUMERIC_PAYLOAD: i64 = 2;
const MERGE_SEPARATOR: i64 = 8;
const CASE_OVERRIDE: i64 = 64;
const SCALED_PRIMARY: i64 = 128;
const CASE_SHIFT: u32 = 4;
const PRIMARY_SCALE: i64 = 0x2000;
const REORDERING_STRIDE: i64 = 0x100000000 * PRIMARY_SCALE;
struct Entry {
    prefix: Vec<u32>,
    points: Vec<u32>,
    elements: Vec<Element>,
}
type Entries = BTreeMap<u32, Vec<Entry>>;

#[derive(Default)]
pub struct CompiledTailoring {
    entries: Entries,
    suppressed: BTreeSet<u32>,
    backwards_secondary: bool,
    reordering: Option<Vec<usize>>,
    tertiary_strength: Option<bool>,
}

// LDML inserts omitted core groups first and expands "others" in root order.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Script_Reordering
fn compile_reordering(data: &PrimaryReordering, codes: &[Value]) -> Vec<usize> {
    let mut explicit = BTreeSet::new();
    let groups: Vec<_> = codes
        .iter()
        .filter_map(Value::as_str)
        .filter_map(|code| match code {
            "others" | "Zzzz" => Some(None),
            _ => data
                .codes
                .get(code)
                .copied()
                .filter(|code| explicit.insert(*code))
                .map(Some),
        })
        .collect();
    let mut ranks = vec![0; data.starts.len()];
    let mut rank = 1;
    for code in ["space", "punct", "symbol", "currency", "digit"] {
        if let Some(&group) = data.codes.get(code)
            && explicit.insert(group)
        {
            ranks[group] = rank;
            rank += 1;
        }
    }
    let mut placed_others = false;
    for group in groups.into_iter().chain([None]) {
        if let Some(group) = group {
            ranks[group] = rank;
            rank += 1;
        } else if !placed_others {
            for (other, value) in ranks.iter_mut().enumerate() {
                if !explicit.contains(&other) {
                    *value = rank;
                    rank += 1;
                }
            }
            placed_others = true;
        }
    }
    ranks
}

fn reorder_primary(data: &PrimaryReordering, weight: i64, ranks: &[usize]) -> i64 {
    // The field separator and the trailing block have fixed positions.
    let primary = weight.div_euclid(PRIMARY_SCALE);
    if primary < data.starts[0] {
        return weight;
    }
    if primary >= data.trailing {
        return (ranks.len() as i64 + 1) * REORDERING_STRIDE + weight;
    }
    let group = data.starts.partition_point(|&start| start <= primary) - 1;
    ranks[group] as i64 * REORDERING_STRIDE + weight
}
// CompareStrings consumes UTF-16 and combines valid surrogate pairs.
// https://tc39.es/ecma402/#sec-collator-comparestrings
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
fn root_at(
    data: &Data,
    input: &[u32],
    start: usize,
    tailored: Option<&Entry>,
    suppress_root_context: bool,
    context: &[u32],
) -> (Vec<Element>, usize) {
    // Context-sensitive mappings precede root longest-match contractions.
    // https://www.unicode.org/reports/tr10/#Contextual_Sensitive_Mappings
    // https://www.unicode.org/reports/tr10/#Contractions
    let mut prefix = None;
    for entry in &data.prefixes {
        if !suppress_root_context
            && context.ends_with(&entry.prefix)
            && input[start..].starts_with(&entry.code_points)
            && prefix.is_none_or(|best: &crate::data::Prefix| {
                (entry.prefix.len(), entry.code_points.len())
                    > (best.prefix.len(), best.code_points.len())
            })
        {
            prefix = Some(entry);
        }
    }
    // Prefer longer context, then a longer target. Tailoring wins exact ties.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Context-Sensitive_Mappings
    if let Some(entry) = tailored.filter(|entry| {
        !entry.prefix.is_empty()
            && prefix.is_none_or(|root| {
                (entry.prefix.len(), entry.points.len())
                    >= (root.prefix.len(), root.code_points.len())
            })
    }) {
        return (entry.elements.clone(), entry.points.len());
    }
    if let Some(entry) = prefix {
        return (entry.elements.clone(), entry.code_points.len());
    }
    let mut node = &data.trie;
    let mut matched = None;
    let end = if suppress_root_context {
        start + 1
    } else {
        input.len()
    };
    for (offset, point) in input[start..end].iter().enumerate() {
        let Some(next) = node.next.get(point) else {
            break;
        };
        node = next;
        if let Some(index) = node.value {
            matched = Some((index, offset + 1));
        }
    }
    if let Some(entry) =
        tailored.filter(|entry| matched.is_none_or(|(_, length)| entry.points.len() >= length))
    {
        return (entry.elements.clone(), entry.points.len());
    }
    matched
        .map(|(index, length)| (data.elements[index].clone(), length))
        // UTS #10 §10.1.1–3 puts lone surrogates in the unassigned group.
        // CLDR radical-stroke weights share the Han group with explicit entries.
        // https://www.unicode.org/reports/tr10/#Implicit_Weights
        .unwrap_or_else(|| {
            let point = input[start];
            let range = data.han_ranges.partition_point(|bounds| bounds[0] <= point);
            let primary = if range != 0 && point < data.han_ranges[range - 1][1] {
                let [begin, _, offset] = data.han_ranges[range - 1];
                let rank = data.han_ranks[(offset + point - begin) as usize];
                data.han_implicit_start + i64::from(rank) * data.han_weight_step
            } else {
                data.primary_reordering.starts[data.primary_reordering.codes["unassigned"]]
                    + i64::from(point)
                    + 1
            };
            (vec![[primary, 5, 5, 0, 0]], 1)
        })
}
fn combining_class(data: &Data, point: u32) -> u32 {
    if point < 0x300 {
        return 0;
    }
    let index = data
        .combining_classes
        .partition_point(|range| range[0] <= point);
    index
        .checked_sub(1)
        .map(|i| data.combining_classes[i])
        .filter(|range| point <= range[1])
        .map_or(0, |range| range[2])
}

fn lookup_elements(
    data: &Data,
    input: &[u32],
    start: usize,
    tailoring: Option<&CompiledTailoring>,
    context: &[u32],
) -> (Vec<Element>, usize) {
    // max_by_key keeps the last equal mapping, matching LDML override order.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Context_Before
    let tailored = tailoring
        .and_then(|rules| rules.entries.get(&input[start]))
        .and_then(|entries| {
            entries
                .iter()
                .filter(|entry| {
                    context.ends_with(&entry.prefix) && input[start..].starts_with(&entry.points)
                })
                .max_by_key(|entry| (entry.prefix.len(), entry.points.len()))
        });
    let suppressed = tailoring.is_some_and(|rules| rules.suppressed.contains(&input[start]));
    root_at(data, input, start, tailored, suppressed, context)
}

fn append_collation_elements(
    data: &Data,
    result: &mut Vec<Element>,
    input: &[u32],
    tailoring: Option<&CompiledTailoring>,
    numeric: bool,
) {
    let mut run_ends = Vec::new();
    let mut start = 0;
    while start < input.len() {
        if numeric && let Some(digit) = decimal_digit(input[start], &data.decimal_digit_zeros) {
            start = append_numeric_run(data, result, input, start, digit);
            continue;
        }
        let context = &input[..start];
        let (mut matched, length) = lookup_elements(data, input, start, tailoring, context);
        let mut end = start + length;
        // UCA S2.1.1–3 extends a match across lower combining classes.
        // Retain the original prefix context and emit skipped marks after the match.
        // https://www.unicode.org/reports/tr10/#S2.1.1
        let first_class = if end + 1 < input.len() {
            combining_class(data, input[end])
        } else {
            0
        };
        if first_class != 0 {
            let mut probe = input[start..end].to_vec();
            let first_skipped = end;
            let mut consumed = Vec::new();
            let mut blocking = first_class;
            let mut index = end + 1;
            while index < input.len() {
                let point = input[index];
                let class = combining_class(data, point);
                if class == 0 {
                    break;
                }
                if blocking < class {
                    probe.push(point);
                    let (next, length) = lookup_elements(data, &probe, 0, tailoring, context);
                    if length == probe.len() {
                        matched = next;
                        consumed.push(index);
                        index += 1;
                        end = index;
                        continue;
                    }
                    probe.pop();
                }
                blocking = class;
                // Skip equal-class runs once even when several lookaheads overlap.
                if let Some(&known_end) = run_ends.get(index).filter(|&&next| next > index) {
                    index = known_end;
                } else {
                    let mut next = index + 1;
                    while next < input.len() && combining_class(data, input[next]) == class {
                        next += 1;
                    }
                    if next > index + 1 {
                        if run_ends.len() < next {
                            run_ends.resize(next, 0);
                        }
                        run_ends[index..next].fill(next);
                    }
                    index = next;
                }
            }
            result.extend(matched);
            if !consumed.is_empty() {
                let mut skipped = Vec::new();
                let mut unmatched_start = first_skipped;
                for index in consumed {
                    skipped.extend_from_slice(&input[unmatched_start..index]);
                    unmatched_start = index + 1;
                }
                append_collation_elements(data, result, &skipped, tailoring, false);
            }
        } else {
            result.extend(matched);
        }
        start = end;
    }
}

fn elements(
    data: &Data,
    input: &[u32],
    tailoring: Option<&CompiledTailoring>,
    numeric: bool,
) -> Vec<Element> {
    let mut result = Vec::new();
    append_collation_elements(data, &mut result, input, tailoring, numeric);
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
        "quaternary" => 3,
        _ => 4,
    }
}
fn relation_group(
    data: &Data,
    tailoring: &mut CompiledTailoring,
    reset: &[Value],
    relations: &[&Vec<Value>],
) {
    if relations.is_empty() {
        return;
    }
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Logical_Reset_Positions
    let reset_value = text(reset, 1);
    let mut anchor = if let Some(element) = data.logical_resets.get(reset_value) {
        vec![*element]
    } else {
        elements(
            data,
            &nfd(reset_value).chars().map(u32::from).collect::<Vec<_>>(),
            Some(tailoring),
            false,
        )
    };
    if anchor.is_empty() {
        return;
    }
    // Tailoring adjusts the tertiary value independently of the root case bits.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
    for element in &mut anchor {
        element[2] = tertiary_weight(element);
        element[4] |= CASE_OVERRIDE;
    }
    let before = reset
        .get(2)
        .and_then(Value::as_u64)
        .map(|value| value as usize);
    let mut totals = [0i64; 5];
    for rule in relations {
        totals[level(rule)] += 1;
    }
    let mut seen = [0i64; 4];
    let mut previous = anchor.clone();
    let mut secondary_anchor = None;
    for rule in relations {
        let level = level(rule);
        if level < 4 {
            seen[level] += 1;
            // LDML resets/relations modify the last non-zero CE at this strength.
            // Secondary relations stay within the most recent primary group.
            // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
            // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-collation.md#L765-L775
            let source = match level {
                2 | 3 => &previous,
                1 => secondary_anchor.as_ref().unwrap_or(&anchor),
                _ => &anchor,
            };
            let index = source
                .iter()
                .rposition(|element| element[..=level].iter().any(|weight| *weight != 0));
            let mut element = index.map(|index| source[index]).unwrap_or([0; 5]);
            let offset = if before == Some(level + 1) && (level != 1 || secondary_anchor.is_none())
            {
                seen[level] - totals[level] - 1
            } else {
                seen[level]
            };
            if level == 0 {
                element[0] = primary_weight(&element) + offset;
                element[4] |= SCALED_PRIMARY;
            } else {
                element[level] += offset;
            }
            let mut current: Vec<_> = source.iter().take(index.unwrap_or(0)).copied().collect();
            current.push(element);
            previous = current;
            if level == 0 {
                secondary_anchor = Some(previous.clone());
                seen[1] = 0;
            }
        }
        let points = nfd(text(rule, 2))
            .chars()
            .map(u32::from)
            .collect::<Vec<_>>();
        if let Some(&first) = points.first() {
            let mut weights = tailored_case_elements(data, &points, &previous);
            // Appended extension CEs retain their original case weights.
            // https://www.unicode.org/reports/tr35/tr35-collation.html#Expansions
            let extension: Vec<_> = nfd(text(rule, 3)).chars().map(u32::from).collect();
            weights.extend(elements(data, &extension, Some(tailoring), false));
            let prefix = nfd(text(rule, 4)).chars().map(u32::from).collect();
            tailoring.entries.entry(first).or_default().push(Entry {
                prefix,
                points,
                elements: weights,
            });
        }
    }
}

// LDML distributes root case bits across tailored primary CEs.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
fn tailored_case_elements(data: &Data, points: &[u32], tailored: &[Element]) -> Vec<Element> {
    let root_cases: Vec<_> = elements(data, points, None, false)
        .iter()
        .filter(|element| element[0] != 0)
        .map(element_case)
        .collect();
    let primary_count = tailored.iter().filter(|element| element[0] != 0).count();
    let mut index = 0;
    tailored
        .iter()
        .map(|&element| {
            let mut element = element;
            if element[0] != 0 {
                let mut weight = root_cases.get(index).copied().unwrap_or(0);
                if index + 1 == primary_count
                    && root_cases
                        .iter()
                        .skip(index + 1)
                        .any(|&value| value != weight)
                {
                    weight = 1;
                }
                element[4] =
                    (element[4] & !(3 << CASE_SHIFT)) | CASE_OVERRIDE | (weight << CASE_SHIFT);
                index += 1;
            }
            element
        })
        .collect()
}
fn find_tailoring_locale<'a>(data: &Data, mut locale: &'a str, collation: &str) -> &'a str {
    while locale != "root"
        && !data
            .tailorings
            .get(locale)
            .is_some_and(|values| values.contains_key(collation))
    {
        locale = locale.rsplit_once('-').map_or("root", |(parent, _)| parent);
    }
    locale
}

fn apply_tailoring(
    data: &Data,
    locale: &str,
    collation: &str,
    tailoring: &mut CompiledTailoring,
    active: &mut BTreeSet<String>,
) {
    let key = format!("{locale}|{collation}");
    if !active.insert(key.clone()) {
        return;
    }
    if let Some(packed) = data
        .tailorings
        .get(locale)
        .and_then(|values| values.get(collation))
    {
        let mut reset: Option<&Vec<Value>> = None;
        let mut relations = Vec::new();
        for rule in &packed.rules {
            match text(rule, 0) {
                "setting" => {
                    if let Some(reset) = reset.take() {
                        relation_group(data, tailoring, reset, &relations);
                    }
                    relations.clear();
                    match text(rule, 1) {
                        "backwards" => tailoring.backwards_secondary = text(rule, 2) == "2",
                        "reorder" => {
                            if let Some(codes) = rule.get(2).and_then(Value::as_array) {
                                tailoring.reordering =
                                    Some(compile_reordering(&data.primary_reordering, codes));
                            }
                        }
                        "strength" => tailoring.tertiary_strength = Some(text(rule, 2) == "3"),
                        "suppressContractions" => {
                            if let Some(points) = rule.get(2).and_then(Value::as_array) {
                                // Suppression removes existing contexts. Later rules can add new ones.
                                // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
                                for point in
                                    points.iter().filter_map(Value::as_u64).map(|p| p as u32)
                                {
                                    tailoring.suppressed.insert(point);
                                    if let Some(bucket) = tailoring.entries.get_mut(&point) {
                                        bucket.retain(|entry| {
                                            entry.prefix.is_empty() && entry.points.len() == 1
                                        });
                                    }
                                }
                            }
                        }
                        "import" => {
                            // Apply the imported rules to the current mappings.
                            // https://www.unicode.org/reports/tr35/tr35-collation.html#Special_Purpose_Commands
                            let tag = text(rule, 2);
                            let (locale, collation) =
                                tag.rsplit_once("-u-co-").unwrap_or((tag, "standard"));
                            let locale = if locale == "und" { "root" } else { locale };
                            let source = find_tailoring_locale(data, locale, collation);
                            apply_tailoring(data, source, collation, tailoring, active);
                        }
                        _ => {}
                    }
                }
                "reset" => {
                    if let Some(reset) = reset {
                        relation_group(data, tailoring, reset, &relations);
                    }
                    relations.clear();
                    reset = Some(rule);
                }
                "relation" => relations.push(rule),
                _ => {}
            }
        }
        if let Some(reset) = reset {
            relation_group(data, tailoring, reset, &relations);
        }
    }
    active.remove(&key);
}

pub fn tailoring(data: &Data, locale: &str, collation: &str) -> Arc<CompiledTailoring> {
    let locale = find_tailoring_locale(data, locale, collation);
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
    let mut compiled = CompiledTailoring::default();
    apply_tailoring(data, locale, collation, &mut compiled, &mut BTreeSet::new());
    let mut cache = data.cache.lock().expect("collation cache poisoned");
    cache
        .entry(key)
        .or_insert_with(|| Arc::new(compiled))
        .clone()
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
// LDML backwards 2 reverses secondary weights within each U+FFFE segment.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Setting_Options
// https://www.unicode.org/reports/tr10/#Backward_Accents
fn backwards_secondary_weights(elements: &[Element]) -> Vec<i64> {
    let mut weights = Vec::new();
    for (index, segment) in elements
        .split(|element| element[4] & MERGE_SEPARATOR != 0)
        .enumerate()
    {
        if index != 0 {
            weights.push(0);
        }
        weights.extend(
            segment
                .iter()
                .rev()
                .map(|element| comparison_weight(element, 1))
                .filter(|weight| *weight != 0),
        );
    }
    weights
}

// UTS #10 §4 suppresses primary-ignorable elements after a shifted variable.
// ignorePunctuation also omits the variable's shifted quaternary weight.
// https://www.unicode.org/reports/tr10/#Variable_Weighting
fn omit_variable_weights(elements: &mut Vec<Element>) {
    let mut after_variable = false;
    elements.retain(|element| {
        if element[0] != 0 {
            after_variable = element[4] & VARIABLE != 0;
        }
        !after_variable
    });
}

fn prepared(model: &Collator, left: &[u16], right: &[u16]) -> Ordering {
    let numeric = model.resolved.numeric;
    let mut left = elements(model.data, &points(left), Some(&model.tailoring), numeric);
    let mut right = elements(model.data, &points(right), Some(&model.tailoring), numeric);
    if model.resolved.ignore_punctuation {
        omit_variable_weights(&mut left);
        omit_variable_weights(&mut right);
    }
    let levels: &[usize] = match model.resolved.sensitivity {
        Sensitivity::Base => &[0],
        Sensitivity::Accent => &[0, 1],
        Sensitivity::Case => &[0, 2],
        Sensitivity::Variant if model.tailoring.tertiary_strength == Some(true) => &[0, 1, 2],
        Sensitivity::Variant => &[0, 1, 2, 3],
    };
    // Compare level by level after applying variable weighting.
    // https://www.unicode.org/reports/tr10/#Multi_Level_Comparison
    for &level in levels {
        if level == 1 && model.tailoring.backwards_secondary {
            let result =
                backwards_secondary_weights(&left).cmp(&backwards_secondary_weights(&right));
            if result != Ordering::Equal {
                return result;
            }
            continue;
        }
        let weights = |elements: &[Element]| {
            elements
                .iter()
                .map(|element| match level {
                    2 => tertiary_comparison_weight(
                        element,
                        model.resolved.sensitivity,
                        model.resolved.case_first,
                    ),
                    _ => {
                        let weight = comparison_weight(element, level);
                        if level == 0
                            && element[4] & NUMERIC_PAYLOAD == 0
                            && let Some(ranks) = &model.tailoring.reordering
                        {
                            reorder_primary(&model.data.primary_reordering, weight, ranks)
                        } else {
                            weight
                        }
                    }
                })
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
fn decimal_digit(point: u32, zeros: &[u32]) -> Option<u32> {
    if point < 0x80 {
        return (0x30..=0x39).contains(&point).then(|| point - 0x30);
    }
    let index = zeros.partition_point(|&zero| zero <= point);
    let digit = point - zeros[index.checked_sub(1)?];
    (digit < 10).then_some(digit)
}

// ECMA-402 §10.1.1 enables LDML kn. Digit runs compare at primary strength.
// https://tc39.es/ecma402/#sec-initializecollator
// https://www.unicode.org/reports/tr35/tr35-collation.html#Setting_Options
fn append_numeric_run(
    data: &Data,
    elements: &mut Vec<Element>,
    points: &[u32],
    mut index: usize,
    mut digit: u32,
) -> usize {
    let mut digits = Vec::new();
    loop {
        if digit != 0 || !digits.is_empty() {
            digits.push(digit);
        }
        index += 1;
        let Some(next) = points
            .get(index)
            .and_then(|&point| decimal_digit(point, &data.decimal_digit_zeros))
        else {
            break;
        };
        digit = next;
    }
    elements.push(data.numeric_ordering_element);
    // Reserve zero for ignorable weights. A zero run has no significant digits.
    elements.push([digits.len() as i64 + 1, 0, 0, 0, NUMERIC_PAYLOAD]);
    elements.extend(
        digits
            .into_iter()
            .map(|digit| [i64::from(digit) + 1, 0, 0, 0, NUMERIC_PAYLOAD]),
    );
    index
}

fn element_case(element: &Element) -> i64 {
    if element[4] & CASE_OVERRIDE != 0 {
        return (element[4] >> CASE_SHIFT) & 3;
    }
    // FractionalUCA stores root case bits in the first tertiary byte.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
    let mut tertiary = element[2];
    while tertiary > 0xff {
        tertiary >>= 8;
    }
    tertiary >> 6
}

fn tertiary_weight(element: &Element) -> i64 {
    let weight = element[2];
    if element[4] & CASE_OVERRIDE != 0 {
        return weight;
    }
    let mut first_byte = weight;
    let mut scale = 1;
    while first_byte > 0xff {
        first_byte >>= 8;
        scale <<= 8;
    }
    weight - (first_byte & 0xc0) * scale
}

fn case_weight(element: &Element, case_first: CaseFirst) -> i64 {
    let bits = element_case(element);
    if case_first == CaseFirst::Upper {
        3 - bits
    } else {
        1 + bits
    }
}

// LDML Case Parameters combine case and tertiary weights for caseFirst.
// https://www.unicode.org/reports/tr35/tr35-collation.html#Case_Parameters
fn tertiary_comparison_weight(
    element: &Element,
    sensitivity: Sensitivity,
    case_first: CaseFirst,
) -> i64 {
    if sensitivity == Sensitivity::Case {
        return if element[0] == 0 {
            0
        } else {
            case_weight(element, case_first)
        };
    }
    let tertiary = tertiary_weight(element);
    if case_first == CaseFirst::False || tertiary == 0 {
        return tertiary;
    }
    // Pure tertiary CEs stay above primary and secondary CEs in either order.
    let order = if element[0] == 0 && element[1] == 0 {
        4
    } else {
        case_weight(element, case_first)
    };
    (order << 32) + tertiary
}

fn comparison_weight(element: &Element, level: usize) -> i64 {
    if level != 0 || element[4] & NUMERIC_PAYLOAD != 0 {
        return element[level];
    }
    primary_weight(element)
}

fn primary_weight(element: &Element) -> i64 {
    let mut weight = element[0];
    if element[4] & SCALED_PRIMARY != 0 {
        return weight;
    }
    // Align FractionalUCA bytes, then leave space between root weights for rules.
    // https://www.unicode.org/reports/tr35/tr35-collation.html#Orderings
    while weight > 0 && weight < 0x1000000 {
        weight *= 0x100;
    }
    weight * PRIMARY_SCALE
}

pub fn compare(model: &Collator, left: &[u16], right: &[u16]) -> i8 {
    // Normalize before tailoring. Sensitivity selects levels after matching.
    // https://tc39.es/ecma402/#sec-collator-comparestrings
    let prepared_left = map_valid_chunks(left, nfd);
    let prepared_right = map_valid_chunks(right, nfd);
    match prepared(model, &prepared_left, &prepared_right) {
        Ordering::Less => -1,
        Ordering::Equal => 0,
        Ordering::Greater => 1,
    }
}
