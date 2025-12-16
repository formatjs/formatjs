
#!/bin/bash
set -e

bazel build :dist
cp -rf $(bazel cquery --output=files dist)/ release/
chmod -R +w release/
# Use `--access=public` to publish new packages with `@formatjs/` scope.
pushd release
pnpm ci
popd