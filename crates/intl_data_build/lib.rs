use ciborium::value::Value;
use icu_plurals::provider::PluralRulesData;
use serde::de::DeserializeOwned;
use std::{
    collections::{BTreeMap, BTreeSet},
    error::Error,
    fs,
    path::{Path, PathBuf},
};

type Result<T> = std::result::Result<T, Box<dyn Error>>;

fn canonical(tag: &str) -> Result<String> {
    formatjs_intl_getcanonicallocales::canonicalize_locale(tag)
        .map_err(|error| error.to_string().into())
}

pub fn select_locale(available: &[String], requested: &str) -> Result<String> {
    let requested = canonical(requested)?;
    let language = requested.split('-').next().ok_or("Missing language")?;
    let candidates: Vec<_> = available
        .iter()
        .filter(|tag| tag.split('-').next() == Some(language))
        .cloned()
        .collect();
    formatjs_intl_locale::matcher::best_fit(&candidates, &[requested.clone()])
        .map_err(|error| error.to_string())?
        .ok_or_else(|| format!("No locale data for {requested}").into())
}

fn compile(value: &mut Value) -> Result<()> {
    match value {
        Value::Map(entries) => {
            let pack = entries
                .iter()
                .any(|(key, _)| matches!(key, Value::Text(name) if name == "locale"));
            for (key, value) in entries {
                if pack && matches!(key, Value::Text(name) if name == "compactExponents") {
                    if let Value::Map(styles) = value {
                        for (_, exponents) in styles {
                            if let Value::Map(exponents) = exponents {
                                for (key, _) in exponents {
                                    if let Value::Text(text) = key {
                                        *key = Value::Integer(text.parse::<i16>()?.into());
                                    }
                                }
                            }
                        }
                    }
                } else if pack
                    && matches!(key, Value::Text(key) if key == "cardinal" || key == "ordinal")
                    && matches!(value, Value::Map(_))
                {
                    let json: serde_json::Value = value.deserialized()?;
                    let text = serde_json::to_string(&json)?;
                    let rules: PluralRulesData<'_> = serde_json::from_str(&text)?;
                    *value = Value::Map(
                        [
                            ("zero", &rules.zero),
                            ("one", &rules.one),
                            ("two", &rules.two),
                            ("few", &rules.few),
                            ("many", &rules.many),
                        ]
                        .into_iter()
                        .map(|(name, rule)| {
                            Ok((Value::Text(name.into()), Value::serialized(rule)?))
                        })
                        .collect::<Result<Vec<_>>>()?,
                    );
                } else {
                    compile(value)?;
                }
            }
        }
        Value::Array(values) => {
            for value in values {
                compile(value)?;
            }
        }
        _ => {}
    }
    Ok(())
}

