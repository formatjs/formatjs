# Rust Intl crates

The `formatjs_intl_*` polyfill crates expose ECMA-402 operations and owned C ABIs.
`formatjs_intl_hermes` assembles their exports into one static archive. They remain
independent of the higher-level `formatjs_intl` message runtime.

Cargo packages include generated metadata and Chromium's default locale set.
Enable `compiled_data` on formatters to embed their locale records. Applications
can also register locale records explicitly. Published packages require neither
Node nor Bazel to compile.

## Publishing

Requires Python 3.11+, the repository's Bazel toolchain, and Cargo 1.97+.
From the repository root, prepare a fresh staging directory:

```sh
python3 scripts/prepare_intl_crates.py --out /tmp/formatjs-intl-release
cd /tmp/formatjs-intl-release
cargo publish --dry-run --workspace --all-features
cargo publish --workspace --all-features
```

Preparation builds data with Bazel and bundles it with each crate. Cargo build
scripts locate bundled metadata; DateTimeFormat extracts its compressed locale
records at build time when `compiled_data` is enabled. Cargo publishes packages
in dependency order. Configure crates.io authentication before the final command.
