# Chromium timezone provider replay

Chromium 156.0.8078.48 on Linux x64 ships ICU timezone data 2026e.
The Bazel-built default Temporal package matched native Chromium on 3,630
checks. Across all 418 advertised identifiers, it matched offsets at eight
instants including both Instant limits and matched both transition directions
at a one-nanosecond distance for the 132 zones with a next transition in the
probe. Six history checks and 16 gap and fold checks also matched.
[Browser probe](chromium-provider-probe.mjs).

The four timezone resources extracted from that executable's `icudtl.dat`
were replayed through pinned Node 26.5.1 with ICU 78.3. Each scan covers 638
ICU identifiers including aliases.

- Two-day endpoint windows contain no offset changes. Eleven-day windows
  contain four upper increases including aliases, with no lower changes or
  upper decreases.
- The maximum offset spread in any six-day interval is 24 hours.
- The seven-day scan finds ten shorter transition pairs. All ten are the same
  pairs covered by the existing 300,600-second zone-specific probes. Every
  tested recurring year has an offset change in the zones with annual rules.

The package and resource hashes and the scan results are in the
[Chromium summary](chromium-provider-summary.json). The browser comparison
covers public results at the sampled instants. The resource scans establish
the bounds under the pinned Node ICU reader. The controlled runs below bind
Chromium's formatter to the historical and recurring resources. Exhaustive
reader equivalence, other browsers and system ICU builds remain separate
premises.

These checks address [proposal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds),
[§11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds),
and the timezone premises of [§7.5.34 steps 13 and 17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

## Controlled resource binding

Two A/B runs use the exact same pinned executable with timezone
resource overrides unset. Each run changes only the ICU data in a scratch
copy of the installation. The historical copy adds 600 seconds to the
three New York type offsets at zero-based byte positions 10738964,
10738972 and 10738980. The recurring-rule copy changes the US rule's save
field at position 10698716 from 3600 to 4200. Values are little-endian
signed 32-bit integers. Byte comparison confirms all other data is identical.

| Copy       | UTC instant          | Before       | After        |
| ---------- | -------------------- | ------------ | ------------ |
| Historical | 1880-01-01T00:00Z    | GMT−04:56:02 | GMT−04:46:02 |
| Historical | 1950-01-01T00:00Z    | GMT−05:00    | GMT−04:50    |
| Historical | 1950-07-01T00:00Z    | GMT−04:00    | GMT−03:50    |
| Recurring  | 2026-07-01T00:00Z    | GMT−04:00    | GMT−03:50    |
| Recurring  | +275760-09-13T00:00Z | GMT−04:00    | GMT−03:50    |

The native formatter uses hour, minute, second and longOffset in
America/New_York. The local clock moves ten minutes in each changed case.
America/Toronto and UTC stay unchanged. The New York 2026 winter sample
stays unchanged in both runs, and its historical samples stay unchanged
in the recurring-rule run. The final row reaches the inclusive maximum Instant.

This establishes resource use by the pinned formatter for explicit history
and recurring rules. Applying the Node scan's exhaustive bounds to Chromium
still requires equivalence of the rule readers across all intervals.
[Hashes, edited words and controls](chromium-provider-summary.json).

## Direct reader replay

PPLX Chromium 156.0.8078.48 and Debian Chromium 156.0.8078.47 share the same
2026e ICU data bytes. Each exact executable passed 131,471 native checks
with zero mismatches against the pinned Node ICU scan.

- Native Intl checked offsets one millisecond before and at each of 43,198
  per-identifier candidate boundaries. It also checked eight positions near
  the two TimeClip endpoints for each of 638 supported identifiers.
- Native Temporal walked strict-next transitions at exact nanosecond
  positions for the 597 accepted identifiers. The walks found 39,374
  effective transitions. Each confirmed no additional native transition
  through its inclusive cutoff. Native Temporal rejects 41 legacy names
  accepted by Intl.
- The candidate fixtures include every finite start and cover all 21 adjacent
  Gregorian recurrence signatures observed across 400 years. For 206
  recurring identifiers, each per-zone representative cutoff is January 10
  two years after its selected through-year, which lies between 2004 and 2128.
  For the other 432 identifiers, the cutoff is three days after the last
  finite start or the Unix epoch, whichever is later.

With the historical and recurring word changes combined, native Intl and
native Temporal in both builds report New York's 1880 offset changing from
−04:56:02 to −04:46:02 and its July 2026 offset from −04:00 to −03:50.
Native Temporal also moves the November 2026 rollback from 06:00Z to 05:50Z.
These cases tie both native readers to the pinned explicit and recurring
resources.

The direct walks establish transition coverage through the tested cutoffs
for the accepted names. Coverage between sampled offsets, outside TimeClip,
and on other builds remains conditional.
[Replay hashes and counts](chromium-provider-summary.json).

## Reproduce

Build `//packages/temporal:pkg` and take its output path from
`bazel cquery --output=files //packages/temporal:pkg`. In a fresh scratch
directory, copy the package as `pkg/` and copy `chromium-provider-probe.mjs`.
Create a local page alongside them.

```html
<!doctype html>
<meta charset="utf-8" />
<pre id="result">pending</pre>
<script type="module" src="./chromium-provider-probe.mjs"></script>
```

Open it with the bound Chromium binary using `--allow-file-access-from-files`
for the local module imports. The `result` element contains the comparison
counts and mismatches.

Extract the browser resources with
`python3 node-icu/extract-chromium-timezone-resources.py "$chrome_data" "$scratch/timezones"`.
Set `ICU_TIMEZONE_FILES_DIR` to that absolute output directory. From
`node-icu/`, run the same pinned Node 26.5.1 binary with
`--experimental-ffi` for each probe.

```sh
"$node_bin" --experimental-ffi temporal-node-icu-endpoint-scan.mjs
"$node_bin" --experimental-ffi temporal-node-icu-endpoint-scan.mjs 11
"$node_bin" --experimental-ffi temporal-node-icu-rule-spread.mjs
"$node_bin" --experimental-ffi temporal-node-icu-transition-separation.mjs --direct-annual --week
```

For the native reader replay, use the same pinned Node binary and extracted
resources. `ICU_TIMEZONE_FILES_DIR` must point to the extracted directory.
Start each browser in a fresh local profile with timezone overrides unset.

```sh
python3 "$proof/chromium-reader-replay.py" prepare "$run_dir"
(cd "$run_dir" && "$node_bin" --experimental-ffi collect.mjs --direct-annual --week >reference.json)
env -u ICU_TIMEZONE_FILES_DIR -u TZ "$pplx_bin" --headless --no-proxy-server \
  --user-data-dir="$run_dir/pplx-profile" --allow-file-access-from-files \
  --dump-dom "file://$run_dir/probe.html" >"$run_dir/pplx.html"
env -u ICU_TIMEZONE_FILES_DIR -u TZ "$debian_bin" --headless --no-proxy-server \
  --user-data-dir="$run_dir/debian-profile" --allow-file-access-from-files \
  --dump-dom "file://$run_dir/probe.html" >"$run_dir/debian.html"
python3 "$proof/chromium-reader-replay.py" verify "$run_dir" \
  --pplx "$pplx_bin" --debian "$debian_bin"
```
