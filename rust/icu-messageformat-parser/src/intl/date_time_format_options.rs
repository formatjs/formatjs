use serde::Serialize;

use super::options::{DateTimeDisplayFormat, LocaleMatcherFormatOptions, UnitDisplay, DateTimeMonthDisplayFormat, TimeZoneNameFormat, HourCycle, DateTimeFormatMatcher, DateTimeFormatStyle};

/// Subset of options that will be parsed from the ICU message daet or time skeleton.
#[derive(Default, Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JsIntlDateTimeFormatOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locale_matcher: Option<LocaleMatcherFormatOptions>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weekday: Option<UnitDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub era: Option<UnitDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub year: Option<DateTimeDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub month: Option<DateTimeMonthDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<DateTimeDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour: Option<DateTimeDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub minute: Option<DateTimeDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub second: Option<DateTimeDisplayFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone_name: Option<TimeZoneNameFormat>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour12: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hour_cycle: Option<HourCycle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_zone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format_matcher: Option<DateTimeFormatMatcher>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date_style: Option<DateTimeFormatStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_style: Option<DateTimeFormatStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day_period: Option<UnitDisplay>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fractional_second_digits: Option<usize>,
}
