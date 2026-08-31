use base64::Engine;
use formatjs_icu_messageformat::{DateTimeValue, Value, Values};
use formatjs_intl::{
    Error as IntlError, Intl, IntlCache, MessageCatalog, MessageDescriptorRef, MessageSource,
    negotiate_locale,
};
use icu_locale::Locale;
use pyo3::exceptions::{PyTypeError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDate, PyDateTime, PyDict};
use sha2::{Digest, Sha512};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, OnceLock};

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
    if let Ok(value) = value.cast::<PyDateTime>() {
        return DateTimeValue::try_new(
            value.getattr("year")?.extract()?,
            value.getattr("month")?.extract()?,
            value.getattr("day")?.extract()?,
            value.getattr("hour")?.extract()?,
            value.getattr("minute")?.extract()?,
            value.getattr("second")?.extract()?,
            value.getattr("microsecond")?.extract::<u32>()? * 1_000,
        )
        .map(Value::DateTime)
        .map_err(|error| PyValueError::new_err(error.to_string()));
    }
    if let Ok(value) = value.cast::<PyDate>() {
        return DateTimeValue::try_new(
            value.getattr("year")?.extract()?,
            value.getattr("month")?.extract()?,
            value.getattr("day")?.extract()?,
            0,
            0,
            0,
            0,
        )
        .map(Value::DateTime)
        .map_err(|error| PyValueError::new_err(error.to_string()));
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
        "message values must be str, bool, int, float, date, datetime, or None",
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
    intl: Intl,
    callback_error: Arc<Mutex<Option<PyErr>>>,
}

fn cache() -> Arc<IntlCache> {
    static CACHE: OnceLock<Arc<IntlCache>> = OnceLock::new();
    CACHE.get_or_init(|| Arc::new(IntlCache::new())).clone()
}

fn source_name(source: MessageSource) -> &'static str {
    match source {
        MessageSource::Translation => "translation",
        MessageSource::DefaultCatalog => "default_catalog",
        MessageSource::DefaultMessage => "default_message",
    }
}

#[pymethods]
impl PyIntl {
    #[new]
    #[pyo3(signature = (requested_locales, default_locale, messages, on_error = None))]
    fn new(
        requested_locales: Vec<String>,
        default_locale: String,
        messages: HashMap<String, HashMap<String, String>>,
        on_error: Option<Py<PyAny>>,
    ) -> PyResult<Self> {
        let mut catalog = MessageCatalog::new();
        for (locale, messages) in messages {
            catalog
                .insert(locale, messages)
                .map_err(|error| PyValueError::new_err(error.to_string()))?;
        }
        let mut intl = Intl::try_new(
            requested_locales,
            default_locale,
            Arc::new(catalog),
            cache(),
        )
        .map_err(|error| PyValueError::new_err(error.to_string()))?;
        let callback_error = Arc::new(Mutex::new(None));
        if let Some(callback) = on_error {
            let captured_error = callback_error.clone();
            intl = intl.with_on_error(move |error| {
                if captured_error
                    .lock()
                    .expect("callback error lock")
                    .is_some()
                {
                    return;
                }
                let code = match &error.error {
                    IntlError::MissingTranslation { .. } => "MISSING_TRANSLATION",
                    _ => "FORMAT_ERROR",
                };
                Python::attach(|py| {
                    if let Err(callback_error) = callback.call1(
                        py,
                        (
                            code,
                            error.descriptor.id.as_str(),
                            error.descriptor.default_message.as_str(),
                            error.descriptor.description.as_deref(),
                            error.locale.as_str(),
                            source_name(error.source),
                            error.to_string(),
                        ),
                    ) {
                        *captured_error.lock().expect("callback error lock") = Some(callback_error);
                    }
                });
            });
        }
        Ok(Self {
            intl,
            callback_error,
        })
    }

    #[getter]
    fn locale(&self) -> String {
        self.intl.locale().to_string()
    }

    #[pyo3(signature = (id = None, *, default_message = "", description = None, values = None))]
    fn format_message(
        &self,
        id: Option<&str>,
        default_message: &str,
        description: Option<&str>,
        values: Option<&Bound<'_, PyDict>>,
    ) -> PyResult<String> {
        self.callback_error
            .lock()
            .expect("callback error lock")
            .take();
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
        let descriptor = match description {
            Some(description) => {
                MessageDescriptorRef::new(&id, default_message).with_description(description)
            }
            None => MessageDescriptorRef::new(&id, default_message),
        };
        let formatted = self
            .intl
            .format_message_to_string_or_default_ref(descriptor, &values);
        if let Some(error) = self
            .callback_error
            .lock()
            .expect("callback error lock")
            .take()
        {
            return Err(error);
        }
        Ok(formatted)
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
