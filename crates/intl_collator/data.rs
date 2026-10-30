//! Static CLDR data from the existing Bazel collation pipeline. No locale registry:
//! this polyfill loads one compiled dataset, matching the TS package.
use crate::{Error, compare::Entry};
use serde::Deserialize;
use serde_json::Value;
use std::{
    collections::{BTreeMap, HashMap},
    sync::{Arc, Mutex, OnceLock},
};
pub type Element = [i64; 5];
#[derive(Deserialize)]
pub struct Trie {
    pub value: Option<usize>,
    #[serde(default)]
    pub next: BTreeMap<u32, Trie>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Prefix {
    pub prefix: Vec<u32>,
    pub code_points: Vec<u32>,
    pub elements: Vec<Element>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Metadata {
    pub co: Vec<String>,
    pub kn: Vec<String>,
    pub kf: Vec<String>,
    pub default_collation: Option<String>,
    pub sensitivity: crate::Sensitivity,
    pub ignore_punctuation: bool,
}
#[derive(Deserialize)]
pub struct Tailoring {
    pub rules: Vec<Vec<Value>>,
}
#[derive(Deserialize)]
pub struct Data {
    pub available: Vec<String>,
    pub locales: BTreeMap<String, Metadata>,
    pub elements: Vec<Vec<Element>>,
    pub prefixes: Vec<Prefix>,
    pub trie: Trie,
    pub tailorings: BTreeMap<String, BTreeMap<String, Tailoring>>,
    #[serde(skip)]
    pub cache: Mutex<HashMap<String, Arc<Vec<Entry>>>>,
}
pub fn load() -> Result<&'static Data, Error> {
    static DATA: OnceLock<Result<Data, String>> = OnceLock::new();
    DATA.get_or_init(|| {
        serde_json::from_str(include_str!(env!("FORMATJS_COLLATION_DATA")))
            .map_err(|error| error.to_string())
    })
    .as_ref()
    .map_err(|error| Error::InvalidData(error.clone()))
}