pub fn generate<T: DeserializeOwned>() -> Result<()> {
    let mut args: Vec<String> = std::env::args().skip(1).collect();
    if args.len() == 1 && args[0].starts_with('@') {
        args = fs::read_to_string(&args[0][1..])?
            .lines()
            .map(str::to_owned)
            .collect();
    }
    if args.len() % 2 != 0 {
        return Err("Expected flag/value pairs".into());
    }
    let mut inputs = Vec::new();
    let mut patches = Vec::new();
    let mut known = Vec::new();
    let mut locales = Vec::new();
    let mut module = None;
    let mut packs = None;
    let mut data_type = None;
    for pair in args.chunks_exact(2) {
        match pair[0].as_str() {
            "--input" => inputs.push(PathBuf::from(&pair[1])),
            "--patch" => patches.push(PathBuf::from(&pair[1])),
            "--locale" => locales.push(pair[1].clone()),
            "--known-locale" => known.push(canonical(&pair[1])?),
            "--module" => module = Some(PathBuf::from(&pair[1])),
            "--packs" => packs = Some(PathBuf::from(&pair[1])),
            "--type" => data_type = Some(pair[1].clone()),
            _ => return Err(format!("Unknown flag {}", pair[0]).into()),
        }
    }
    let module = module.ok_or("--module required")?;
    let packs = packs.ok_or("--packs required")?;
    let data_type = data_type.ok_or("--type required")?;
    if locales.is_empty() {
        return Err("At least one locale required".into());
    }
    let mut available = BTreeMap::new();
    for path in inputs {
        let text = fs::read_to_string(&path)?;
        let value: serde_json::Value = serde_json::from_str(&text)?;
        let locale = canonical(value["locale"].as_str().ok_or("Missing locale")?)?;
        let aliases = value["aliases"]
            .as_array()
            .map(|a| {
                a.iter()
                    .filter_map(|a| a.as_str().map(str::to_owned))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let aliases = aliases
            .iter()
            .map(|tag| canonical(tag))
            .collect::<Result<Vec<_>>>()?;
        available.insert(locale, (path, aliases));
    }
    let mut aliases = BTreeMap::new();
    for (locale, (_, tags)) in &available {
        for tag in tags {
            if !available.contains_key(tag) {
                aliases.entry(tag.clone()).or_insert_with(|| locale.clone());
            }
        }
    }
    let names: Vec<_> = available.keys().chain(aliases.keys()).cloned().collect();
    if known.is_empty() {
        known = names.clone();
    }
    let default = available
        .keys()
        .find(|tag| tag.as_str() == "en")
        .or_else(|| available.keys().next())
        .ok_or("No locale data inputs")?
        .clone();
    let mut selected = BTreeSet::new();
    for requested in &locales {
        if requested == "*" {
            selected.extend(available.keys().cloned());
        } else {
            select_locale(&known, requested)?;
            let requested = canonical(requested)?;
            let matched = select_locale(&names, &requested).or_else(|_| {
                formatjs_intl_locale::matcher::best_fit(&names, &[requested])
                    .map_err(|error| -> Box<dyn Error> { error.to_string().into() })
                    .map(|matched| matched.unwrap_or_else(|| default.clone()))
            })?;
            selected.insert(aliases.get(&matched).unwrap_or(&matched).clone());
        }
    }
    let mut calendar_patches: BTreeMap<String, Vec<serde_json::Value>> = BTreeMap::new();
    for path in patches {
        let patch: serde_json::Value = serde_json::from_str(&fs::read_to_string(path)?)?;
        let locale = canonical(patch["locale"].as_str().ok_or("Missing patch locale")?)?;
        if selected.contains(&locale) {
            calendar_patches.entry(locale).or_default().push(patch);
        }
    }
    fs::create_dir_all(&packs)?;
    let mut source = String::new();
    let mut order: Vec<_> = selected.into_iter().collect();
    order.sort_by_key(|tag| (tag != "en", tag.clone()));
    for (index, locale) in order.iter().enumerate() {
        let (input, _) = &available[locale];
        let mut json: serde_json::Value = serde_json::from_str(&fs::read_to_string(input)?)?;
        json["locale"] = locale.clone().into();
        for patch in calendar_patches.get(locale).into_iter().flatten() {
            let calendar = patch["calendar"].as_str().ok_or("Missing patch calendar")?;
            json["data"]["calendarData"][calendar] = patch["data"].clone();
            json["data"]["formats"][calendar] = patch["formats"].clone();
            let preferences = json["data"]["ca"]
                .as_array_mut()
                .ok_or("Missing calendar preferences")?;
            if !preferences.iter().any(|value| value == calendar) {
                preferences.push(calendar.into());
            }
        }
        let text = serde_json::to_string(&json)?;
        let _: T = serde_json::from_str(&text).map_err(|e| format!("{locale}: {e}"))?;
        let mut value = Value::serialized(&json)?;
        compile(&mut value)?;
        let mut bytes = Vec::new();
        ciborium::ser::into_writer(&value, &mut bytes)?;
        let _: T =
            formatjs_intl_data::decode(&bytes).map_err(|e| format!("Compiled {locale}: {e}"))?;
        let filename = format!("{locale}.cbor");
        fs::write(packs.join(&filename), bytes)?;
        let relative = Path::new(packs.file_name().ok_or("Missing pack directory")?).join(filename);
        source.push_str(&format!("static LOCALE_{index}: formatjs_intl_data::Compiled<{data_type}> = formatjs_intl_data::Compiled::new(include_bytes!({:?}));\n", relative.to_str().ok_or("Invalid path")?));
    }
    source.push_str("pub fn initialize(registry: &mut crate::registry::Registry) {\n");
    for (index, locale) in order.iter().enumerate() {
        let aliases = &available[locale].1;
        source.push_str(&format!(
            "registry.add_compiled({locale:?}, &{aliases:?}, &LOCALE_{index});\n"
        ));
    }
    source.push_str("}\n");
    fs::write(module, source)?;
    Ok(())
}
