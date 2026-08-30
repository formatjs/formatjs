use formatjs_icu_messageformat::{IcuMessageFormat, Value, Values};
use formatjs_intl::{MessageCatalog, negotiate_locale};
use icu_locale::Locale;
use pyo3::exceptions::{PyTypeError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDict};
use std::collections::HashMap;

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
                .map(|(key, value)| {
                    Ok((key.extract::<String>()?, value_from_python(&value)?))
                })
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

    #[pyo3(signature = (id, *, default_message = "", values = None))]
    fn format_message(
        &mut self,
        id: &str,
        default_message: &str,
        values: Option<&Bound<'_, PyDict>>,
    ) -> PyResult<String> {
        let values = values_from_python(values)?;
        let mut candidates = Vec::with_capacity(3);
        if let Some(messages) = self.catalog.messages(&self.locale) {
            if let Some(message) = messages.get(id).filter(|message| !message.is_empty()) {
                candidates.push((message.clone(), self.locale.clone()));
            }
        }
        if self.locale != self.default_locale {
            if let Some(messages) = self.catalog.messages(&self.default_locale) {
                if let Some(message) = messages.get(id).filter(|message| !message.is_empty()) {
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
            id.to_owned()
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
