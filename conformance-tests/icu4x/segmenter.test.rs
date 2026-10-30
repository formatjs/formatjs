use formatjs_intl_segmenter::{Granularity, Options, Segmenter};
use icu_locale_core::LanguageIdentifier;
use icu_segmenter::{
    GraphemeClusterSegmenter, SentenceSegmenter, WordSegmenter,
    options::{SentenceBreakOptions, WordBreakOptions},
};
use std::collections::BTreeMap;

fn encode(records: impl Iterator<Item = (usize, usize, Option<bool>)>) -> String {
    let values: Vec<_> = records
        .map(|(start, end, word)| {
            format!(
                "{start}:{end}:{}",
                word.map_or("-", |v| if v { "1" } else { "0" })
            )
        })
        .collect();
    if values.is_empty() {
        "-".into()
    } else {
        values.join(",")
    }
}

fn reference(locale: &str, granularity: &str, input: &[u16]) -> String {
    let locale: LanguageIdentifier = locale.parse().unwrap();
    match granularity {
        "grapheme" => {
            let boundaries: Vec<_> = GraphemeClusterSegmenter::new()
                .segment_utf16(input)
                .collect();
            encode(boundaries.windows(2).map(|pair| (pair[0], pair[1], None)))
        }
        "word" => {
            let mut options = WordBreakOptions::default();
            options.content_locale = Some(&locale);
            let model = WordSegmenter::try_new_auto(options).unwrap();
            let mut iterator = model.as_borrowed().segment_utf16(input);
            let mut start = iterator.next().unwrap();
            let mut records = Vec::new();
            while let Some(end) = iterator.next() {
                records.push((start, end, Some(iterator.is_word_like())));
                start = end;
            }
            encode(records.into_iter())
        }
        "sentence" => {
            let mut options = SentenceBreakOptions::default();
            options.content_locale = Some(&locale);
            let model = SentenceSegmenter::try_new(options).unwrap();
            let boundaries: Vec<_> = model.as_borrowed().segment_utf16(input).collect();
            encode(boundaries.windows(2).map(|pair| (pair[0], pair[1], None)))
        }
        other => panic!("Unknown granularity {other}"),
    }
}

#[test]
fn utf16_boundaries_and_status_match_independent_oracles() {
    let data = std::fs::read_to_string(std::env::var("SEGMENTER_FIXTURES").unwrap()).unwrap();
    let mut checked = 0;
    let mut mismatches = 0;
    let differences =
        std::fs::read_to_string(std::env::var("SEGMENTER_DIFFERENCES").unwrap()).unwrap();
    assert_eq!(differences.lines().count(), 101);
    let mut differences: BTreeMap<_, _> = differences
        .lines()
        .skip(1)
        .map(|row| {
            let fields: Vec<_> = row.split('\t').collect();
            assert_eq!(fields.len(), 6);
            assert!(!fields[5].is_empty());
            ((fields[0], fields[1], fields[2]), (fields[3], fields[4]))
        })
        .collect();
    assert_eq!(differences.len(), 100);
    for row in data.lines().skip(1) {
        let fields: Vec<_> = row.split('\t').collect();
        assert_eq!(fields.len(), 4);
        let input: Vec<_> = if fields[2] == "_" {
            Vec::new()
        } else {
            assert_eq!(fields[2].len() % 4, 0);
            (0..fields[2].len())
                .step_by(4)
                .map(|i| u16::from_str_radix(&fields[2][i..i + 4], 16).unwrap())
                .collect()
        };
        let granularity = match fields[1] {
            "grapheme" => Granularity::Grapheme,
            "word" => Granularity::Word,
            "sentence" => Granularity::Sentence,
            other => panic!("Unknown granularity {other}"),
        };
        let model = Segmenter::new(
            &[fields[0].into()],
            &Options {
                granularity,
                ..Default::default()
            },
        )
        .unwrap();
        let segments = model.segment(input.clone());
        let actual = encode(segments.iter().map(|record| {
            (
                record.index,
                record.index + record.segment.len(),
                record.is_word_like,
            )
        }));
        if actual != fields[3] {
            println!("DIFF\tformatjs\t{row}\t{actual}");
            mismatches += 1;
        }
        let reference = reference(fields[0], fields[1], &input);
        if let Some((expected_j, expected_x)) =
            differences.remove(&(fields[0], fields[1], fields[2]))
        {
            assert_eq!(fields[3], expected_j, "ICU4J difference changed: {row}");
            assert_ne!(expected_j, expected_x, "Redundant ICU difference: {row}");
            assert_eq!(reference, expected_x, "ICU4X difference changed: {row}");
        } else {
            if reference != fields[3] {
                println!("DIFF\ticu4x\t{row}\t{reference}");
                mismatches += 1;
            }
        }
        checked += 1;
    }
    assert_eq!(checked, 1770);
    assert!(differences.is_empty(), "Unused ICU4X differences");
    assert_eq!(mismatches, 0, "Unknown ICU differences");
}
