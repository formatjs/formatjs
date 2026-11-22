use crate::{
    CalendarProvider, Disambiguation, Error, Instant, IsoDateTime, NANOSECONDS_PER_DAY, PlainTime,
    Precision, ResolvedTimeZone, RoundingMode, TimeZone, TimeZoneRegistry, ZonedDateTime,
};
use core::fmt;

/// String precision controls historical offset matching; field bags use Exact.
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OffsetInput {
    Wall,
    Utc,
    Exact(i128),
    Minute(i128),
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum OffsetOption {
    Prefer,
    Use,
    Ignore,
    Reject,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ZonedParseOptions {
    pub disambiguation: Disambiguation,
    pub offset: OffsetOption,
}
impl Default for ZonedParseOptions {
    // Proposal comparison §6.5.2 steps 5.n, 5.o: supply typed compatible and reject defaults.
    fn default() -> Self {
        Self {
            disambiguation: Disambiguation::Compatible,
            offset: OffsetOption::Reject,
        }
    }
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum CalendarName {
    Auto,
    Always,
    Never,
    Critical,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TimeZoneName {
    Auto,
    Never,
    Critical,
}
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ZonedFormatOptions {
    pub precision: Precision,
    pub rounding_mode: RoundingMode,
    pub offset: bool,
    pub time_zone_name: TimeZoneName,
    pub calendar_name: CalendarName,
}
impl Default for ZonedFormatOptions {
    // Proposal comparison §6.3.43 step 3: prepare default zoned rendering options.
    fn default() -> Self {
        Self {
            precision: Precision::Auto,
            rounding_mode: RoundingMode::Trunc,
            offset: true,
            time_zone_name: TimeZoneName::Auto,
            calendar_name: CalendarName::Auto,
        }
    }
}

impl<Z: TimeZone, C: CalendarProvider> ZonedDateTime<Z, C> {
    /// ISO local fields and an offset hint, resolved through the selected zone.
    // Proposal comparison §6.5.1 step 2: compose validated local fields before offset interpretation.
    pub fn from_local_with_offset(
        fields: IsoDateTime,
        zone: Z,
        calendar: C,
        offset: OffsetInput,
        options: ZonedParseOptions,
    ) -> Result<Self, Error> {
        Self::from_local_nanoseconds_with_offset(
            fields.to_epoch_nanoseconds()?,
            zone,
            calendar,
            offset,
            options,
        )
    }
    // Proposal comparison §6.5.1 steps 3.a, 4.a, 10.b–12: interpret the typed offset hint.
    pub(crate) fn from_local_nanoseconds_with_offset(
        local: i128,
        zone: Z,
        calendar: C,
        offset: OffsetInput,
        options: ZonedParseOptions,
    ) -> Result<Self, Error> {
        crate::iso::check_local(local)?;
        if matches!(offset, OffsetInput::Utc) {
            return Ok(Self::new_in_calendar(
                Instant::from_epoch_nanoseconds(local)?,
                zone,
                calendar,
            ));
        }
        let provided = match offset {
            OffsetInput::Exact(value) | OffsetInput::Minute(value) => {
                if value <= -NANOSECONDS_PER_DAY || value >= NANOSECONDS_PER_DAY {
                    return Err(Error::InvalidDateTime);
                }
                Some(value)
            }
            _ => None,
        };
        let instant = if provided.is_none() || options.offset == OffsetOption::Ignore {
            crate::zoned::resolve_local_nanoseconds(local, &zone, options.disambiguation)?
        } else {
            let provided = provided.unwrap();
            if options.offset == OffsetOption::Use {
                Instant::from_epoch_nanoseconds(local - provided)?
            } else {
                if local < -crate::MAX_EPOCH_NANOSECONDS {
                    return Err(Error::OutOfRange);
                }
                let mut candidate: Option<Instant> = None;
                // Proposal comparison §6.5.1 steps 8–10: Validate candidates before matching offsets.
                crate::zoned::visit_possible_nanoseconds(local, &zone, &mut |instant| {
                    let actual = local - instant.epoch_nanoseconds();
                    let rounded = crate::format::offset_minutes(actual) * 60_000_000_000;
                    if (provided == actual
                        || matches!(offset, OffsetInput::Minute(_)) && provided == rounded)
                        && candidate.is_none_or(|previous| instant < previous)
                    {
                        candidate = Some(instant);
                    }
                })?;
                match candidate {
                    Some(instant) => instant,
                    None if options.offset == OffsetOption::Reject => {
                        return Err(Error::InvalidDateTime);
                    }
                    None => crate::zoned::resolve_local_nanoseconds(
                        local,
                        &zone,
                        options.disambiguation,
                    )?,
                }
            }
        };
        Ok(Self::new_in_calendar(instant, zone, calendar))
    }
}
impl<'a> ZonedDateTime<ResolvedTimeZone<'a>> {
    // Proposal comparison §6.5.2 steps 5.h–5.j: select the arithmetic provider before typed parsing.
    pub fn parse(
        value: &str,
        registry: TimeZoneRegistry<'a>,
        options: ZonedParseOptions,
    ) -> Result<Self, Error> {
        Self::parse_in(
            value,
            registry,
            crate::parse::arithmetic_calendar(value)?,
            options,
        )
    }
}
impl<'a, C: CalendarProvider> ZonedDateTime<ResolvedTimeZone<'a>, C> {
    // Proposal comparison §6.5.2 steps 5.b, 5.e, 11–12: parse and resolve a typed zoned string.
    pub fn parse_in(
        value: &str,
        registry: TimeZoneRegistry<'a>,
        calendar: C,
        options: ZonedParseOptions,
    ) -> Result<Self, Error> {
        let parsed = crate::parse::zoned_fields(value)?;
        crate::parse::check_calendar(value, calendar.id())?;
        let zone = registry.resolve(parsed.zone)?;
        if parsed.date_only {
            let day =
                crate::PlainDate::new(parsed.fields.year, parsed.fields.month, parsed.fields.day)?
                    .epoch_day();
            let probe = Self::new_in_calendar(Instant::from_epoch_nanoseconds(0)?, zone, calendar);
            return Ok(Self::new_in_calendar(
                probe.day_boundary(day)?,
                zone,
                calendar,
            ));
        }
        Self::from_local_with_offset(parsed.fields, zone, calendar, parsed.offset, options)
    }
    // Proposal comparison §6.5.4 steps 5, 7–8: round before querying offset and local fields.
    pub fn format(&self, options: ZonedFormatOptions) -> Result<FormattedZonedDateTime<'_>, Error> {
        let quantum = match options.precision {
            Precision::Auto => 1,
            Precision::Minute => 60_000_000_000,
            Precision::Digits(n) if n <= 9 => 10i128.pow(u32::from(9 - n)),
            _ => return Err(Error::InvalidRoundingOptions),
        };
        let instant = Instant::from_epoch_nanoseconds(crate::rounding::round_instant(
            self.instant().epoch_nanoseconds(),
            quantum,
            options.rounding_mode,
        ))?;
        let offset = self.time_zone().offset_nanoseconds(instant);
        let fields = IsoDateTime::from_epoch_nanoseconds(instant.epoch_nanoseconds() + offset)?;
        Ok(FormattedZonedDateTime {
            fields,
            offset,
            zone: self.time_zone().identifier(),
            calendar: self.calendar_id(),
            options,
        })
    }
}
#[cfg(feature = "compiled_time_zones")]
impl core::str::FromStr for ZonedDateTime<ResolvedTimeZone<'static>> {
    type Err = Error;
    // Proposal comparison §6.5.2 step 5.b: route a typed string through the compiled registry.
    fn from_str(value: &str) -> Result<Self, Error> {
        Self::parse(
            value,
            TimeZoneRegistry::compiled(),
            ZonedParseOptions::default(),
        )
    }
}
impl<C: CalendarProvider> fmt::Display for ZonedDateTime<ResolvedTimeZone<'_>, C> {
    // Proposal comparison §6.3.43 step 3: delegate default zoned rendering.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        self.format(ZonedFormatOptions::default())
            .map_err(|_| fmt::Error)?
            .fmt(f)
    }
}
pub struct FormattedZonedDateTime<'a> {
    fields: IsoDateTime,
    offset: i128,
    zone: &'a str,
    calendar: &'static str,
    options: ZonedFormatOptions,
}
impl fmt::Display for FormattedZonedDateTime<'_> {
    // Proposal comparison §6.5.4 steps 9–15: write zoned date-time text and selected annotations.
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let fields = self.fields;
        crate::date::write_date(f, (fields.year, fields.month, fields.day))?;
        let time = PlainTime::new(fields.hour, fields.minute, fields.second, fields.nanosecond)
            .map_err(|_| fmt::Error)?;
        write!(
            f,
            "T{}",
            time.format(self.options.precision, RoundingMode::Trunc)
                .map_err(|_| fmt::Error)?
        )?;
        if self.options.offset {
            crate::format::write_offset(f, self.offset)?;
        }
        if self.options.time_zone_name != TimeZoneName::Never {
            write!(
                f,
                "[{}{}]",
                if self.options.time_zone_name == TimeZoneName::Critical {
                    "!"
                } else {
                    ""
                },
                self.zone
            )?;
        }
        if self.options.calendar_name != CalendarName::Never
            && (self.options.calendar_name != CalendarName::Auto || self.calendar != "iso8601")
        {
            write!(
                f,
                "[{}u-ca={}]",
                if self.options.calendar_name == CalendarName::Critical {
                    "!"
                } else {
                    ""
                },
                self.calendar
            )?;
        }
        Ok(())
    }
}
