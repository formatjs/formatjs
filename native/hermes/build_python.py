"""Expose Bazel's Python interpreter to Hermes' CMake generators."""

import os
import sys

os.execv(sys.executable, [sys.executable, *sys.argv[1:]])
