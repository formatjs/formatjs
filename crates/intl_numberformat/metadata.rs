use crate::Error;
use serde::Deserialize;
use std::{
    collections::{BTreeMap, BTreeSet},
    sync::OnceLock,
};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct Metadata {
    pub currency_digits: BTreeMap<String, u8>,
    pub digits: BTreeMap<String, Vec<String>>,
    pub units: BTreeSet<String>,
}
pub(crate) fn load() -> Result<&'static Metadata, Error> {
    static DATA: OnceLock<Result<Metadata, String>> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(include_str!(env!("FORMATJS_NUMBER_METADATA")))
            .map_err(|error| error.to_string())
    })
    .as_ref()
    .map_err(|error| Error::InvalidData(error.clone()))
}
