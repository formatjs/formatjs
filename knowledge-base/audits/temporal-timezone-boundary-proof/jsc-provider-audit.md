# Debian JavaScriptCoreGTK timezone provider

Debian trixie x86-64 JavaScriptCoreGTK `2.54.3-1~deb13u1` uses the
`libicu76` `76.1-4` libraries with tzdata `2024b` for its native Intl
formatter. The replay pins the `jsc` executable, JavaScriptCore shared
library and all three loaded ICU libraries by SHA-256. It clears environment
overrides and verifies the live ELF bindings from `Intl.DateTimeFormat` to
`udat_open_76` and `udat_formatForFields_76`, and from ICU's loader to
`icudt76_dat`. The rule scan opens the same ICU library by absolute path.
[Replay and binary pins](jsc-provider-replay.py).

## Exact candidate and gap bounds

The shared scanners open the exact Olson provider for all 637 ICU IDs,
including the 444 listed by `Intl.supportedValuesOf('timeZone')`. The
finite starts, final-zone handoffs and recurring rules supply the
candidate boundary set. The recurring scan covers the adjacent-year
signatures of a full Gregorian cycle. Its conservative 43,334-event
scan yields a minimum separation lower bound of 597,600,000 ms
(`America/Cambridge_Bay`), over twice the one-day probe radius. The
additional candidate positions supplied by the rule-comparison geometry
contain no changes. All checked changes have whole-second boundaries,
offset magnitudes below a day and forward jumps of at most a day.
[Enumeration method](node-icu/temporal-node26-direct-spacing-proof.md).
[ICU 76.1 Olson lookup](https://github.com/unicode-org/icu/blob/release-76-1/icu4c/source/i18n/olsontz.cpp#L391).
[ICU 76.1 rule comparator](https://github.com/unicode-org/icu/blob/release-76-1/icu4c/source/i18n/simpletz.cpp#L579).

Every closed two-day-radius interval at an Instant limit contains zero
transitions, including the parts outside TimeClip. The two in-range probe
offsets therefore cover every applicable offset in a candidate window,
and near either limit the surrounding offset stays constant. This
excludes mixed valid/invalid folds. Single-invalid cases propagate
RangeError through the public resolution paths. The one-transition gap
geometry supplies the exact nearest reachable local times on both sides.
The separate six-day scan bounds offset spread by 86,400,000 ms.
[ECMA-262 §21.4.1.20](https://tc39.es/ecma262/#sec-getnamedtimezoneepochnanoseconds).
[Proposal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).
[Proposal comparison §11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).

## Public controls

The `jsc` shell accepts 598 ICU names in both Intl and native Temporal.
The other 39 are legacy ICU names outside the advertised Intl list.
Native Intl matches 80,808 offset checks immediately before or at finite
and representative candidate boundaries, plus 4,784 offsets near the
Instant limits. Native Temporal matches 39,967 strict next transitions
through the per-zone cutoffs, plus 598 queries checking for extras inside
those cutoffs. All 126,157 checks pass.

The Bazel-built default Temporal package passes 4,768 endpoint offset
checks, 78,820 fold checks and 80,100 gap checks. The latter two totals
exercise all four disambiguation modes for each representative gap or
fold. The package recognizes 596 of the 598 native names in the probe.
`Canada/East-Saskatchewan` and `US/Pacific-New` are absent from the package's
identifier table and excluded from the package controls. Both are
outside the 444-name advertised list.
[Public package probe](jsc-temporal-package-probe.mjs).

This binds the exact Debian shell and loaded ICU data. Other JavaScriptCore
builds, system libraries, data overrides and browser configurations retain
their provider applicability conditions.

## Reproduce

The two JavaScriptCore packages match the signed Debian security index on
2026-11-22. The ICU package matches the Debian archive checksum.

```sh
proof=knowledge-base/audits/temporal-timezone-boundary-proof
work=$(mktemp -d)
mkdir -p "$work/debs" "$work/root"
security=https://security.debian.org/debian-security/pool/updates/main/w/webkit2gtk
archive=https://deb.debian.org/debian/pool/main/i/icu
curl -fsSL --remote-name-all --output-dir "$work/debs" \
  "$security/libjavascriptcoregtk-bin_2.54.3-1~deb13u1_amd64.deb" \
  "$security/libjavascriptcoregtk-4.1-0_2.54.3-1~deb13u1_amd64.deb" \
  "$archive/libicu76_76.1-4_amd64.deb"
(
  cd "$work/debs"
  sha256sum --check <<'EOF'
130f6fd4e4a594dda3e0858c7da19798a833061ee8592f2ce9d70250416e0db4  libjavascriptcoregtk-bin_2.54.3-1~deb13u1_amd64.deb
1c5e5cb605c23742df9f52f981187b727b6689fe64f89878f5626b9f4d85faf9  libjavascriptcoregtk-4.1-0_2.54.3-1~deb13u1_amd64.deb
c1bf762996de9ecba9b9d871e4928a8090f023a3e9e7fa3240b3d90f892a01dc  libicu76_76.1-4_amd64.deb
EOF
) && for deb in "$work/debs/"*.deb; do dpkg-deb -x "$deb" "$work/root"; done
bazel build //packages/temporal:pkg
pkg=$(bazel cquery 'config(//packages/temporal:pkg, target)' --output=files)
python3 "$proof/jsc-provider-replay.py" "$work/root" "$work/results" \
  --node "$(command -v node)" --temporal "$pkg/index.js"
```

The reference extraction used Node 26.5.1 with `--experimental-ffi` to call
the pinned Debian ICU library. `{endpoints,spacing,spread,boundaries,public,package}.json`
record the results. The package comparison used `index.js` SHA-256
`a6ef5528387943dc8e0da29949dc6ce57c31a4a32614e01be0ec9024ab6657c6`
and `native.js` SHA-256
`8b9c50d2b21c0b54d651ff44cb8205efda087a4bd9b3dbe6509d4aa78474b710`.

Result SHA-256 hashes

```text
e08241851ee95259ea070f3dd7e10e27fadeb9ef2da291257a0cf43217a1a064  endpoints.json
2d0c8a807a3a77b0115f99f48c9249064091010610e097cfcf20fb410d240dba  spacing.json
24dd31eb7266f1ecef7b4bd70492f951546bee662c663a86b9a1cde664bd7eae  spread.json
ceede35aca7c1d428d0225dc4d6d1e2a18f4cd828624ea53cadd3a164af4d7b5  boundaries.json
27717ad64f65971f12db8b382414c3513f4d1ab4aaa04dcb6bac731da0f178c4  public.json
d8a5769adf60b8647fcd658025de31c984224c683763ed093b20d344a6205c3d  package.json
```
