/// Rejects missing, unused, and duplicate ICU values during macro expansion.
///
/// ```compile_fail
/// formatjs_intl_macros::__validate_message_values!("Hello, {name}";);
/// ```
///
/// ```compile_fail
/// formatjs_intl_macros::__validate_message_values!("Hello"; name);
/// ```
///
/// ```compile_fail
/// formatjs_intl_macros::__validate_message_values!("Hello, {name}"; name, name);
/// ```
///
/// ```
/// formatjs_intl_macros::__validate_message_values!("Hello, {name}"; name);
/// ```
#[allow(dead_code)]
pub fn validation_examples() {}

#[test]
fn validates_nested_icu_values() {
    formatjs_intl_macros::__validate_message_values!(
        "{gender, select, other {{name} has {count, plural, one {one task} other {# tasks}} worth {amount, number}, due {due, date} at {time, time}. <b>Review</b>}}";
        gender, name, count, amount, due, time, b
    );
}

/// Invalid encodings and duplicate options fail at compile time.
///
/// ```compile_fail
/// formatjs_intl_macros::__message_descriptor!(default_message: "Hello", id_encoding: "rot13");
/// ```
///
/// ```compile_fail
/// formatjs_intl_macros::__message_descriptor!(default_message: "Hello", id_encoding: "hex", id_encoding: "hex");
/// ```
#[allow(dead_code)]
pub fn encoding_examples() {}
