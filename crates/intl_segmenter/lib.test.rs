use formatjs_intl_segmenter::{
    Error, Granularity, LocaleMatcher, Options, Segmenter, supported_locales,
};

fn model(locale: &str, granularity: Granularity) -> Segmenter {
    Segmenter::new(
        &[locale.to_owned()],
        &Options {
            granularity,
            ..Options::default()
        },
    )
    .unwrap()
}
fn units(text: &str) -> Vec<u16> {
    text.encode_utf16().collect()
}

#[test]
fn grapheme_clusters_preserve_utf16_indices_and_original_input() {
    let model = model("en", Granularity::Grapheme);
    let input = units("a\u{301}😀👩‍👩‍👧‍👦🇺🇸\r\n");
    let segments = model.segment(input.clone());
    let indices: Vec<_> = segments.iter().map(|record| record.index).collect();
    assert_eq!(indices, [0, 2, 4, 15, 19]);
    assert_eq!(
        segments
            .iter()
            .flat_map(|record| record.segment.iter().copied())
            .collect::<Vec<_>>(),
        input
    );
    assert!(
        segments
            .iter()
            .all(|record| record.input == input && record.is_word_like.is_none())
    );
    assert_eq!(segments.containing(3).unwrap().index, 2);
    assert_eq!(segments.containing(20).unwrap().index, 19);
    assert!(segments.containing(21).is_none());
}

#[test]
fn empty_and_ill_formed_utf16_remain_exact() {
    let model = model("en", Granularity::Grapheme);
    let empty = model.segment(vec![]);
    assert!(empty.is_empty());
    assert!(empty.containing(0).is_none());
    assert!(empty.cursor().next_record().is_none());
    let input = vec![0xd800, 0x61, 0xdc00];
    let segments = model.segment(input.clone());
    assert_eq!(segments.len(), 3);
    assert_eq!(segments.input(), input);
    assert_eq!(segments.record(0).unwrap().segment, [0xd800]);
    assert_eq!(segments.record(2).unwrap().segment, [0xdc00]);
}

#[test]
fn independent_cursors_own_data_and_stay_exhausted() {
    let segments = model("en", Granularity::Grapheme).segment(units("a😀b"));
    let mut first = segments.cursor();
    let mut second = segments.cursor();
    drop(segments);
    assert_eq!(first.next_record().unwrap().index, 0);
    assert_eq!(first.next_record().unwrap().index, 1);
    assert_eq!(second.next_record().unwrap().index, 0);
    assert_eq!(first.next_record().unwrap().index, 3);
    assert!(first.next_record().is_none());
    assert!(first.next_record().is_none());
    assert_eq!(second.next_record().unwrap().segment, units("😀"));
}

#[test]
fn word_status_and_sentence_segments_match_ported_cases() {
    let words = model("en", Granularity::Word).segment(units("Hello, world! 123"));
    let result: Vec<_> = words
        .iter()
        .map(|record| {
            (
                String::from_utf16(record.segment).unwrap(),
                record.is_word_like,
            )
        })
        .collect();
    assert_eq!(
        result,
        [
            ("Hello", true),
            (",", false),
            (" ", false),
            ("world", true),
            ("!", false),
            (" ", false),
            ("123", true)
        ]
        .into_iter()
        .map(|(text, word)| (text.to_owned(), Some(word)))
        .collect::<Vec<_>>()
    );
    let sentences = model("en", Granularity::Sentence).segment(units("One. Two! Three?"));
    assert_eq!(
        sentences
            .iter()
            .map(|record| String::from_utf16(record.segment).unwrap())
            .collect::<Vec<_>>(),
        ["One. ", "Two! ", "Three?"]
    );
    assert!(sentences.iter().all(|record| record.is_word_like.is_none()));
}

#[test]
fn complex_scripts_use_icu_models() {
    let japanese = model("ja", Granularity::Word).segment(units("こんにちは世界"));
    assert_eq!(
        japanese
            .iter()
            .map(|record| record.index)
            .collect::<Vec<_>>(),
        [0, 5]
    );
    assert!(
        japanese
            .iter()
            .all(|record| record.is_word_like == Some(true))
    );
    let thai = model("th", Granularity::Word).segment(units("ทุกสองสัปดาห์"));
    assert_eq!(
        thai.iter().map(|record| record.index).collect::<Vec<_>>(),
        [0, 3, 6]
    );
}

#[test]
fn locale_matching_uses_canonical_tags_and_en_default() {
    let opts = Options {
        locale_matcher: LocaleMatcher::Lookup,
        ..Options::default()
    };
    assert_eq!(
        Segmenter::new(&["zz-ZZ".into()], &opts)
            .unwrap()
            .resolved_options()
            .locale,
        "en"
    );
    assert_eq!(
        Segmenter::new(&["en-US-u-nu-arab".into()], &opts)
            .unwrap()
            .resolved_options()
            .locale,
        "en-US"
    );
    assert_eq!(
        supported_locales(&["fr-FR-u-nu-arab".into()]).unwrap(),
        ["fr-FR-u-nu-arab"]
    );
    assert!(matches!(
        Segmenter::new(&["en_US".into()], &opts),
        Err(Error::InvalidLocale)
    ));
}

#[test]
fn indic_letters_are_words_but_isolated_marks_and_emoji_are_not() {
    let segmenter = Segmenter::new(
        &["en".into()],
        &Options {
            granularity: Granularity::Word,
            ..Default::default()
        },
    )
    .unwrap();
    for (text, flags) in [
        ("नमस्ते दुनिया।", vec![true, false, true, false]),
        ("\u{0308}", vec![false]),
        ("❤️", vec![false]),
    ] {
        let segments = segmenter.segment(text.encode_utf16().collect());
        assert_eq!(
            segments
                .iter()
                .map(|part| part.is_word_like.unwrap())
                .collect::<Vec<_>>(),
            flags
        );
    }
}
