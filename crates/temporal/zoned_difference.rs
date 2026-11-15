use crate::{
    Duration, Error, Instant, MAX_EPOCH_NANOSECONDS, Overflow, PlainDate, RoundingMode, TimeUnit,
    TimeZone, ZonedDateTime, round_duration_nanoseconds,
};

#[derive(Clone, Copy, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[repr(usize)]
pub enum ZonedUnit {
    Year,
    Month,
    Week,
    Day,
    Hour,
    Minute,
    Second,
    Millisecond,
    Microsecond,
    Nanosecond,
}
impl ZonedUnit {
    fn time(self) -> Option<TimeUnit> {
        match self {
            Self::Hour => Some(TimeUnit::Hour),
            Self::Minute => Some(TimeUnit::Minute),
            Self::Second => Some(TimeUnit::Second),
            Self::Millisecond => Some(TimeUnit::Millisecond),
            Self::Microsecond => Some(TimeUnit::Microsecond),
            Self::Nanosecond => Some(TimeUnit::Nanosecond),
            _ => None,
        }
    }
}
impl core::str::FromStr for ZonedUnit {
    type Err = Error;
    fn from_str(value: &str) -> Result<Self, Error> {
        match value.strip_suffix('s').unwrap_or(value) {
            "year" => Ok(Self::Year),
            "month" => Ok(Self::Month),
            "week" => Ok(Self::Week),
            "day" => Ok(Self::Day),
            "hour" => Ok(Self::Hour),
            "minute" => Ok(Self::Minute),
            "second" => Ok(Self::Second),
            "millisecond" => Ok(Self::Millisecond),
            "microsecond" => Ok(Self::Microsecond),
            "nanosecond" => Ok(Self::Nanosecond),
            _ => Err(Error::InvalidRoundingOptions),
        }
    }
}
impl<Z: TimeZone + Clone + PartialEq> ZonedDateTime<Z> {
    pub fn until(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        difference(self, other, largest, smallest, increment, mode, false)
    }
    pub fn since(
        &self,
        other: &Self,
        largest: ZonedUnit,
        smallest: ZonedUnit,
        increment: u32,
        mode: RoundingMode,
    ) -> Result<Duration, Error> {
        difference(self, other, largest, smallest, increment, mode, true)
    }
}
fn endpoint<Z: TimeZone + Clone>(
    start: &ZonedDateTime<Z>,
    fields: [i128; 10],
) -> Result<i128, Error> {
    Ok(start
        .checked_add(Duration::new(fields)?, Overflow::Constrain)?
        .instant()
        .epoch_nanoseconds())
}
fn date_anchor(start: PlainDate, fields: [i128; 10]) -> Result<i64, Error> {
    let (year, month, day) = start.fields();
    let serial = (i128::from(year) + fields[0]) * 12 + i128::from(month) - 1 + fields[1];
    let year: i32 = serial
        .div_euclid(12)
        .try_into()
        .map_err(|_| Error::OutOfRange)?;
    let month = (serial.rem_euclid(12) + 1) as u8;
    let day = day.min(crate::date::month_length(year, month));
    (i128::from(crate::iso::epoch_day_from_iso(year, month, day)) + fields[2] * 7 + fields[3])
        .try_into()
        .map_err(|_| Error::OutOfRange)
}
fn date_until(start: PlainDate, end: PlainDate, largest: ZonedUnit) -> Result<[i128; 10], Error> {
    let sign = (end.epoch_day() - start.epoch_day()).signum();
    let mut fields = [0; 10];
    if sign == 0 {
        return Ok(fields);
    }
    let mut anchor = start.epoch_day();
    let (first_year, first_month, _) = start.fields();
    let (last_year, last_month, _) = end.fields();
    if largest == ZonedUnit::Year {
        fields[0] = i128::from(last_year - first_year);
        anchor = date_anchor(start, fields)?;
        if (anchor - end.epoch_day()) * sign > 0 {
            fields[0] -= i128::from(sign);
            anchor = date_anchor(start, fields)?;
        }
    }
    if largest <= ZonedUnit::Month {
        let year = i128::from(first_year) + fields[0];
        fields[1] =
            (i128::from(last_year) - year) * 12 + i128::from(last_month) - i128::from(first_month);
        anchor = date_anchor(start, fields)?;
        if (anchor - end.epoch_day()) * sign > 0 {
            fields[1] -= i128::from(sign);
            anchor = date_anchor(start, fields)?;
        }
    }
    fields[3] = i128::from(end.epoch_day() - anchor);
    if largest == ZonedUnit::Week {
        fields[2] = fields[3] / 7;
        fields[3] %= 7;
    }
    Ok(fields)
}
fn unrounded<Z: TimeZone + Clone>(
    start: &ZonedDateTime<Z>,
    end: i128,
    largest: ZonedUnit,
) -> Result<[i128; 10], Error> {
    let origin = start.instant().epoch_nanoseconds();
    if let Some(time) = largest.time() {
        return Ok(Duration::from_time_nanoseconds(end - origin, time)?.fields());
    }
    let sign = (end - origin).signum();
    if sign == 0 {
        return Ok([0; 10]);
    }
    let begin = start.local()?.date();
    let finish = ZonedDateTime::new(
        Instant::from_epoch_nanoseconds(end)?,
        start.time_zone().clone(),
    )
    .local()?
    .date();
    let mut day = if i128::from(finish.epoch_day() - begin.epoch_day()) * sign < 0 {
        begin.epoch_day()
    } else {
        finish.epoch_day()
    };
    let mut fields = date_until(begin, PlainDate::from_epoch_day(day)?, largest)?;
    let mut anchor;
    loop {
        anchor = match endpoint(start, fields) {
            Ok(value) => value,
            Err(Error::OutOfRange | Error::InvalidDateTime) => sign * (MAX_EPOCH_NANOSECONDS + 1),
            Err(error) => return Err(error),
        };
        if (anchor - end) * sign <= 0 {
            break;
        }
        day -= sign as i64;
        if i128::from(day - begin.epoch_day()) * sign < 0 {
            fields = [0; 10];
            anchor = origin;
            break;
        }
        fields = date_until(begin, PlainDate::from_epoch_day(day)?, largest)?;
    }
    let time = Duration::from_time_nanoseconds(end - anchor, TimeUnit::Hour)?.fields();
    fields[4..].copy_from_slice(&time[4..]);
    Ok(fields)
}
fn difference<Z: TimeZone + Clone + PartialEq>(
    start: &ZonedDateTime<Z>,
    end: &ZonedDateTime<Z>,
    largest: ZonedUnit,
    smallest: ZonedUnit,
    increment: u32,
    mode: RoundingMode,
    since: bool,
) -> Result<Duration, Error> {
    if largest > smallest || increment == 0 || increment > 1_000_000_000 {
        return Err(Error::InvalidRoundingOptions);
    }
    if largest <= ZonedUnit::Day && start.time_zone() != end.time_zone() {
        return Err(Error::InvalidDateTime);
    }
    let origin = start.instant().epoch_nanoseconds();
    let end = end.instant().epoch_nanoseconds();
    let since_sign = if since { -1 } else { 1 };
    let rounded = if let Some(unit) = smallest.time() {
        let maximum = match unit {
            TimeUnit::Hour => 24,
            TimeUnit::Minute | TimeUnit::Second => 60,
            _ => 1000,
        };
        if increment >= maximum || maximum % increment != 0 {
            return Err(Error::InvalidRoundingOptions);
        }
        let mut fields = if largest <= ZonedUnit::Day {
            unrounded(start, end, largest)?
        } else {
            [0; 10]
        };
        fields[4..].fill(0);
        let anchor = endpoint(start, fields)?;
        anchor
            + since_sign
                * round_duration_nanoseconds(
                    (end - anchor) * since_sign,
                    i128::from(increment) * unit.nanoseconds(),
                    mode,
                )?
    } else if origin == end {
        origin
    } else {
        let fields = unrounded(start, end, largest)?;
        let mut prefix = [0; 10];
        prefix[largest as usize..smallest as usize]
            .copy_from_slice(&fields[largest as usize..smallest as usize]);
        let count = if smallest == ZonedUnit::Week {
            fields[2] + fields[3] / 7
        } else {
            fields[smallest as usize]
        };
        let truncated = count / i128::from(increment) * i128::from(increment);
        prefix[smallest as usize] = truncated;
        let a = endpoint(start, prefix)?;
        if a == end {
            a
        } else {
            let sign = (end - origin).signum();
            prefix[smallest as usize] = truncated + sign * i128::from(increment);
            let b = endpoint(start, prefix)?;
            let positive = sign * since_sign > 0;
            let distance = (end - a) * sign;
            let span = (b - a) * sign;
            let expand = match mode {
                RoundingMode::Expand => true,
                RoundingMode::Trunc => false,
                RoundingMode::Ceil => positive,
                RoundingMode::Floor => !positive,
                _ if distance * 2 != span => distance * 2 > span,
                RoundingMode::HalfExpand => true,
                RoundingMode::HalfTrunc => false,
                RoundingMode::HalfCeil => positive,
                RoundingMode::HalfFloor => !positive,
                RoundingMode::HalfEven => (truncated / i128::from(increment)).abs() % 2 == 1,
            };
            if expand { b } else { a }
        }
    };
    let mut fields = unrounded(start, rounded, largest)?;
    if since {
        for field in &mut fields {
            *field = -*field;
        }
    }
    Duration::new(fields)
}
