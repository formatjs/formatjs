# Published calendar controls

`hko-month-starts.tsv` records 2,474 published Chinese month starts from HKO's
200 annual English conversion tables, Gregorian years 1901–2100. Facts include
epoch day, related year and month code. Repeated month labels identify leap
months. `hko-source-shas.tsv` pins each original file's SHA-256. Older English
files contain Big5 punctuation; date rows and month labels remain ASCII.

Regenerate through Bazel; `--fetch` checks downloaded bytes against pinned hashes:

```sh
bazel run -c opt //conformance-tests/calendar-authorities/scripts:hko -- \
  --sourceDir /tmp/hko-sources \
  --manifest "$PWD/conformance-tests/calendar-authorities/hko-source-shas.tsv" \
  --out "$PWD/conformance-tests/calendar-authorities/hko-month-starts.tsv" \
  --fetch
```

`--updateHashes` records a deliberate source refresh from existing downloaded
files. It cannot combine with `--fetch`. Review fact changes when updating hashes.
Normal builds/tests use checked-in facts and make no HKO network requests.

The Temporal table oracle uses these fields for complete Chinese years 1901–2099.
ICU4J supplies the edge years, Dangi and Umm al-Qura. Dangi's February 2017
boundary uses KASI: new moon occurred February 26 at 23:58 KST; ICU79 puts the
month start a day late. Runtime ICU4X data already matches KASI. June 24 starts
leap month 5, separately checked as a regression control.

These authority records correct oracle limitations; runtime expectations are not
inferred from the implementation. The unfiltered raw ICU comparison remains a
manual failing diagnostic, without accepted-failure baselines. Test262 exclusions
remain unchanged.

Sources:

- [HKO annual conversion tables](https://www.hko.gov.hk/en/gts/time/conversion.htm).
- [HKO 1917 example](https://www.hko.gov.hk/en/gts/time/calendar/pdf/files/1917e.pdf).
- [KASI 2017 almanac](https://astro.kasi.re.kr/life/pageView/1).
