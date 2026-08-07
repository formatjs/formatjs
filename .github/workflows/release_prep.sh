#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail

TAG=$1
case "$TAG" in
  rules_formatjs_v*) ;;
  *)
    echo "Expected rules_formatjs_v* tag, got $TAG" >&2
    exit 1
    ;;
esac

VERSION=${TAG#rules_formatjs_v}
PREFIX="rules_formatjs-$VERSION"
ARCHIVE="$PREFIX.tar.gz"

git archive \
  --format=tar \
  --prefix="$PREFIX/" \
  "$TAG:rules/formatjs" | gzip > "$ARCHIVE"

docs=$(mktemp -d)
targets=$(mktemp)
(
  cd rules/formatjs
  bazel --output_base="$docs" query \
    --output=label \
    'kind("starlark_doc_extract rule", //...)' > "$targets"
  bazel --output_base="$docs" build --target_pattern_file="$targets"
  tar \
    --create \
    --auto-compress \
    --directory "$(bazel --output_base="$docs" info bazel-bin)" \
    --file "$GITHUB_WORKSPACE/${ARCHIVE%.tar.gz}.docs.tar.gz" \
    .
)

cat <<EOF
## Using Bzlmod

Add to your \`MODULE.bazel\`:

\`\`\`starlark
bazel_dep(name = "rules_formatjs", version = "$VERSION")
\`\`\`

The FormatJS CLI toolchains register automatically.
EOF
