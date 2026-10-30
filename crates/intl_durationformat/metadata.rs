use crate::Error;
use serde::Deserialize;
use std::{collections::BTreeMap, sync::OnceLock};
#[derive(Deserialize)]
pub(crate) struct LocaleData {
    pub nu: Vec<String>,
    #[serde(default)]
    pub separator: BTreeMap<String, String>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Metadata {
    pub available: Vec<String>,
    pub default_separator: String,
    pub locales: BTreeMap<String, LocaleData>,
    pub numbering_systems: Vec<String>,
}
pub(crate) fn load() -> Result<&'static Metadata, Error> {
    static DATA: OnceLock<Result<Metadata, String>> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(include_str!(env!("FORMATJS_DURATION_METADATA")))
            .map_err(|error| error.to_string())
    })
    .as_ref()
    .map_err(|error| Error::InvalidData(error.clone()))
}
