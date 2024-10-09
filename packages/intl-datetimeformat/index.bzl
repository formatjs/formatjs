load("@aspect_bazel_lib//lib:write_source_files.bzl", "write_source_files")
load("//:index.bzl", "IANA_TZ_VERSION", "TZCODE_SHA256", "TZDATA_SHA256", "ZONES")

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
    mkdir_commands = "\n".join(["RUN mkdir -p /tz_data_generated/zdump/%s" % dir for dir in unique_dirs])

    # Create zdump commands for each zone
    zdump_commands = "\n".join(["RUN /tzdir/usr/bin/zdump -c 2100 -v /zic/%s > /tz_data_generated/zdump/%s" % (zone, zone) for zone in ZONES])

    # Generate the entire Dockerfile content as a string
    dockerfile_content = """
FROM ubuntu:22.04

# Set the IANA time zone version
ARG IANA_TZ_VERSION={iana_tz_version}

# Install dependencies
RUN apt-get update
RUN apt-get install -y build-essential make tar curl
RUN rm -rf /var/lib/apt/lists/*

# Set working directory for downloading files
WORKDIR /tz

# Download tzdata and tzcode based on the version
RUN curl -o tzdata.tar.gz https://data.iana.org/time-zones/releases/tzdata{iana_tz_version}.tar.gz
RUN curl -o tzcode.tar.gz https://data.iana.org/time-zones/releases/tzcode{iana_tz_version}.tar.gz

# Verify the SHA-256 checksum
RUN echo "{tzdata_sha256}  tzdata.tar.gz" | sha256sum -c -
RUN echo "{tzcode_sha256}  tzcode.tar.gz" | sha256sum -c -

# Extract the downloaded files into /tz
RUN tar -xzf tzdata.tar.gz -C /tz
RUN tar -xzf tzcode.tar.gz -C /tz

# Set the new working directory to /tz
WORKDIR /tz

# Pre-compile tzdata
ENV TOPDIR=/tzdir

# Create the necessary directories (only once per parent directory)
{mkdir_commands}

# Install tzdata and compile zic files
RUN make TOPDIR=/tzdir install
RUN echo 'Compiling zic data'
RUN /tzdir/usr/sbin/zic -d /zic {zic_files}
RUN cp /tz/backward /tz_data_generated
RUN echo 'Compiling zdump data'

# Compile zdump data for all zones
{zdump_commands}

# Archive the data
RUN tar -czvf /tz_data.tar.gz /tz_data_generated

# Command to copy the data archive
CMD ["cp", "/tz_data.tar.gz", "/output/tz_data.tar.gz"]
    """.format(
        iana_tz_version = IANA_TZ_VERSION,
        tzdata_sha256 = TZDATA_SHA256,
        tzcode_sha256 = TZCODE_SHA256,
        mkdir_commands = mkdir_commands,
        zic_files = ZIC_FILES,
        zdump_commands = zdump_commands,
    )

    # Write the Dockerfile content to the output file
    native.genrule(
        name = "%s_gen" % name,
        srcs = [],
        outs = ["Dockerfile"],
        cmd = """
            echo '{}' > $@
        """.format(dockerfile_content.replace("'", "'\\''")),
    )

    write_source_files(
        name = name,
        files = {
            "Dockerfile": "%s_gen" % name,
        },
    )
