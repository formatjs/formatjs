use serde::Serialize;

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum CompactDisplay {
    Short,
    Long,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Notation {
    Standard,
    Scientific,
    Engineering,
    Compact,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum UnitDisplay {
    Short,
    Long,
    Narrow,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsTrailingZeroDisplay {
    Auto,
    StripIfInteger,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsRoundingPriority {
    Auto,
    MorePrecision,
    LessPrecision,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum LocaleMatcherFormatOptions {
    Lookup,
    #[serde(rename = "best fit")]
    BestFit,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsStyle {
    Decimal,
    Percent,
    Currency,
    Unit,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsCurrencyDisplay {
    Symbol,
    Code,
    Name,
    NarrowSymbol,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsCurrencySign {
    Standard,
    Accounting,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NumberFormatOptionsSignDisplay {
    Auto,
    Always,
    Never,
    ExceptZero,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DateTimeFormatMatcher {
    Basic,
    #[serde(rename = "best fit")]
    BestFit,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DateTimeFormatStyle {
    Full,
    Long,
    Medium,
    Short,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DateTimeDisplayFormat {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DateTimeMonthDisplayFormat {
    Numeric,
    #[serde(rename = "2-digit")]
    TwoDigit,
    Long,
    Short,
    Narrow
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum TimeZoneNameFormat {
    Short,
    Long,
    ShortOffset,
    LongOffset,
    ShortGeneric,
    LongGeneric,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum HourCycle {
    H11,
    H12,
    H23,
    H24
}