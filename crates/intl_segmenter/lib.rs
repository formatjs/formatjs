//! ECMA-402 Segmenter over UTF-16. ICU4X owns Unicode boundary selection;
//! host adapters supply observable coercion, brands and ordinary JS objects.

use icu_locale_core::LanguageIdentifier;
use icu_properties::{
    CodePointMapData,
    props::{GeneralCategory, GeneralCategoryGroup},
};
use icu_segmenter::{
    GraphemeClusterSegmenter, SentenceSegmenter, WordSegmenter,
    options::{SentenceBreakOptions, WordBreakOptions},
};
use serde::{Deserialize, Serialize};
use std::sync::{Arc, OnceLock};

mod data_generated;
pub mod ffi;

#[derive(Debug, PartialEq, Eq)]
pub enum Error {
    InvalidLocale,
    InvalidData(String),
}
impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self:?}")
    }
}
impl std::error::Error for Error {}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Granularity {
    #[default]
    Grapheme,
    Word,
    Sentence,
}
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
pub enum LocaleMatcher {
    #[serde(rename = "best fit")]
    #[default]
    BestFit,
    #[serde(rename = "lookup")]
    Lookup,
}
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Options {
    #[serde(default)]
    pub locale_matcher: LocaleMatcher,
    #[serde(default)]
    pub granularity: Granularity,
}
#[derive(Serialize)]
pub struct ResolvedOptions {
    pub locale: String,
    pub granularity: Granularity,
}
enum Engine {
    Grapheme,
    Word(WordSegmenter),
    Sentence(SentenceSegmenter),
}
pub struct Segmenter {
    locale: String,
    granularity: Granularity,
    engine: Engine,
}
pub fn available_locales() -> &'static [String] {
    static AVAILABLE: OnceLock<Vec<String>> = OnceLock::new();
    AVAILABLE.get_or_init(|| {
        data_generated::AVAILABLE_LOCALES
            .iter()
            .map(|tag| (*tag).to_owned())
            .collect()
    })
}
pub fn supported_locales(requested: &[String]) -> Result<Vec<String>, Error> {
    let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
        .map_err(|_| Error::InvalidLocale)?;
    Ok(formatjs_intl_locale::matcher::supported(
        available_locales(),
        &requested,
    ))
}
impl Segmenter {
    pub fn new(requested: &[String], options: &Options) -> Result<Self, Error> {
        // ResolveOptions: canonical requested tags, no relevant extension keys;
        // the implementation default is en, matching the TS root-rule fallback.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L21-L29
        let requested = formatjs_intl_getcanonicallocales::get_canonical_locales(requested)
            .map_err(|_| Error::InvalidLocale)?;
        let locale = match options.locale_matcher {
            LocaleMatcher::Lookup => {
                formatjs_intl_locale::matcher::lookup(available_locales(), &requested)
            }
            LocaleMatcher::BestFit => {
                formatjs_intl_locale::matcher::best_fit(available_locales(), &requested)
                    .map_err(|_| Error::InvalidLocale)?
            }
        }
        .unwrap_or_else(|| "en".into());
        let content_locale: LanguageIdentifier =
            locale.parse().map_err(|_| Error::InvalidLocale)?;
        // FindBoundary is locale-sensitive and implementation-defined. Keep
        // ICU's content-locale tailorings and automatic complex-script models.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L393-L406
        let engine = match options.granularity {
            Granularity::Grapheme => Engine::Grapheme,
            Granularity::Word => {
                let mut opts = WordBreakOptions::default();
                opts.content_locale = Some(&content_locale);
                Engine::Word(
                    WordSegmenter::try_new_auto(opts)
                        .map_err(|error| Error::InvalidData(error.to_string()))?,
                )
            }
            Granularity::Sentence => {
                let mut opts = SentenceBreakOptions::default();
                opts.content_locale = Some(&content_locale);
                Engine::Sentence(
                    SentenceSegmenter::try_new(opts)
                        .map_err(|error| Error::InvalidData(error.to_string()))?,
                )
            }
        };
        Ok(Self {
            locale,
            granularity: options.granularity,
            engine,
        })
    }
    pub fn resolved_options(&self) -> ResolvedOptions {
        ResolvedOptions {
            locale: self.locale.clone(),
            granularity: self.granularity,
        }
    }
    pub fn segment(&self, input: Vec<u16>) -> Segments {
        // CreateSegmentsObject retains the original code units. Precompute its
        // boundary index once; iterators and containing() share immutable data.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L187-L191
        let mut boundaries = Vec::new();
        match &self.engine {
            Engine::Grapheme => {
                let indices: Vec<_> = GraphemeClusterSegmenter::new()
                    .segment_utf16(&input)
                    .collect();
                for pair in indices.windows(2) {
                    boundaries.push(Boundary {
                        start: pair[0],
                        end: pair[1],
                        word_like: None,
                    });
                }
            }
            Engine::Sentence(segmenter) => {
                let indices: Vec<_> = segmenter.as_borrowed().segment_utf16(&input).collect();
                for pair in indices.windows(2) {
                    boundaries.push(Boundary {
                        start: pair[0],
                        end: pair[1],
                        word_like: None,
                    });
                }
            }
            Engine::Word(segmenter) => {
                let mut iterator = segmenter.as_borrowed().segment_utf16(&input);
                let mut start = iterator.next().unwrap_or(0);
                while let Some(end) = iterator.next() {
                    boundaries.push(Boundary {
                        start,
                        end,
                        // ICU rule status can classify Indic ALetter sequences as None.
                        // Preserve ICU statuses, then recognize Unicode letters/numbers;
                        // isolated marks and variation selectors remain non-word-like.
                        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L372
                        word_like: Some(
                            iterator.is_word_like()
                                || char::decode_utf16(input[start..end].iter().copied())
                                    .filter_map(Result::ok)
                                    .any(|ch| {
                                        let category =
                                            CodePointMapData::<GeneralCategory>::new().get(ch);
                                        GeneralCategoryGroup::Letter.contains(category)
                                            || GeneralCategoryGroup::Number.contains(category)
                                    }),
                        ),
                    });
                    start = end;
                }
            }
        }
        Segments(Arc::new(SegmentsData { input, boundaries }))
    }
}
struct Boundary {
    start: usize,
    end: usize,
    word_like: Option<bool>,
}
struct SegmentsData {
    input: Vec<u16>,
    boundaries: Vec<Boundary>,
}
#[derive(Clone)]
pub struct Segments(Arc<SegmentsData>);
pub struct SegmentData<'a> {
    pub segment: &'a [u16],
    pub index: usize,
    pub input: &'a [u16],
    pub is_word_like: Option<bool>,
}
impl Segments {
    pub fn input(&self) -> &[u16] {
        &self.0.input
    }
    pub fn len(&self) -> usize {
        self.0.boundaries.len()
    }
    pub fn is_empty(&self) -> bool {
        self.0.boundaries.is_empty()
    }
    pub fn record(&self, index: usize) -> Option<SegmentData<'_>> {
        let boundary = self.0.boundaries.get(index)?;
        // CreateSegmentDataObject 1–13: slice the original string, retain its
        // UTF-16 start index/input, and expose isWordLike only for word mode.
        // ICU's status excludes punctuation/space as recommended by the spec.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L358-L372
        Some(SegmentData {
            segment: &self.0.input[boundary.start..boundary.end],
            index: boundary.start,
            input: &self.0.input,
            is_word_like: boundary.word_like,
        })
    }
    pub fn iter(&self) -> impl Iterator<Item = SegmentData<'_>> {
        (0..self.len()).map(|index| self.record(index).expect("index from boundary table"))
    }
    pub fn containing(&self, index: usize) -> Option<SegmentData<'_>> {
        // containing 7–10: reject past-end indices; find the immediately enclosing
        // UTF-16 boundaries, including a code unit inside a surrogate pair.
        // Host adapters perform ToIntegerOrInfinity first (step 6).
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L214-L218
        if index >= self.0.input.len() {
            return None;
        }
        let found = self
            .0
            .boundaries
            .partition_point(|boundary| boundary.start <= index);
        found.checked_sub(1).and_then(|index| self.record(index))
    }
    pub fn cursor(&self) -> Cursor {
        // Each iterator starts at zero and retains the input independently.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L225-L230
        Cursor {
            segments: self.clone(),
            position: 0,
        }
    }
}
pub struct Cursor {
    segments: Segments,
    position: usize,
}
impl Cursor {
    pub fn next_record(&mut self) -> Option<SegmentData<'_>> {
        // next 6–11: exhaustion stays exhausted; advance before returning data.
        // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/segmenter.html#L291-L298
        if self.position >= self.segments.len() {
            return None;
        }
        let index = self.position;
        self.position += 1;
        self.segments.record(index)
    }
}
