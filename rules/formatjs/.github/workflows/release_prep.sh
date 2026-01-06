#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail

# Argument provided by reusable workflow caller, see
# https://github.com/bazel-contrib/.github/blob/d197a6427c5435ac22e56e33340dff912bc9334e/.github/workflows/release_ruleset.yaml#L72
TAG=$1
# The prefix is chosen to match what GitHub generates for source archives
# This guarantees that users can easily switch from a released artifact to a source archive
# with minimal differences in their code (e.g. strip_prefix remains the same)
PREFIX="rules_formatjs-${TAG:1}"
ARCHIVE="rules_formatjs-$TAG.tar.gz"

# NB: configuration for 'git archive' is in /.gitattributes
# Create the main archive
git archive --format=tar --prefix=${PREFIX}/ ${TAG} > "${ARCHIVE%.gz}"

# Add e2e/smoke test to the archive (examples are excluded by .gitattributes but we want smoke test included)
# Create a temporary directory with the smoke test in the right structure
TMPDIR=$(mktemp -d)
mkdir -p "${TMPDIR}/${PREFIX}/e2e"
# Copy smoke test but exclude bazel output directories and lock files
rsync -a --exclude='bazel-*' --exclude='MODULE.bazel.lock' e2e/smoke/ "${TMPDIR}/${PREFIX}/e2e/smoke/"
tar -rf "${ARCHIVE%.gz}" -C "${TMPDIR}" .
rm -rf "${TMPDIR}"

# Compress the archive
gzip "${ARCHIVE%.gz}"

SHA=$(shasum -a 256 $ARCHIVE | awk '{print $1}')

# Add generated API docs to the release, see https://github.com/bazelbuild/bazel-central-registry/issues/5593
docs="$(mktemp -d)"; targets="$(mktemp)"
bazel --output_base="$docs" query --output=label 'kind("starlark_doc_extract rule", //...)' > "$targets"
bazel --output_base="$docs" build --target_pattern_file="$targets"
tar --create --auto-compress \
    --directory "$(bazel --output_base="$docs" info bazel-bin)" \
    --file "$GITHUB_WORKSPACE/${ARCHIVE%.tar.gz}.docs.tar.gz" .

cat << EOF
## Using Bzlmod with Bazel 6 or greater

1. (Bazel 6+ only) Enable with \`common --enable_bzlmod\` in \`.bazelrc\`.
2. Add to your \`MODULE.bazel\` file:

\`\`\`starlark
bazel_dep(name = "rules_formatjs", version = "${TAG:1}")
\`\`\`

That's it! The toolchains are automatically registered.

## Testing the Installation

A smoke test is included in the release at \`e2e/smoke/\`. To verify the rules work in your environment:

\`\`\`bash
cd e2e/smoke
bazel build //:extract
\`\`\`

This will extract messages from a simple React component and verify that the FormatJS CLI toolchain is working correctly.
EOF
