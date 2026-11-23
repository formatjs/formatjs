use crate::timezone_future::FutureRule;
pub use crate::timezone_future::TimeZoneOffset;
use crate::{Error, civil::CivilDateTime};
use serde::Deserialize;
use std::{
    collections::BTreeMap,
    sync::{Arc, OnceLock, RwLock},
};

#[derive(Deserialize)]
struct PackedData {
    abbrvs: String,
    offsets: String,
    zones: Vec<String>,
    #[serde(default)]
    future: BTreeMap<String, FutureRule>,
}
struct Transition {
    seconds: i64,
    offset: TimeZoneOffset,
}
struct Zone {
    name: String,
    transitions: Vec<Transition>,
    future: Option<FutureRule>,
}
struct State {
    zones: Arc<BTreeMap<String, Zone>>,
    default: Option<String>,
    host_time_zone: Option<String>,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TimeZone {
    name: String,
    fixed: Option<i32>,
    target: Option<String>,
}
impl TimeZone {
    // Proposal comparison §15.4.1 steps 32.c and 34: Expose the resolved zone spelling.
    pub fn identifier(&self) -> &str {
        &self.name
    }
    // Proposal comparison §15.6.4 step 16.e.iv: Supply the zone data key for localized names.
    pub fn data_identifier(&self) -> &str {
        self.target.as_deref().unwrap_or(&self.name)
    }
}
#[derive(Clone)]
pub struct TimeZoneRegistry {
    state: Arc<RwLock<State>>,
}
impl Default for TimeZoneRegistry {
    fn default() -> Self {
        Self {
            state: Arc::new(RwLock::new(State {
                zones: Arc::new(BTreeMap::new()),
                default: None,
                host_time_zone: None,
            })),
        }
    }
}
// Proposal comparison §15.4.1 step 28.b.i: Supply the UTC fallback used by the Intl registry.
fn utc() -> TimeZone {
    TimeZone {
        name: "UTC".into(),
        fixed: None,
        target: None,
    }
}
// Proposal comparison §15.4.1 step 32.c and §15.6.23 step 2.b: Keep the zone spelling and data target.
fn named(name: String, target: String) -> TimeZone {
    let fixed = (target == "UTC" || target == "Etc/UTC" || target == "Etc/GMT").then_some(0);
    let target = (name != target).then_some(target);
    TimeZone {
        name,
        fixed,
        target,
    }
}
struct ZoneIdentifiers {
    links: BTreeMap<String, (String, String)>,
    primary: BTreeMap<String, String>,
}

// ECMA-402 §6.5.1 keeps primary identifiers separate from transition data links.
// https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
fn identifiers() -> &'static ZoneIdentifiers {
    #[derive(Deserialize)]
    struct RawIdentifiers {
        links: BTreeMap<String, String>,
        primary: BTreeMap<String, String>,
    }
    static IDENTIFIERS: OnceLock<ZoneIdentifiers> = OnceLock::new();
    IDENTIFIERS.get_or_init(|| {
        let raw: RawIdentifiers =
            serde_json::from_str(include_str!(env!("FORMATJS_TIMEZONE_LINKS")))
                .expect("generated IANA timezone identities");
        let mut links = BTreeMap::new();
        for target in raw.links.values() {
            links.insert(
                target.to_ascii_uppercase(),
                (target.clone(), target.clone()),
            );
        }
        for (alias, target) in raw.links {
            links.insert(alias.to_ascii_uppercase(), (alias, target));
        }
        ZoneIdentifiers {
            links,
            primary: raw.primary,
        }
    })
}

// ECMA-262 §21.4.1.24 steps 2–3 ask the host for its current zone.
// Bare POSIX runtimes can use a TZ setting or a zoneinfo link.
// https://tc39.es/ecma262/#sec-systemtimezoneidentifier
fn system_time_zone_name() -> Option<String> {
    if let Some(zone) = std::env::var_os("TZ") {
        return zone.into_string().ok();
    }
    #[cfg(unix)]
    if let Ok(link) = std::fs::read_link("/etc/localtime") {
        let path = link.to_str()?;
        if path.contains("/zoneinfo/") {
            return Some(path.to_owned());
        }
    }
    None
}

