#!/usr/bin/env bash
set -euo pipefail
node_bin=${1:?usage: bash script /path/to/node}
expected=fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6
test "$(sha256sum "$node_bin" | cut -d ' ' -f 1)" = "$expected"

instructions() {
  objdump -dC --start-address="$1" --stop-address="$2" "$node_bin"
}

instructions 0x119f710 0x119f728 | rg 'call.*CreateDateTimeFormat'
instructions 0x119d470 0x119eaeb | rg 'call.*(CreateTimeZone|CreateCalendar)'
instructions 0x119e550 0x119e583 | rg '0x1a0|1a0\(|call'
instructions 0x119f5c0 0x119f710 | rg 'call.*(TimeZone::createTimeZone|IsValidTimeZoneName)'
instructions 0x119fcc0 0x11a0eb0 | rg 'call.*Calendar::createInstance'
instructions 0x11a1bc0 0x11a1e90 | rg 'call.*(HandleDateTimeValue|DateFormat::format\(double)'
objdump -s --start-address=0x489c478 --stop-address=0x489c480 "$node_bin"
nm -S -C "$node_bin" | rg '^[[:xdigit:]]+ .* (icu_78::SimpleDateFormat::adoptCalendar|vtable for icu_78::SimpleDateFormat|icudt78_dat)$|^[[:xdigit:]]+ .* icu_78::SimpleDateFormat::adoptCalendar\('
objdump -dC --disassemble=ucal_open_78 "$node_bin" | rg 'call.*(TimeZone::createTimeZone|Calendar::createInstance)'
instructions 0x1f1b640 0x1f1b687 | rg 'call.*createSystemTimeZone'
instructions 0x1f1da40 0x1f1db0f | rg 'call.*(openOlsonResource|OlsonTimeZone::OlsonTimeZone)'
instructions 0x1f1c140 0x1f1c228 | rg '(0x3e8a314|ures_openDirect)'
objdump -dC --disassemble=ucal_getTZDataVersion_78 "$node_bin" | rg '(TimeZone::getTZDataVersion)'
instructions 0x1f1d300 0x1f1d3eb | rg '(0x3e8a314|0x3ee86ab|ures_openDirectFillIn|ures_getStringByKey)'
objdump -s --start-address=0x3e8a314 --stop-address=0x3e8a31f "$node_bin"
objdump -s --start-address=0x3ee86ab --stop-address=0x3ee86b5 "$node_bin"
objdump -dC --disassemble=ucal_getTimeZoneTransitionDate_78 "$node_bin" | rg '(Calendar::getTimeInMillis|Calendar::getTimeZone|__dynamic_cast|call.*\*0x70|TimeZoneTransition::getTime)'
