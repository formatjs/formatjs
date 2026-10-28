# Rust Intl crates

The `formatjs_intl_*` polyfill crates expose ECMA-402 operations and owned C ABIs.
`formatjs_intl_hermes` assembles their exports into one static archive. They remain
independent of the higher-level `formatjs_intl` message runtime.

Cargo packages include generated metadata and Chromium's default locale set.
Enable `compiled_data` on formatters to embed their locale records. Applications
can also register locale records explicitly. Published packages require neither
Node nor Bazel to compile.

## Publishing

Release Please manages versions and GitHub releases. The shared
`.github/workflows/crates-release.yml` workflow validates with Bazel, assembles
`//crates:intl_release`, and publishes through crates.io trusted publishing.
Use its `crate` and `dry_run` inputs to validate a release without publishing.

`bazel build //crates:intl_release` assembles Cargo package sources with
metadata, locale records, license notices, and Cargo build scripts. Bazel declares
all inputs and runs its pinned Python toolchain; no separate preparation command
is needed. DateTimeFormat extracts compressed records only with `compiled_data`.

The workflow exports release sources with `git archive`, overlays the Bazel
package sources, then runs Cargo 1.97+ from that writable checkout. Keeping the
full Cargo workspace preserves its checked-in lockfile. Cargo handles dependency
order for selected Intl packages.

After a crate's initial publication, its owner must authorize
`formatjs/formatjs` and workflow `crates-release.yml` in its
[crates.io trusted publishing settings](https://crates.io/docs/trusted-publishing).
