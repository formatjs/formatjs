fn main() -> Result<(), Box<dyn std::error::Error>> {
    formatjs_intl_data_build::generate::<formatjs_intl_displaynames::LocaleNames>()
}