fn time_zone_identifier(value: &str) -> &str {
    let value = value.strip_prefix(':').unwrap_or(value);
    let Some((_, zone)) = value.rsplit_once("/zoneinfo/") else {
        return value;
    };
    zone.strip_prefix("posix/")
        .or_else(|| zone.strip_prefix("right/"))
        .unwrap_or(zone)
}
// ECMA-402 §§11.1.2 step 19 and 11.1.3: parse minute offsets and normalize their identifiers.
// https://tc39.es/ecma402/#sec-createdatetimeformat
// https://tc39.es/ecma402/#sec-formatoffsettimezoneidentifier
fn offset_zone(value: &str) -> Result<TimeZone, Error> {
    let bytes = value.as_bytes();
    let (hours, minutes) = match bytes {
        [b'+' | b'-', h1, h2] => ([*h1, *h2], [b'0', b'0']),
        [b'+' | b'-', h1, h2, m1, m2] => ([*h1, *h2], [*m1, *m2]),
        [b'+' | b'-', h1, h2, b':', m1, m2] => ([*h1, *h2], [*m1, *m2]),
        _ => return Err(Error::InvalidTimeZone),
    };
    if !hours.iter().chain(minutes.iter()).all(u8::is_ascii_digit) {
        return Err(Error::InvalidTimeZone);
    }
    let hours = (hours[0] - b'0') * 10 + hours[1] - b'0';
    let minutes = (minutes[0] - b'0') * 10 + minutes[1] - b'0';
    if hours > 23 || minutes > 59 {
        return Err(Error::InvalidTimeZone);
    }
    let mut seconds = i32::from(hours) * 3600 + i32::from(minutes) * 60;
    if bytes[0] == b'-' {
        seconds = -seconds;
    }
    let sign = if seconds < 0 { '-' } else { '+' };
    Ok(TimeZone {
        name: format!("{sign}{hours:02}:{minutes:02}"),
        fixed: Some(seconds),
        target: None,
    })
}

// Proposal comparison §15.6.23 step 2.b: Supply fixed offsets for supported named Etc/GMT zones.
fn etc_gmt_zone(value: &str) -> Option<TimeZone> {
    let suffix = value.strip_prefix("ETC/GMT")?;
    if suffix.len() < 2 {
        return None;
    }
    let (sign, hours_text) = suffix.split_at(1);
    let hours: u8 = hours_text.parse().ok()?;
    if hours.to_string() != hours_text || hours == 0 {
        return None;
    }
    // IANA Etc/GMT signs are opposite UTC offset signs.
    let seconds = match sign {
        "+" if hours <= 12 => -i32::from(hours) * 3600,
        "-" if hours <= 14 => i32::from(hours) * 3600,
        _ => return None,
    };
    Some(TimeZone {
        name: format!("Etc/GMT{sign}{hours}"),
        fixed: Some(seconds),
        target: None,
    })
}
// Proposal comparison §15.6.23 step 2.b: Decode ordered transition data for offset lookup.
fn decode(mut data: PackedData) -> Result<BTreeMap<String, Zone>, Error> {
    let abbreviations: Vec<&str> = data.abbrvs.split('|').collect();
    let offsets: Vec<i32> = if data.offsets.is_empty() {
        Vec::new()
    } else {
        data.offsets
            .split('|')
            .map(|value| i32::from_str_radix(value, 36).map_err(|_| Error::InvalidTimeZoneData))
            .collect::<Result<_, _>>()?
    };
    let mut result = BTreeMap::new();
    for packed in data.zones {
        let mut fields = packed.split('|');
        let name = fields.next().ok_or(Error::InvalidTimeZoneData)?;
        if name.is_empty() || !name.is_ascii() {
            return Err(Error::InvalidTimeZoneData);
        }
        let mut transitions: Vec<Transition> = Vec::new();
        for field in fields {
            let [timestamp, abbreviation, offset, dst]: [&str; 4] = field
                .split(',')
                .collect::<Vec<_>>()
                .try_into()
                .map_err(|_| Error::InvalidTimeZoneData)?;
            let seconds = if timestamp.is_empty() && transitions.is_empty() {
                i64::MIN
            } else {
                i64::from_str_radix(timestamp, 36).map_err(|_| Error::InvalidTimeZoneData)?
            };
            let abbreviation: usize = abbreviation
                .parse()
                .map_err(|_| Error::InvalidTimeZoneData)?;
            let offset: usize = offset.parse().map_err(|_| Error::InvalidTimeZoneData)?;
            if abbreviation >= abbreviations.len()
                || offset >= offsets.len()
                || !matches!(dst, "0" | "1")
            {
                return Err(Error::InvalidTimeZoneData);
            }
            if transitions
                .last()
                .is_some_and(|previous| previous.seconds >= seconds)
            {
                return Err(Error::InvalidTimeZoneData);
            }
            transitions.push(Transition {
                seconds,
                offset: TimeZoneOffset {
                    seconds: offsets[offset],
                    in_dst: dst == "1",
                },
            });
        }
        if transitions
            .first()
            .is_none_or(|first| first.seconds != i64::MIN)
        {
            return Err(Error::InvalidTimeZoneData);
        }
        let key = name.to_ascii_uppercase();
        let future = data.future.remove(name);
        if future.as_ref().is_some_and(|rule| !rule.valid()) {
            return Err(Error::InvalidTimeZoneData);
        }
        if result
            .insert(
                key,
                Zone {
                    name: name.into(),
                    transitions,
                    future,
                },
            )
            .is_some()
        {
            return Err(Error::InvalidTimeZoneData);
        }
    }
    if !data.future.is_empty() {
        return Err(Error::InvalidTimeZoneData);
    }
    Ok(result)
}
impl TimeZoneRegistry {
    #[cfg(feature = "compiled_data")]
    // Proposal comparison §15.6.23 step 2.b: Install the compiled Intl timezone data.
    pub fn with_compiled_data() -> Self {
        let registry = Self::default();
        registry
            .load_json(include_str!(env!("FORMATJS_COMPILED_TIMEZONES")))
            .expect("generated IANA time zones");
        registry
    }

