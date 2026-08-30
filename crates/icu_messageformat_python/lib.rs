use formatjs_icu_messageformat::{IcuMessageFormat, Value, Values};
use pyo3::exceptions::{PyTypeError, PyValueError};
use pyo3::prelude::*;
use pyo3::types::{PyAny, PyDict};
use pythonize::pythonize;

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

#[pyclass(name = "IcuMessageFormat", unsendable)]
struct PyIcuMessageFormat {
    inner: IcuMessageFormat,
    locale: String,
}

#[pymethods]
impl PyIcuMessageFormat {
    #[new]
    #[pyo3(signature = (message, *, locale = "en"))]
    fn new(message: &str, locale: &str) -> PyResult<Self> {
        let inner = IcuMessageFormat::try_new(message)
            .map_err(|error| PyValueError::new_err(error.to_string()))?;
        Ok(Self {
            inner,
            locale: locale.to_owned(),
        })
    }

    #[pyo3(signature = (values = None))]
    fn format(&self, values: Option<&Bound<'_, PyDict>>) -> PyResult<String> {
        let values = values_from_python(values)?;
        self.inner
            .format_to_string(&self.locale, &values)
            .map_err(|error| PyValueError::new_err(error.to_string()))
    }

    fn get_ast(&self, py: Python<'_>) -> PyResult<Py<PyAny>> {
        pythonize(py, self.inner.get_ast())
            .map(Bound::unbind)
            .map_err(|error| PyValueError::new_err(error.to_string()))
    }
}

#[pymodule]
fn _native(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_class::<PyIcuMessageFormat>()?;
    Ok(())
}
