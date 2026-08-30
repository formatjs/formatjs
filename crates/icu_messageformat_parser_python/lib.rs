use formatjs_icu_messageformat_parser::types::MessageFormatElement;
use formatjs_icu_messageformat_parser::{Parser, ParserOptions, print_ast as print_elements};
use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use pythonize::{depythonize, pythonize};

#[pyfunction]
#[pyo3(signature = (
    message,
    *,
    ignore_tag = false,
    requires_other_clause = false,
    should_parse_skeletons = false,
    capture_location = false
))]
fn parse(
    py: Python<'_>,
    message: &str,
    ignore_tag: bool,
    requires_other_clause: bool,
    should_parse_skeletons: bool,
    capture_location: bool,
) -> PyResult<Py<PyAny>> {
    let ast = Parser::new(
        message,
        ParserOptions {
            ignore_tag,
            requires_other_clause,
            should_parse_skeletons,
            capture_location,
            locale: None,
        },
    )
    .parse()
    .map_err(|error| PyValueError::new_err(error.to_string()))?;
    pythonize(py, &ast)
        .map(Bound::unbind)
        .map_err(|error| PyValueError::new_err(error.to_string()))
}

#[pyfunction]
fn print_ast(ast: &Bound<'_, PyAny>) -> PyResult<String> {
    let ast: Vec<MessageFormatElement> =
        depythonize(ast).map_err(|error| PyValueError::new_err(error.to_string()))?;
    Ok(print_elements(&ast))
}

#[pymodule]
fn _native(module: &Bound<'_, PyModule>) -> PyResult<()> {
    module.add_function(wrap_pyfunction!(parse, module)?)?;
    module.add_function(wrap_pyfunction!(print_ast, module)?)?;
    Ok(())
}
