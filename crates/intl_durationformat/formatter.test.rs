use formatjs_intl_durationformat::{
    Configuration, Duration, DurationFormat, Options, Renderer, ResolutionOptions, Style,
};

#[test]
fn phased_construction_keeps_resolution_snapshot_when_dependency_data_arrives() {
    let mut renderer = Renderer::default();
    let requested = ["en-u-nu-deva".into()];
    let resolution = renderer
        .resolve_locale(&requested, &ResolutionOptions::default())
        .unwrap();
    assert_eq!(resolution.locale(), "en");
    assert_eq!(resolution.numbering_system(), "latn");
    let configuration = Configuration::new(&Options {
        style: Style::Digital,
        ..Default::default()
    })
    .unwrap();
    let old = DurationFormat::from_resolution(resolution, configuration.clone()).unwrap();
    renderer
        .add_number_data(include_str!(env!("FORMATJS_DURATION_NUMBER_EN")))
        .unwrap();
    renderer
        .add_list_data(include_str!(env!("FORMATJS_DURATION_LIST_EN")))
        .unwrap();
    let value = Duration::from_integers([0, 0, 0, 0, 0, 0, 1, 0, 0, 0]).unwrap();
    assert_eq!(old.format(&mut renderer, &value).unwrap(), "0:00:01");
    let resolution = renderer
        .resolve_locale(&requested, &ResolutionOptions::default())
        .unwrap();
    assert_eq!(resolution.locale(), "en-u-nu-deva");
    assert_eq!(resolution.data_locale(), "en");
    assert_eq!(resolution.numbering_system(), "deva");
    let new = DurationFormat::from_resolution(resolution, configuration).unwrap();
    assert_eq!(new.format(&mut renderer, &value).unwrap(), "०:००:०१");
    assert_eq!(old.format(&mut renderer, &value).unwrap(), "0:00:01");
}
