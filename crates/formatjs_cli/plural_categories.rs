use crate::plural_categories_data::CARDINAL;

pub use crate::plural_categories_data::CLDR_VERSION;

/// CLDR cardinal categories a locale can select, or `None` when CLDR has no
/// rules for its language. Falls back by dropping trailing subtags, so
/// `sr-Latn-ME` uses `sr` and `pt-PT` keeps its own row.
pub fn cardinal_categories(locale: &str) -> Option<&'static [&'static str]> {
    let mut tag = locale.replace('_', "-");
    loop {
        if let Some((_, categories)) = CARDINAL
            .iter()
            .find(|(candidate, _)| candidate.eq_ignore_ascii_case(&tag))
        {
            return Some(categories);
        }
        tag.truncate(tag.rfind('-')?);
    }
}
