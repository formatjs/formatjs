"""Extract the bound Chromium timezone resources from its ICU CmnD package."""

import hashlib
from pathlib import Path
import struct
import sys

archive, destination = map(Path, sys.argv[1:])
data = archive.read_bytes()
assert hashlib.sha256(data).hexdigest() == (
    "02a01b3188b6a41a756f7322fdb5e6b5ca6573b327b01dfc8ed662d571a6f769"
)
assert data[2:4] == b"\xda\x27" and data[12:16] == b"CmnD"
header_size = struct.unpack_from("<H", data)[0]
(count,) = struct.unpack_from("<I", data, header_size)
records = []
for index in range(count):
    name_offset, resource_offset = struct.unpack_from(
        "<II", data, header_size + 4 + index * 8
    )
    start = header_size + name_offset
    name = data[start : data.index(b"\0", start)].decode()
    records.append((header_size + resource_offset, name))
records.sort()
records.append((len(data), ""))

names = {"metaZones.res", "timezoneTypes.res", "windowsZones.res", "zoneinfo64.res"}
destination.mkdir()
for (start, name), (end, _) in zip(records, records[1:]):
    prefix, _, resource = name.partition("/")
    if prefix == "icudt78l" and resource in names:
        (destination / resource).write_bytes(data[start:end])
assert {p.name for p in destination.iterdir()} == names