    // Proposal comparison §15.6.23 step 2.b: Replace Intl offset data after successful decode.
    pub fn load_json(&self, json: &str) -> Result<(), Error> {
        let packed = serde_json::from_str(json).map_err(|_| Error::InvalidTimeZoneData)?;
        let zones = decode(packed)?;
        // JS __addTZData replaces the entire map, including already-used zones.
        self.state.write().expect("time zone registry").zones = Arc::new(zones);
        Ok(())
    }
    // Proposal comparison §15.6.23 step 2.b: Capture the map used by offset lookup.
    pub fn snapshot(&self) -> TimeZoneSnapshot {
        TimeZoneSnapshot {
            zones: self.state.read().expect("time zone registry").zones.clone(),
        }
    }
    // Proposal comparison §15.4.1 step 32.a: Resolve an Intl zone against a captured map.
    pub fn resolve(&self, value: &str) -> Result<TimeZone, Error> {
        self.snapshot().resolve(value)
    }
    // ECMA-402 §11.1.2 step 18 uses the current system zone by default.
    // https://tc39.es/ecma402/#sec-createdatetimeformat
    // ECMA-262 §21.4.1.24 returns UTC when only UTC is available.
    // https://tc39.es/ecma262/#sec-systemtimezoneidentifier
    pub fn default_time_zone(&self) -> TimeZone {
        let state = self.state.read().expect("time zone registry");
        let snapshot = TimeZoneSnapshot {
            zones: state.zones.clone(),
        };
        // Re-resolve the override because the active pack may have changed.
        if let Some(zone) = state
            .default
            .as_deref()
            .and_then(|name| snapshot.resolve(name).ok())
        {
            return zone;
        }
        state
            .host_time_zone
            .as_deref()
            .and_then(|name| snapshot.resolve_system_zone(name))
            .or_else(|| {
                let name = system_time_zone_name()?;
                snapshot.resolve_system_zone(time_zone_identifier(&name))
            })
            .unwrap_or_else(utc)
    }
    pub fn set_default_time_zone(&self, value: Option<&str>) -> Result<(), Error> {
        let mut state = self.state.write().expect("time zone registry");
        let snapshot = TimeZoneSnapshot {
            zones: state.zones.clone(),
        };
        state.default = value
            .map(|name| snapshot.resolve(name).map(|zone| zone.name))
            .transpose()?;
        Ok(())
    }
    pub(crate) fn set_host_time_zone(&self, name: String) {
        self.state
            .write()
            .expect("time zone registry")
            .host_time_zone = (!name.is_empty()).then_some(name);
    }
    // Proposal comparison §15.6.23 steps 1.a and 2.b: Look up the offset in a captured map.
    pub fn offset_at(&self, zone: &TimeZone, epoch_nanoseconds: i128) -> TimeZoneOffset {
        self.snapshot().offset_at(zone, epoch_nanoseconds)
    }
    // Proposal comparison §15.6.23 step 3: Delegate local-time projection with a captured zone map.
    pub fn local_time(
        &self,
        zone: &TimeZone,
        epoch_nanoseconds: i128,
    ) -> Result<(CivilDateTime, TimeZoneOffset), Error> {
        self.snapshot().local_time(zone, epoch_nanoseconds)
    }
}

