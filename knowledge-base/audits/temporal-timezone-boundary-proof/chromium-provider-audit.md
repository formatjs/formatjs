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
the bounds under the bound Node ICU reader. Exhaustive Chromium provider
coverage still needs a binding from Chromium's formatter to its compiled
offset and recurrence implementation. Other browsers and system ICU builds
have separate data and implementation premises.

These checks address [proposal comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds),
[§11.1.13 steps 3.a and 4.a](https://tc39.es/proposal-temporal/#sec-temporal-getpossibleepochnanoseconds),
and the timezone premises of [§7.5.34 steps 13 and 17](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

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
