use base64::Engine;
use formatjs_icu_messageformat::{IcuMessageFormat, Value, Values};
use formatjs_intl::{MessageCatalog, negotiate_locale};
use icu_locale::Locale;
use pyo3::exceptions::{PyTypeError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDict};
use sha2::{Digest, Sha512};
use std::collections::HashMap;

const GENERATED_ID_LENGTH: usize = 10;

fn normalize_whitespace(value: &str) -> String {
    let trimmed = value.trim_matches(char::is_whitespace);
    let mut normalized = String::with_capacity(trimmed.len());
    let mut in_whitespace = false;
    for character in trimmed.chars() {
        if character.is_whitespace() {
            if !in_whitespace {
                normalized.push(' ');
                in_whitespace = true;
            }
        } else {
            normalized.push(character);
            in_whitespace = false;
        }
    }
    normalized
}

fn generate_id(default_message: &str, description: Option<&str>) -> String {
    let mut content = normalize_whitespace(default_message).into_bytes();
    if let Some(description) = description {
        content.push(b'#');
        content.extend_from_slice(description.as_bytes());
    }
    base64::engine::general_purpose::STANDARD
        .encode(Sha512::digest(content))
        .chars()
        .take(GENERATED_ID_LENGTH)
        .collect()
}

fn value_from_python(value: &Bound<'_, PyAny>) -> PyResult<Value<String>> {
    if value.is_none() {
        return Ok(Value::Null);
    }
    if let Ok(value) = value.extract::<bool>() {
        return Ok(Value::Boolean(value));
    }
    if let Ok(value) = value.extract::<i64>() {
        return Ok(Value::Integer(value));
    }
    if let Ok(value) = value.extract::<u64>() {
        return Ok(Value::Unsigned(value));
    }
    if let Ok(value) = value.extract::<f64>() {
        return Ok(Value::Number(value));
    }
    if let Ok(value) = value.extract::<String>() {
        return Ok(Value::String(value));
    }
    Err(PyTypeError::new_err(
        "message values must be str, bool, int, float, or None",
    ))
}

fn values_from_python(values: Option<&Bound<'_, PyDict>>) -> PyResult<Values<String>> {
    values
        .map(|values| {
            values
                .iter()
                .map(|(key, value)| Ok((key.extract::<String>()?, value_from_python(&value)?)))
                .collect()
        })
        .unwrap_or_else(|| Ok(Values::new()))
}

#[pyclass(name = "Intl", unsendable)]
struct PyIntl {
    locale: String,
    default_locale: String,
    catalog: MessageCatalog,
    cache: HashMap<String, IcuMessageFormat>,
}

#[pymethods]
impl PyIntl {
    #[new]
    fn new(
        requested_locales: Vec<String>,
        default_locale: String,
        messages: HashMap<String, HashMap<String, String>>,
    ) -> PyResult<Self> {
        let mut catalog = MessageCatalog::new();
        for (locale, messages) in messages {
            catalog
                .insert(locale, messages)
                .map_err(|error| PyValueError::new_err(error.to_string()))?;
        }
        if !catalog.contains_locale(&default_locale) {
            return Err(PyValueError::new_err(format!(
                "Default locale has no translation catalog: {default_locale}"
            )));
        }
        let parsed_default_locale = default_locale
            .parse::<Locale>()
            .map_err(|error| PyValueError::new_err(error.to_string()))?;
        let locale = negotiate_locale(&requested_locales, &parsed_default_locale, &catalog)
            .map_err(|error| PyValueError::new_err(error.to_string()))?
            .to_string();
        Ok(Self {
            locale,
            default_locale,
            catalog,
            cache: HashMap::new(),
        })
    }

    #[getter]
    fn locale(&self) -> &str {
        &self.locale
    }

    #[pyo3(signature = (id = None, *, default_message = "", description = None, values = None))]
    fn format_message(
        &mut self,
        id: Option<&str>,
        default_message: &str,
        description: Option<&str>,
        values: Option<&Bound<'_, PyDict>>,
    ) -> PyResult<String> {
        let id = match id {
            Some(id) => id.to_owned(),
            None if default_message.is_empty() => {
                return Err(PyValueError::new_err(
                    "default_message is required when id is omitted",
                ));
            }
            None => generate_id(default_message, description),
        };
        let values = values_from_python(values)?;
        let mut candidates = Vec::with_capacity(3);
        if let Some(messages) = self.catalog.messages(&self.locale) {
            if let Some(message) = messages.get(&id).filter(|message| !message.is_empty()) {
                candidates.push((message.clone(), self.locale.clone()));
            }
        }
        if self.locale != self.default_locale {
            if let Some(messages) = self.catalog.messages(&self.default_locale) {
                if let Some(message) = messages.get(&id).filter(|message| !message.is_empty()) {
                    candidates.push((message.clone(), self.default_locale.clone()));
                }
            }
        }
        if !default_message.is_empty() {
            candidates.push((default_message.to_owned(), self.default_locale.clone()));
        }

        for (message, locale) in candidates {
            if !self.cache.contains_key(&message) {
                let compiled = match IcuMessageFormat::try_new(&message) {
                    Ok(compiled) => compiled,
                    Err(_) => continue,
                };
                self.cache.insert(message.clone(), compiled);
            }
            let compiled = self.cache.get(&message).expect("cached message");
            if let Ok(formatted) = compiled.format_to_string(&locale, &values) {
                return Ok(formatted);
            }
        }

        Ok(if default_message.is_empty() {
            id
        } else {
            default_message.to_owned()
        })
    }
}

#[pyfunction]
fn negotiate(
    requested_locales: Vec<String>,
    default_locale: String,
    available_locales: Vec<String>,
) -> PyResult<String> {
    let parsed_default_locale = default_locale
        .parse::<Locale>()
        .map_err(|error| PyValueError::new_err(error.to_string()))?;
    let mut catalog = MessageCatalog::new();
    for locale in available_locales {
        catalog
            .insert(locale, HashMap::new())
            .map_err(|error| PyValueError::new_err(error.to_string()))?;
    }
    negotiate_locale(&requested_locales, &parsed_default_locale, &catalog)
        .map(|locale| locale.to_string())
        .map_err(|error| PyValueError::new_err(error.to_string()))
}

#[pymodule]
fn _native(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_class::<PyIntl>()?;
    module.add_function(wrap_pyfunction!(negotiate, module)?)?;
    Ok(())
}
