# Pinned Node and Hermes timezone providers

The Linux x64 Bazel toolchains pin Node 24.14.0 for the default build
and Node 26.8.1 for Test262. The proof binds each executable and its resource.
The Node 26.5.1 development binary retains its separate certificate.

| Toolchain    | ICU  | tzdata |
| ------------ | ---- | ------ |
| Node 24.14.0 | 78.2 | 2025c  |
| Node 26.8.1  | 78.3 | 2026c  |

[Toolchain pins](../../../../MODULE.bazel#L42) and
[Test262 target selection](../../../../tools/test262/BUILD.bazel#L48).

## Binding and bounds

The disassembly follows V8 DateTimeFormat construction through
`CreateTimeZone`, calendar construction and the formatter's calendar
adoption. Numeric formatToParts uses the adopted calendar in
`DateFormat::format`. The probe's `ucal_open` uses the same named-zone and
calendar factories. Both get the Olson zone through the linked-in
`zoneinfo64` resource. The transition API reads the same type of calendar
timezone. The scan checks the opened name and Olson and BasicTimeZone casts
for each identifier. It rejects loader and ICU resource overrides.
[Call-site extraction](temporal-pinned-node-icu-binding.sh) and
[Node 24 instructions](temporal-node-24.14.0-icu-binding.txt) and
[Node 26 instructions](temporal-node-26.8.1-icu-binding.txt).

The existing proof methods apply to both providers with independent scans.

- §11.1.13 step 4.a. All 638 system identifiers have zero transitions in
  1,276 closed two-day-radius endpoint intervals. This excludes a fold with
  both valid and invalid candidates at an Instant limit.
- §7.5.34 steps 13 and 17. Any six-day interval has an offset spread of at
  most 24 hours. The actual rule sets supply 622 direct global bounds.
  The remaining 16 zones use exhaustive historical change enumeration and
  bounded recurring tails. This supplies the same signed order premise
  under the calendar and local-resolution contracts.
- The eleven-day-radius endpoints have no change at the lower limit and
  no offset decrease at the upper limit. There are four +1-hour entries
  at the upper end, including two aliases. The retained-prefix week range
  proof uses these one-sided bounds.

[Node 24 scans](pinned-node-24.14.0-summary.json).
[Node 26 scans](pinned-node-26.8.1-summary.json).
[Candidate proof](temporal-node-icu-endpoint-proof.md).
[Six-day method](temporal-node-icu-six-day-spread-proof.md).
[Retained week proof](../../temporal-retained-week-endpoint-validity.md).

Both pinned Bazel reference targets pass. An additional run compared
17,640 offsets on each binary with its raw Intl formatter and reproduced
all adapter differences from the ICU 2026e fixture. The complete mismatch
lists also match the independent `temporal-polyfill` reference across
offsets, fractional cases, and gaps and folds. Node 24 loads 2025c and
reports 290 differences. Node 26 loads 2026c and reports 40.
The manual strict target retains exact fixture equality.
[Replay source](../host-runtime-oracle-replay.mjs).
[Replay evidence](../host-runtime-oracle-replay-summary.json).

Run the replay on the `_main` directory in a built
`host_timezone_reference_node24_test` runfiles tree.

```sh
"$node_bin" --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --preserve-symlinks \
  ../host-runtime-oracle-replay.mjs "$runfiles"
```

## Compiled Hermes formatter

The Hermes calendar oracle sets HostTimeZones and runs with
`--native-datetimeformat`. The runner installs FormatJS's formatter,
whose Rust runtime decodes its embedded `tz-all.json`. Its ISO rendering
applies that registry's explicit transitions and recurring rules.
[Oracle target](../../../../packages/temporal/BUILD.bazel#L751).
[Runner installation](../../../../native/hermes/runner.cpp#L107).
[Rust registry](../../../../crates/intl_datetimeformat/timezone.rs#L227).

The fresh Bazel test passed. Its runfiles manifest selects the exact ELF
used in the [embedding check](../temporal-hermes-compiled-zone-binding.txt).
The JSON occurs once in that ELF and decodes to the same object as the
certified TypeScript packed data. The generated endpoint, signed-window and
six-day spread certificates apply through this compiled formatter. Replacing
that registry or supplying a different host formatter changes the proof inputs.
[Hermes summary](../pinned-hermes-compiled-zone-summary.json).

## Reproduce

Use the pinned Linux x64 executables selected by Bazel. If starting from
the generated launcher, `node -p process.execPath` prints the ELF path.
Set `node26_bin` to that path and `node24_prefix` to the Node 24
distribution containing `bin/node` and `include/node`. Run from this
directory in a clean environment.

```sh
"$node26_bin" --experimental-ffi temporal-node-icu-endpoint-scan.mjs > node26-endpoint-2d.json
"$node26_bin" --experimental-ffi temporal-node-icu-endpoint-scan.mjs 11 > node26-endpoint-11d.json
"$node26_bin" --experimental-ffi temporal-node-icu-rule-spread.mjs > node26-spread-6d.json
bash temporal-pinned-node-icu-binding.sh "$node26_bin" | sed 's/[[:space:]]*$//' > node26-binding.txt

scratch="$(mktemp -d)"
cc -Wall -Wextra -Werror -O2 -fPIC -shared -I"$node24_prefix/include/node" \
  temporal-node24-icu-addon.c -ldl -o "$scratch/icu-audit.node"
export FORMATJS_TEMPORAL_ICU_AUDIT_ADDON="$scratch/icu-audit.node"
"$node24_prefix/bin/node" temporal-node-icu-endpoint-scan.mjs > node24-endpoint-2d.json
"$node24_prefix/bin/node" temporal-node-icu-endpoint-scan.mjs 11 > node24-endpoint-11d.json
"$node24_prefix/bin/node" temporal-node-icu-rule-spread.mjs > node24-spread-6d.json
bash temporal-pinned-node-icu-binding.sh "$node24_prefix/bin/node" | sed 's/[[:space:]]*$//' > node24-binding.txt
```

The optional scratch addon supplies the read-only ICU calls on Node 24.
It checks symbol names and signatures against a fixed list and resolves ICU
symbols from the pinned executable. Both scanners check the executable
hash before loading runtime-specific bindings.

For Hermes, build with Bazel and take the oracle's runfiles manifest from
its output. Resolve `//packages/intl-datetimeformat:tz_all_json` and
`//packages/intl-datetimeformat:tz_all_tz` with
`bazel cquery --output=files`. The exact data hashes are checked by the
reproduction script. Run from this directory.

```sh
python3 ../temporal-hermes-compiled-zone-binding.py "$manifest" "$tz_json" "$packed_ts"
```
