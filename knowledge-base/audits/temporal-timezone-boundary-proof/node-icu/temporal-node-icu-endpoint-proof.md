# Exact endpoint intervals for the Node 26.5.1 host profile

The current Linux x64 Node 26.5.1 binary supplies ICU 78.3 with loaded
timezone data 2026b. Its SHA256 is
`fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6`.
This proof applies when FormatJS captures that binary's built-in
Intl.DateTimeFormat and the same ICU resource configuration. Other host
versions, external timezone resource overrides, and replaced Intl
providers keep their own premise. Native Temporal's provider is not used.

## Shared resource path

The binary locations below are addresses in the exact hashed executable.
The [binding script](temporal-node-icu-endpoint-binding.sh) extracts the
relevant call sites with GNU objdump and nm.

1. V8's DateTimeFormat constructor at `0x119f710` calls
   `CreateDateTimeFormat`. That function obtains the named timezone through
   `CreateTimeZone` and passes it to `CreateCalendar`. The named zone
   factory calls `icu_78::TimeZone::createTimeZone` at `0x1f1b640`.
   `CreateCalendar` passes the timezone to ICU's Calendar constructor.
   The formatter adopts the resulting calendar through the
   `SimpleDateFormat::adoptCalendar` vtable slot. Numeric formatToParts
   passes the value to `icu_78::DateFormat::format(double, ...)`.
2. The probe's `ucal_open` calls the same timezone and calendar factories
   for the supplied named ID. Both paths use `createSystemTimeZone`,
   `openOlsonResource` and the OlsonTimeZone constructor. The resource
   opened is `zoneinfo64`. The version reported by the probe comes from
   the `TZVersion` field of that same resource. The executable has a
   linked-in `icudt78_dat` and uses full ICU. The probe rejects external
   ICU and loader overrides.
3. `ucal_getTimeZoneTransitionDate` reads the calendar's current milliseconds,
   obtains the calendar's TimeZone, and dispatches through the BasicTimeZone
   nearest-transition method. The scan verifies each opened identifier and
   checks that both the BasicTimeZone and OlsonTimeZone casts succeed.
   This rules out an unsupported zone type appearing as a false result.
   The nearest-transition API provides interval coverage from its inclusive
   query contract.
   [ICU transition API](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/ucal_8h.html)
   [BasicTimeZone contract](https://unicode-org.github.io/icu-docs/apidoc/released/icu4c/classicu_1_1BasicTimeZone.html).

FormatJS's host offset adapter supplies an explicit named timezone and
numeric milliseconds to that formatter. Its integer offset decoding uses
ISO calendar fields and rejects magnitudes of a day or more.
[Adapter](../../../../packages/temporal/host-timezone.ts#L84).

## Interval certificate

The probe opens all 638 system identifiers enumerated by the loaded ICU
library and confirms that they include every named zone returned by native
Intl.supportedValuesOf. Fixed offset identifiers require no transition
scan. For each system identifier and each Instant endpoint E, the probe
requests the earliest transition in the closed interval
[E − 172800000, E + 172800000] milliseconds, including the outside edge.
ICU's time setter/getter round-trips the start exactly. The integer
milliseconds and first transition values lie within the exact Number
range. The 2024 New York fall-back control verifies inclusive lookup,
step direction and raw plus DST offset decoding.

No identifier has a transition in either interval. The earliest transition
following the lower interval is Pacific/Kosrae at `-3944631116000` ms.
The nearest transition following the upper interval is Antarctica/McMurdo
at `8640001260000000` ms, which is 1,260,000,000 ms beyond the upper
endpoint. The 425 upper no-next results come from functioning Olson zone
objects. The transition endpoint values are recorded per identifier.
[Endpoint windows](temporal-node-icu-endpoint-windows.tsv) and
[summary](summary.json).

A valid/invalid pair for the same local time must differ by less than two
days, since both offsets have magnitude less than one day. A pair straddling
E would therefore require an offset decrease inside the tested interval.
The provider exposes none. This discharges the mixed-validity fold premise
for this binary and data path. Reuse the separately verified single-invalid
RangeError path. The full conditional row still includes unexamined host
profiles and remains open.

## Reproduce

Run from a clean runtime environment without ICU data overrides:

```sh
/usr/local/bin/node --experimental-ffi temporal-node-icu-endpoint-scan.mjs \
  > temporal-node-icu-endpoint-scan.json
bash temporal-node-icu-endpoint-binding.sh /usr/local/bin/node \
  > temporal-node-icu-endpoint-binding.txt
```

These read-only analysis commands call the already loaded ICU C API and
check its object types. They add no production dependency. Original
artifact SHA256 values:

- `temporal-node-icu-endpoint-scan.mjs`:
  `aabefe37e6e80119c1d9562677d7b04fce93da942fadfd0a10418540dcdec0c1`
- Generated `temporal-node-icu-endpoint-scan.json`:
  `a75e976a71981cc0d7400ee275486de0719c9af4b5ea8f670a6f30bf8976bc45`
- `temporal-node-icu-endpoint-binding.sh`:
  `5737cddbc2fa725b20029190f3c9924039d7dc208e447014a5cc4db40af1e6e6`
- `temporal-node-icu-endpoint-binding.txt`:
  `8deb0ac51ba7f8fc04edbd00e5a5c22853b5197f2f4861531811edded7560283`

Run the same interval proof again before extending its scope to a different
binary or timezone data path.
