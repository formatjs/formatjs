use formatjs_intl_durationformat::{Configuration, Duration, Options, RenderError, Renderer};
use serde_json::{Value, json};

const NUMBER: &str = include_str!(env!("FORMATJS_DURATION_NUMBER_EN"));
const LIST: &str = include_str!(env!("FORMATJS_DURATION_LIST_EN"));
fn configuration(value: Value) -> Configuration {
    Configuration::new(&serde_json::from_value::<Options>(value).unwrap()).unwrap()
}
fn duration(values: [i128; 10]) -> Duration {
    Duration::from_integers(values).unwrap()
}
fn formatted(
    renderer: &mut Renderer,
    configuration: &Configuration,
    duration: &Duration,
) -> String {
    renderer
        .format_to_parts(configuration, "en", "latn", ":", duration)
        .unwrap()
        .into_iter()
        .map(|part| part.value)
        .collect()
}

#[test]
fn dependencies_can_load_after_configuration_and_empty_output_still_needs_list_data() {
    let options = configuration(json!({}));
    let zero = duration([0; 10]);
    let mut renderer = Renderer::default();
    assert!(matches!(
        renderer.format_to_parts(&options, "en", "latn", ":", &zero),
        Err(RenderError::List(_))
    ));
    renderer.add_list_data(LIST).unwrap();
    assert_eq!(formatted(&mut renderer, &options, &zero), "");
    let second = duration([0, 0, 0, 0, 0, 0, 1, 0, 0, 0]);
    assert!(matches!(
        renderer.format_to_parts(&options, "en", "latn", ":", &second),
        Err(RenderError::Number(_))
    ));
    renderer.add_number_data(NUMBER).unwrap();
    assert_eq!(formatted(&mut renderer, &options, &second), "1 sec");
}

#[test]
fn cached_profiles_keep_old_data_and_new_profiles_use_replacements() {
    let mut renderer = Renderer::default();
    renderer.add_number_data(NUMBER).unwrap();
    renderer.add_list_data(LIST).unwrap();
    let value = duration([0, 0, 0, 0, 0, 0, 1, 473, 0, 0]);
    let old = configuration(json!({"style":"digital", "fractionalDigits":3}));
    assert_eq!(formatted(&mut renderer, &old, &value), "0:00:01.473");
    let mut replacement: Value = serde_json::from_str(NUMBER).unwrap();
    replacement["data"]["numbers"]["symbols"]["latn"]["decimal"] = json!("@");
    renderer.add_number_data(&replacement.to_string()).unwrap();
    assert_eq!(formatted(&mut renderer, &old, &value), "0:00:01.473");
    let new = configuration(json!({"style":"digital", "fractionalDigits":2}));
    assert_eq!(formatted(&mut renderer, &new, &value), "0:00:01@47");

    let pair = duration([1, 1, 0, 0, 0, 0, 0, 0, 0, 0]);
    let short = configuration(json!({"style":"short"}));
    assert_eq!(formatted(&mut renderer, &short, &pair), "1 yr, 1 mth");
    let mut replacement: Value = serde_json::from_str(LIST).unwrap();
    replacement["data"]["unit"]["short"]["pair"] = json!("{0} / {1}");
    replacement["data"]["unit"]["narrow"]["pair"] = json!("{0} / {1}");
    renderer.add_list_data(&replacement.to_string()).unwrap();
    assert_eq!(formatted(&mut renderer, &short, &pair), "1 yr, 1 mth");
    let narrow = configuration(json!({"style":"narrow"}));
    assert_eq!(formatted(&mut renderer, &narrow, &pair), "1y / 1m");
}

#[test]
fn number_and_list_dependencies_negotiate_independent_locale_sets() {
    let mut renderer = Renderer::default();
    renderer.add_number_data(NUMBER).unwrap();
    renderer
        .add_list_data(include_str!(env!("FORMATJS_DURATION_LIST_JA")))
        .unwrap();
    let options = configuration(json!({"style":"long"}));
    let value = duration([0, 0, 0, 1, 2, 0, 0, 0, 0, 0]);
    assert_eq!(formatted(&mut renderer, &options, &value), "1 day 2 hours");
}