#[derive(Clone)]
pub struct TimeZoneSnapshot {
    zones: Arc<BTreeMap<String, Zone>>,
}
impl TimeZoneSnapshot {
    fn resolve_system_zone(&self, name: &str) -> Option<TimeZone> {
        // ECMA-262 §21.4.1.24 prefers the system zone's primary identifier.
        // https://tc39.es/ecma262/#sec-systemtimezoneidentifier
        // A partial pack may have only the host alias's own rows.
        let ids = identifiers();
        ids.links
            .get(&name.to_ascii_uppercase())
            .and_then(|(identifier, _)| ids.primary.get(identifier))
            .and_then(|primary| self.resolve(primary).ok())
            .or_else(|| self.resolve(name).ok())
    }

    // ECMA-402 §11.5.11 steps 1–2 resolve fixed and named offsets.
    // https://tc39.es/ecma402/#sec-tolocaltime
    // ECMA-262 §21.4.1.21 looks up the named offset at the requested instant.
    // https://tc39.es/ecma262/#sec-getnamedtimezoneoffsetnanoseconds
    pub fn offset_at(&self, zone: &TimeZone, epoch_nanoseconds: i128) -> TimeZoneOffset {
        if let Some(seconds) = zone.fixed {
            return TimeZoneOffset {
                seconds,
                in_dst: false,
            };
        }
        let lookup = zone.target.as_deref().unwrap_or(&zone.name);
        let Some(data) = self.zones.get(&lookup.to_ascii_uppercase()) else {
            return TimeZoneOffset {
                seconds: 0,
                in_dst: false,
            };
        };
        let seconds = epoch_nanoseconds.div_euclid(1_000_000_000);
        if data
            .transitions
            .last()
            .is_some_and(|last| seconds > i128::from(last.seconds))
        {
            if let Some(offset) = data
                .future
                .as_ref()
                .and_then(|rule| rule.offset_at(epoch_nanoseconds))
            {
                return offset;
            }
        }
        let index = data
            .transitions
            .partition_point(|transition| i128::from(transition.seconds) <= seconds);
        data.transitions[index.saturating_sub(1)].offset
    }
    // ECMA-402 §11.5.11 steps 3–5 add the offset before civil projection.
    pub fn local_time(
        &self,
        zone: &TimeZone,
        epoch_nanoseconds: i128,
    ) -> Result<(CivilDateTime, TimeZoneOffset), Error> {
        let offset = self.offset_at(zone, epoch_nanoseconds);
        let value = epoch_nanoseconds
            .checked_add(i128::from(offset.seconds) * 1_000_000_000)
            .ok_or(Error::InvalidDate)?;
        Ok((CivilDateTime::from_epoch_nanoseconds(value)?, offset))
    }
    // ECMA-402 §11.1.2 steps 19–20 resolves the supplied identifier.
    // https://tc39.es/ecma402/#sec-createdatetimeformat
    // ECMA-402 §§6.1 and 6.5.1–2 match IANA identifiers with ASCII case folding.
    // https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
    // https://tc39.es/ecma402/#sup-availablenamedtimezoneidentifiers
    // https://tc39.es/ecma402/#sec-getavailablenamedtimezoneidentifier
    pub fn resolve(&self, value: &str) -> Result<TimeZone, Error> {
        if !value.is_ascii() {
            return Err(Error::InvalidTimeZone);
        }
        if value.starts_with(['+', '-']) {
            return offset_zone(value);
        }
        let key = value.to_ascii_uppercase();
        if key == "UTC" {
            return Ok(named("UTC".into(), "UTC".into()));
        }
        if let Some(zone) = etc_gmt_zone(&key) {
            return Ok(zone);
        }
        if let Some((name, target)) = identifiers().links.get(&key) {
            if matches!(target.as_str(), "Etc/UTC" | "Etc/GMT") {
                return Ok(named(name.clone(), "UTC".into()));
            }
            // A pack can include either the IANA link's target or the link's own rows.
            if self.zones.contains_key(&target.to_ascii_uppercase()) {
                return Ok(named(name.clone(), target.clone()));
            }
            return self
                .zones
                .get(&key)
                .map(|zone| named(name.clone(), zone.name.clone()))
                .ok_or(Error::InvalidTimeZone);
        }
        self.zones
            .get(&key)
            .map(|zone| named(zone.name.clone(), zone.name.clone()))
            .ok_or(Error::InvalidTimeZone)
    }
}
