use crate::Provider;
use formatjs_intl_datetimeformat::{Error, Runtime};

const PACKS: [&str; 14] = [
    include_str!(env!("FORMATJS_CALENDAR_BUDDHIST")),
    include_str!(env!("FORMATJS_CALENDAR_CHINESE")),
    include_str!(env!("FORMATJS_CALENDAR_COPTIC")),
    include_str!(env!("FORMATJS_CALENDAR_DANGI")),
    include_str!(env!("FORMATJS_CALENDAR_ETHIOAA")),
    include_str!(env!("FORMATJS_CALENDAR_ETHIOPIC")),
    include_str!(env!("FORMATJS_CALENDAR_HEBREW")),
    include_str!(env!("FORMATJS_CALENDAR_INDIAN")),
    include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_CIVIL")),
    include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_TBLA")),
    include_str!(env!("FORMATJS_CALENDAR_ISLAMIC_UMALQURA")),
    include_str!(env!("FORMATJS_CALENDAR_JAPANESE")),
    include_str!(env!("FORMATJS_CALENDAR_PERSIAN")),
    include_str!(env!("FORMATJS_CALENDAR_ROC")),
];

pub(crate) fn register(runtime: &Runtime) -> Result<(), Error> {
    let providers = PACKS
        .iter()
        .map(|pack| Provider::from_json(pack))
        .collect::<Result<Vec<_>, _>>()?;
    for provider in providers {
        provider.register(runtime);
    }
    Ok(())
}
