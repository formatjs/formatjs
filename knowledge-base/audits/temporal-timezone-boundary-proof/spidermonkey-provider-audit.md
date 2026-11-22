# Debian SpiderMonkey timezone provider

Debian trixie x86-64 SpiderMonkey `128.14.0-1~deb13u1` bundles ICU 73
with timezone data `2025a`. The replay pins the shell, shared library
and matching detached debug file. The shell has no native Temporal.
[Replay and binary pins](spidermonkey-provider-replay.py).

## Bind the hidden ICU reader

The shared library strips the local ICU symbols. Its matching Debian
debug file has ELF Build ID `3efb9353c166a4f342d57cb5a94d9d892b9cbea4`.
The replay relocates those symbols from the loaded address of the
exported `JS_NewContext`, verified against the same ELF symbol table.
It calls the exact bundled Olson provider and checks the opened zone
name and C++ provider type for every ID.

Disassembly of that ELF follows the two relevant entry points. The
Mozilla formatter calls `udat_open_73` at `0x50570c`, and its parts
function calls `udat_formatForFields_73` at `0x49597b` and `0x495ac8`.
Both the formatter's open path (`0xdcc054`) and the scanner's
`ucal_open_73` (`0xdc963f`) call the same
`icu_73::TimeZone::createTimeZone` at `0xdb4710`. The system-zone loader
calls `openOlsonResource` at `0xdb20ba`. This binds the observations and
the exact rule scan to the same bundled timezone resource.

Where the build inlines ICU's C wrappers, the adapter calls their C++
operations or reads the trivial accessor's field verified in the ELF.
For example, the finite rule fields at offsets `0x50`, `0x54` and
`0x58` come from the disassembly of `TimeArrayTimeZoneRule::getFirstStart`.
The year checks around the compiler's split annual-start function use
the field offsets returned by the two annual-year getters.
[Bundled ICU adapter](spidermonkey-icu-runtime.mjs).
[ICU 73.2 Olson offsets](https://github.com/unicode-org/icu/blob/release-73-2/icu4c/source/i18n/olsontz.cpp).
[ICU 73.2 recurring comparator](https://github.com/unicode-org/icu/blob/release-73-2/icu4c/source/i18n/simpletz.cpp).

## Results

The rule scan covers 637 exact Olson IDs, including all 468 advertised by
the shell. It finds zero transitions in 1,274 closed two-day-radius
Instant-limit intervals, including both sides of TimeClip. The finite
and recurring scan with complete adjacent-year Gregorian signatures
finds zero effective pairs within two days. The conservative 43,297-event
scan has a minimum separation lower bound of 597,600,000 ms, from
`America/Cambridge_Bay`. Offset magnitudes remain below a day and the
largest forward change is one day. The separate six-day scan bounds
offset spread by 86,400,000 ms.
[Enumeration method](node-icu/temporal-node26-direct-spacing-proof.md).

The same one-change argument applies here. The one-day-radius probes
cover every candidate offset, and a forward gap's nearest reachable
locals use the offsets immediately before and after the sole transition.
The constant endpoint windows exclude mixed valid/invalid folds.
Single-invalid cases still use the public range rejection paths.
[ECMA-262 §21.4.1.20](https://tc39.es/ecma262/#sec-getnamedtimezoneepochnanoseconds).
[Proposal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).
[Proposal comparison §11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds).

Public Intl accepts 597 of the ICU IDs and matches all 80,260
boundary-side offsets and 4,776 offsets near the Instant limits. All 40
unsupported IDs fall outside the advertised set. The Bazel-built default
Temporal package passes 4,768 endpoint offsets, 78,744 fold checks and
80,024 gap checks across 596 names. Gap and fold probes exercise all four
disambiguation modes at every tested midpoint. The package excludes
`Factory`, an ICU name outside the shell's advertised list.
[Shared package probe](jsc-temporal-package-probe.mjs).

This evidence applies to the pinned Debian shell and bundled ICU. Other
SpiderMonkey builds, Firefox configurations and ICU overrides retain
their provider applicability conditions.

## Reproduce

Use Linux x86-64, Node 26 with `--experimental-ffi`, GNU `nm` and
`libffi.so.8`. Download the pinned packages to scratch and extract them
without installing system packages.

```sh
proof=knowledge-base/audits/temporal-timezone-boundary-proof
work=$(mktemp -d)
mkdir -p "$work/debs" "$work/root" "$work/debug"
archive=https://deb.debian.org/debian/pool/main/m/mozjs128
debug=https://deb.debian.org/debian-debug/pool/main/m/mozjs128
curl -fsSL --remote-name-all --output-dir "$work/debs" \
  "$archive/libmozjs-128-0_128.14.0-1~deb13u1_amd64.deb" \
  "$archive/libmozjs-128-dev_128.14.0-1~deb13u1_amd64.deb" \
  "$debug/libmozjs-128-0-dbgsym_128.14.0-1~deb13u1_amd64.deb"
(
  cd "$work/debs"
  sha256sum --check <<'SUMS'
2d34088e491ae9a2a7c6643490ecf262808d492a52022492607f988958869c0f  libmozjs-128-0_128.14.0-1~deb13u1_amd64.deb
c34544ffe72ebb8ca8fb7d26abf8c1eb1520564fd1e87ed6068b59e0a9461bd7  libmozjs-128-dev_128.14.0-1~deb13u1_amd64.deb
71a36e4b65b47875bfa10774ee07aa364eab38a3b62bc1e1f3715e588c74b443  libmozjs-128-0-dbgsym_128.14.0-1~deb13u1_amd64.deb
SUMS
) &&
dpkg-deb -x "$work/debs/libmozjs-128-0_128.14.0-1~deb13u1_amd64.deb" "$work/root" &&
dpkg-deb -x "$work/debs/libmozjs-128-dev_128.14.0-1~deb13u1_amd64.deb" "$work/root" &&
dpkg-deb -x "$work/debs/libmozjs-128-0-dbgsym_128.14.0-1~deb13u1_amd64.deb" "$work/debug"
bazel build //packages/temporal:pkg
pkg=$(bazel cquery 'config(//packages/temporal:pkg, target)' --output=files)
python3 "$proof/spidermonkey-provider-replay.py" "$work/root" "$work/debug" "$work/results" \
  --node "$(command -v node)" --temporal "$pkg/index.js"
```

The captured run used Node 26.5.1, Temporal `index.js` SHA-256
`d7ad17190cc2e741a50e36238b1e0f22f31f4e5961bbcc4631d4d5e1d7cfdb5c`
and `native.js` SHA-256
`8b9c50d2b21c0b54d651ff44cb8205efda087a4bd9b3dbe6509d4aa78474b710`.

Result SHA-256 hashes

```text
17c32f6b2fb9bc544f2b32879e5aacf70820bbda02b630287e1ed4723780329f  endpoints.json
063db0e080704fd40242dd55bd7a7a99d3900561e09b093f31c86aad8e7c2a47  spacing.json
76b9608c8191fb5804525ffb720a02aaa674c7ef35da656b4670fe8387595fa3  spread.json
035027b591c51629bc20b9922d0644da6330601f6f3571ceb5f822569bfefc28  boundaries.json
d3f81bcf15c8b3bc29a276c265de95124c23b0605401c90c86c1107b7f5c8e1f  public.json
03bef57d792758ae0028c3b1d958af755a5307c023a6a11b33823dedde3d6789  package.json
```
