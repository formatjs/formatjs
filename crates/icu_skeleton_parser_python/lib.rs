use formatjs_icu_skeleton_parser::{
    NumberSkeletonToken, parse_date_time_skeleton, parse_number_skeleton,
};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pythonize::pythonize;

#[pyfunction]
fn parse_number(py: Python<'_>, skeleton: &str) -> PyResult<Py<PyAny>> {
    let tokens = NumberSkeletonToken::parse_from_string(skeleton)
        .map_err(|error| PyValueError::new_err(error.to_string()))?;
    let options = parse_number_skeleton(&tokens).map_err(PyValueError::new_err)?;
    pythonize(py, &options)
        .map(Bound::unbind)
        .map_err(|error| PyValueError::new_err(error.to_string()))
}

#[pyfunction]
fn parse_date_time(py: Python<'_>, skeleton: &str) -> PyResult<Py<PyAny>> {
    let options = parse_date_time_skeleton(skeleton).map_err(PyValueError::new_err)?;
    pythonize(py, &options)
        .map(Bound::unbind)
        .map_err(|error| PyValueError::new_err(error.to_string()))
}

#[pymodule]
fn _native(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_function(wrap_pyfunction!(parse_number, module)?)?;
    module.add_function(wrap_pyfunction!(parse_date_time, module)?)?;
    Ok(())
}
