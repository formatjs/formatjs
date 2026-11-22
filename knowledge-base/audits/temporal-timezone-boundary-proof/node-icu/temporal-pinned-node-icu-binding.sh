#!/usr/bin/env bash
set -euo pipefail
node_bin=${1:?usage: bash script /path/to/pinned/node}
digest=$(sha256sum "$node_bin" | cut -d ' ' -f 1)
case "$digest" in
  e237a2839d0cbdc9a9a2adda1a184afc0f5b20306ffbe923af5686550472d8a8)
    constructor=(0xc31c60 0xc31f52)
    new=(0x10b7760 0x10b777a)
    create_formatter=(0x10b47f0 0x10b74da)
    create_zone=(0x10af790 0x10af90f)
    create_calendar=("${create_formatter[@]}")
    adopt_site=(0x10b6d99 0x10b6da5)
    adopt_entry=0x41a2280
    format_parts=(0x10b7bf0 0x10b7eb5)
    format_kind=(0x10b78d0 0x10b7ae9)
    format_array=(0x10b7af0 0x10b7be2)
    timezone=(0x204b040 0x204b186)
    olson_zone=(0x20482a0 0x204835b)
    olson_resource=(0x20481a0 0x20482a0)
    tz_version=(0x204ba80 0x204bb81)
    resource_name=0x41a2d40
    versions=24.14.0,78.2,2025c
    ;;
  19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3)
    constructor=(0xd01e90 0xd0215e)
    new=(0x11c1dc0 0x11c1dde)
    create_formatter=(0x11bfb20 0x11c119b)
    create_zone=(0x11c1c70 0x11c1dbb)
    create_calendar=(0x11c2370 0x11c27af)
    adopt_site=(0x11c0c26 0x11c0c33)
    adopt_entry=0x4b1bae8
    format_parts=(0x11c4270 0x11c4446)
    format_kind=(0x11d0c00 0x11d0d6c)
    format_array=(0x11cb0d0 0x11cb4da)
    timezone=(0x1ff9060 0x1ff90a7)
    olson_zone=(0x1ffb460 0x1ffb620)
    olson_resource=(0x1ff9b60 0x1ff9c48)
    tz_version=(0x1ffad20 0x1ffae0b)
    resource_name=0x40e1cf7
    versions=26.8.1,78.3,2026c
    ;;
  *) echo "Unexpected Node executable digest: $digest" >&2; exit 1 ;;
esac
echo "$digest $versions"
instructions() {
  objdump -dC --start-address="$1" --stop-address="$2" "$node_bin"
}
instructions "${constructor[@]}" | rg '(call|jmp).*JSDateTimeFormat::New'
instructions "${new[@]}" | rg '(call|jmp).*CreateDateTimeFormat'
instructions "${create_formatter[@]}" | rg 'call.*CreateTimeZone'
instructions "${create_calendar[@]}" | rg 'call.*Calendar::createInstance'
instructions "${create_zone[@]}" | rg 'call.*(TimeZone::createTimeZone|IsValidTimeZoneName)'
instructions "${adopt_site[@]}" | rg 'call.*\*0x88'
objdump -s --start-address="$adopt_entry" --stop-address="$((adopt_entry + 8))" "$node_bin" | rg '^ [[:xdigit:]]{7} '
nm -S -C "$node_bin" | rg ' (icu_78::SimpleDateFormat::adoptCalendar\(|vtable for icu_78::SimpleDateFormat$|icudt78_dat$)'
instructions "${format_parts[@]}" | rg '(call|jmp).*(HandleDateTimeValue|FormatMillisecondsByKindToArray)'
instructions "${format_kind[@]}" | rg '(call|jmp).*(DateFormat::format\(double|FormatMillisecondsToArray|FormatMillisecondsToArrayWith|CallICUFormat)'
instructions "${format_array[@]}" | rg '(call|jmp).*(DateFormat::format\(double|FormatMillisecondsToArrayWith|CallICUFormat)'
objdump -dC --disassemble=ucal_open_78 "$node_bin" | rg 'call.*(TimeZone::createTimeZone|Calendar::createInstance)'
instructions "${timezone[@]}" | rg 'call.*(createSystemTimeZone|openOlsonResource|OlsonTimeZone::OlsonTimeZone)'
instructions "${olson_zone[@]}" | rg 'call.*(openOlsonResource|OlsonTimeZone::OlsonTimeZone)'
instructions "${olson_resource[@]}" | rg "($resource_name|ures_openDirect)"
instructions "${tz_version[@]}" | rg "($resource_name|ures_openDirectFillIn|ures_getStringByKey)"
objdump -s --start-address="$resource_name" --stop-address="$((resource_name + 11))" "$node_bin" | rg 'zoneinfo'
objdump -dC --disassemble=ucal_getTimeZoneTransitionDate_78 "$node_bin" | rg '(Calendar::getTimeInMillis|Calendar::getTimeZone|__dynamic_cast|call.*\*0x70|TimeZoneTransition::getTime)'
if readelf -d "$node_bin" | rg 'NEEDED.*icu'; then exit 1; fi
