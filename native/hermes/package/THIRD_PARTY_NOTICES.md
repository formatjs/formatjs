# Third-party components

The FormatJS adapter is MIT-licensed; see `LICENSE.md`. That license does not
replace the licenses of code and data linked into the prebuilt Rust archives.

- Rust standard library: MIT OR Apache-2.0.
  https://github.com/rust-lang/rust/tree/1.97.0/library
- ICU4X locale canonicalization, provider, collection, and supporting crates:
  Unicode-3.0. https://github.com/unicode-org/icu4x
- ICU4X compiled locale data and CLDR BCP 47 alias data: Unicode-3.0.
  https://www.unicode.org/license.txt

`licenses/` preserves the license texts supplied by the pinned Rust build
dependencies and standard library. Their Cargo manifests declare:

- Unicode-3.0: icu_collections 2.3.0, icu_locale 2.3.1, icu_locale_core 2.3.0,
  icu_locale_data 2.3.0, icu_locale_fallback 2.3.0,
  icu_locale_fallback_data 2.3.0, icu_provider 2.3.1, litemap 0.8.3,
  potential_utf 0.1.6, tinystr 0.8.4, writeable 0.6.4, yoke 0.8.3,
  zerofrom 0.1.8, zerotrie 0.2.5, zerovec 0.11.8.
- MIT OR Apache-2.0: allocator-api2 0.2.21, cobs 0.3.0, either 1.18.0,
  equivalent 1.0.2, hashbrown 0.17.1, indexmap 2.14.2, itoa 1.0.18,
  postcard 1.1.3, proc-macro2 1.0.107, quote 1.0.47, serde 1.0.229,
  serde_core 1.0.229, serde_json 1.0.154, stable_deref_trait 1.2.1,
  syn 2.0.119 and 3.0.9, thiserror 2.0.20, utf8_iter 1.0.4.
- MIT: synstructure 0.13.2, zmij 1.0.23.
- Unlicense OR MIT: memchr 2.8.3.
- Zlib: foldhash 0.2.0.
- (MIT OR Apache-2.0) AND Unicode-3.0: unicode-ident 1.0.24.

This list includes build-time procedural macro dependencies.
The consumer supplies Hermes and JSI separately, under their own licenses;
neither runtime is included in this SDK archive.
