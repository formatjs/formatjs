#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail

diff -u "$2" "$1"
