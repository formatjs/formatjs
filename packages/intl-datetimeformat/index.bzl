load("//:index.bzl", "ZONES")

# Pre-compile tzdata
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

IANA_TZ_VERSION = "2025c"

def generate_dockerfile(name):
    """
    Generates a Dockerfile with the necessary commands to create directories and run zdump for each zone.

    Args:
        name: The name of the genrule.
    """

    # Deduplicate parent directories in Starlark
    unique_dirs = {}
    for zone in ZONES:
        parent_dir = zone.rsplit("/", 1)[0]
        unique_dirs[parent_dir] = True  # Dictionary to ensure uniqueness

    # Create mkdir commands for unique directories
    mkdir_commands = " && \\ \n".join(["mkdir -p /tz_data_generated/zdump/{}".format(dir) for dir in unique_dirs])

    # Create zdump commands for each zone
    zdump_commands = " && \\ \n".join(["/tzdir/usr/bin/zdump -c 2100 -v /zic/{} > /tz_data_generated/zdump/{}".format(zone, zone) for zone in ZONES])

    # Join the ZIC files list into a space-separated string
    zic_files = " ".join(ZIC_FILES)

    # Generate the entire Dockerfile content as a string
    dockerfile_content = """
FROM ubuntu:22.04

# Install dependencies (excluding tzdata)
RUN apt-get update && apt-get install -y build-essential make tar curl && \
    rm -rf /var/lib/apt/lists/*

# Set working directory for downloading files
WORKDIR /tz

# Download tzdata and tzcode based on the version
RUN curl -o tzdata.tar.gz https://data.iana.org/time-zones/releases/tzdata{iana_tz_version}.tar.gz
RUN curl -o tzcode.tar.gz https://data.iana.org/time-zones/releases/tzcode{iana_tz_version}.tar.gz

# Extract the copied files into /tz and set up directories in a single layer
RUN tar -xzf tzdata.tar.gz -C /tz && \\
    tar -xzf tzcode.tar.gz -C /tz && \\
    mkdir -p /tzdir/usr/sbin /tzdir/usr/bin /tz_data_generated/zdump && \\
    {mkdir_commands}

# Pre-compile tzdata and run zdump commands
RUN make TOPDIR=/tzdir install && \\
    /tzdir/usr/sbin/zic -d /zic {zic_files} && \\
    cp /tz/backward /tz_data_generated && \\
    {zdump_commands}

# Archive the data
RUN tar -czvf /tz_data.tar.gz /tz_data_generated
    """.format(
        iana_tz_version = IANA_TZ_VERSION,
        mkdir_commands = mkdir_commands,
        zic_files = zic_files,
        zdump_commands = zdump_commands,
    )

    # Write the Dockerfile content to the output file
    native.genrule(
        name = name,
        srcs = [],
        outs = ["Dockerfile"],
        cmd = """
            echo '{}' > $@
        """.format(dockerfile_content.replace("'", "'\\''")),
    )
