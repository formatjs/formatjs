fn main() -> Result<(), Box<dyn std::error::Error>> {
    use formatjs_intl_datetimeformat::data::LocaleData;

    formatjs_intl_data_build::generate_with_keys::<LocaleData>(Some(|data| {
        data.calendar_candidates().collect()
    }))
}
