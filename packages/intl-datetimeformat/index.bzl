"""Build definitions for intl-datetimeformat package."""

load("//packages/intl-datetimeformat:defs.bzl", "ZONES")

ZIC_FILES = [
    "backward",
    "africa",
    "antarctica",
    "asia",
    "australasia",
    "etcetera",
    "europe",
    "northamerica",
    "southamerica",
]

def generate_tz_data(name):
    """Generate zdump data from Bazel-built IANA zic/zdump tools."""
    unique_dirs = {}
    for zone in ZONES:
        parent_dir = zone.rsplit("/", 1)[0]
        unique_dirs[parent_dir] = True

    mkdir_commands = "\n".join(["mkdir -p \"$${out_dir}/zdump/%s\"" % dir for dir in unique_dirs])
    zic_inputs = " ".join([
        "\"$${execroot}/$(location @iana_tzdata//:%s)\"" % zic_file
        for zic_file in ZIC_FILES
    ])
    zdump_commands = "\n".join([
        "\"$${zdump}\" -c 2100 -v zic/{zone} > \"$${out_dir}/zdump/{zone}\"".replace("{zone}", zone)
        for zone in ZONES
    ])

    cmd = """
set -euo pipefail

execroot="$$(pwd)"
out_dir="$${execroot}/$(@D)/tz_data_generated"
work_dir="$${execroot}/$(@D)/tz_work"
zic="$${execroot}/$(execpath @iana_tzcode//:zic)"
zdump="$${execroot}/$(execpath @iana_tzcode//:zdump)"

rm -rf "$${out_dir}" "$${work_dir}"
mkdir -p "$${out_dir}/zdump" "$${work_dir}/zic"
{mkdir_commands}

"$${zic}" -d "$${work_dir}/zic" {zic_inputs}
cp "$${execroot}/$(location @iana_tzdata//:backward)" "$${out_dir}/backward"

cd "$${work_dir}"
{zdump_commands}
        """.replace("{mkdir_commands}", mkdir_commands).replace("{zic_inputs}", zic_inputs).replace("{zdump_commands}", zdump_commands)

    native.genrule(
        name = name,
        srcs = ["@iana_tzdata//:%s" % zic_file for zic_file in ZIC_FILES],
        outs = ["tz_data_generated/zdump/%s" % zone for zone in ZONES] + ["tz_data_generated/backward"],
        cmd = cmd,
        message = "Generating zdump data files",
        tools = [
            "@iana_tzcode//:zdump",
            "@iana_tzcode//:zic",
        ],
    )
