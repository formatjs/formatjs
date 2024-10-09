#!/bin/bash

set -x

# --- begin runfiles.bash initialization v3 ---
# Copy-pasted from the Bazel Bash runfiles library v3.
set -uo pipefail
set +e
f=bazel_tools/tools/bash/runfiles/runfiles.bash
# shellcheck disable=SC1090
source "${RUNFILES_DIR:-/dev/null}/$f" 2>/dev/null ||
    source "$(grep -sm1 "^$f " "${RUNFILES_MANIFEST_FILE:-/dev/null}" | cut -f2- -d' ')" 2>/dev/null ||
    source "$0.runfiles/$f" 2>/dev/null ||
    source "$(grep -sm1 "^$f " "$0.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null ||
    source "$(grep -sm1 "^$f " "$0.exe.runfiles_manifest" | cut -f2- -d' ')" 2>/dev/null ||
    {
        echo >&2 "ERROR: cannot find $f"
        exit 1
    }
f=
set -e
# --- end runfiles.bash initialization v3 ---

# Source location
outfile=$(rlocation formatjs/packages/intl-datetimeformat/tz_data.tar.gz)
docker_dir=$(dirname $(rlocation formatjs/packages/intl-datetimeformat/Dockerfile))

# Build the Docker image
docker build -t tz_image "$docker_dir"

# Run the container and capture the container ID
container_id=$(docker create tz_image)

# Check if the container was created successfully
if [ -n "$container_id" ]; then
    echo "Container $container_id created successfully."

    # Copy the file from the container to the host
    docker cp "$container_id":/tz_data.tar.gz "$outfile"

    # Check if the file was copied successfully
    if [ -f "$outfile" ]; then
        echo "File $outfile copied successfully."
    else
        echo "File $outfile not found or failed to copy."
        # Remove the container
        docker rm "$container_id"
        exit 1
    fi

    # Remove the container
    docker rm "$container_id"
    echo "Container $container_id removed."

else
    echo "Failed to create container from image."
    exit 1
fi
