#!/bin/bash -eu

# Build script invoked by OSS-Fuzz (https://github.com/google/oss-fuzz).
# Run from $SRC/formatjs/fuzz inside the OSS-Fuzz base-builder-javascript image.

# The published @formatjs/* packages ship as ESM only (`"type": "module"`).
# Jazzer.js loads fuzz targets via CommonJS `require`, so we transpile the
# formatjs packages to CommonJS with Babel and rewrite their package.json's
# `type` field accordingly. Other packages in node_modules are already
# CommonJS and we leave them alone.
function change_type_to_commonjs() {
  find "$1" -name "package.json" -type f | while read -r package_file; do
    if grep -q '"type": "module"' "$package_file"; then
      sed -i 's/"type": "module"/"type": "commonjs"/' "$package_file"
    fi
  done
}

function transform_dir_into_commonjs() {
  babel "$1" --keep-file-extension --copy-files -D -d "$1"_commonjs
  rm -r "$1"
  mv "$1"_commonjs "$1"
}

# Install runtime dependencies (formatjs packages) and the build-time toolchain
# we need to convert ESM → CommonJS.
npm install
# Pin to Jazzer.js 2.x: Jazzer.js 4.0.0's prebuilt native addon requires
# GLIBC 2.32, which the OSS-Fuzz base images (Ubuntu 20.04 LTS, glibc 2.31)
# don't provide. Drop the pin once base images move past glibc 2.32.
npm install --save-dev '@jazzer.js/core@^2'
npm install --save-dev --global @babel/cli
npm install --save-dev @babel/core @babel/plugin-transform-modules-commonjs

# Transform only the formatjs packages we fuzz (and the intl-messageformat
# dependency tree). Other packages in node_modules are CommonJS already and
# may use modern syntax that this minimal Babel config can't handle.
for pkg in node_modules/@formatjs/* node_modules/intl-messageformat; do
  if [ -d "$pkg" ]; then
    transform_dir_into_commonjs "$pkg"
    change_type_to_commonjs "$pkg"
  fi
done

# Build fuzzers. -i restricts Jazzer.js coverage instrumentation to formatjs
# code so we don't waste cycles on Node built-ins or transitive helpers.
compile_javascript_fuzzer formatjs fuzz_icu_messageformat_parser.js \
    -i @formatjs -i intl-messageformat --sync
compile_javascript_fuzzer formatjs fuzz_intl_messageformat.js \
    -i @formatjs -i intl-messageformat --sync
compile_javascript_fuzzer formatjs fuzz_icu_skeleton_parser.js \
    -i @formatjs -i intl-messageformat --sync
