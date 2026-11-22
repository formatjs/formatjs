# Temporal audit goal and execution plan

Updated 2026-11-22. Existing working polyfill is the baseline. Goal remains full
Temporal spec compliance, including observable ordering, precision, grammar,
attributes, supported backends and Temporal-specific Intl integration. This is an
audit and correction of existing code, not a fresh implementation.

Required inline evidence: add concise numbered spec section/step comments beside
audited implementation paths, including corrected code. Use official rendered
section links where useful; retain the requested-authority/comparison distinction.
Keep comments, source ranges and the audit ledger synchronized after edits.
Existing GitHub source-line comments are historical evidence, not a substitute
for current numbered section/step anchors.

## Source and finite scope

Requested authority: [ECMA-262](https://tc39.es/ecma262/), cited by section and
step. Rechecked 2026-11-22: published document has no Temporal API chapters.
Temporal API numbers in the registers therefore explicitly identify the
separately published [Temporal comparison](https://tc39.es/proposal-temporal/),
not an adopted replacement authority. Keep this distinction until resolved.

Comparison snapshot retrieved 2026-11-21; SHA-256
`fc35bf6d3ae565bd8984f44b1f5740ec8024743215f82af818f0f48ad57ef22e`.
Freeze that text for this pass. A newer edition requires an explicit diff and
scope update, not an automatic restart.

| Register                                                            | Measured scope                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Public code map](temporal-public-code-spec-map.tsv)                | 268 API/property/range entries, all linked to existing source ranges                                                     |
| [Helper/backend code map](temporal-helper-code-spec-map.tsv)        | 1,069 existing callables: 175 explicit target assignments, 495 candidate/dependency assignments, 399 unresolved mappings |
| [Core checklist](temporal-core-requirement-checklist.tsv)           | 553 clauses, 429 algorithms, 3,325 numbered steps; 4,808 rows including other text and clause gates                      |
| [Amendment checklist](temporal-amendment-requirement-checklist.tsv) | 101 clauses, 55 algorithms, 760 active numbered steps; 1,057 rows, applicability classified                              |

Code maps cover 82 distinct selected source files and 24,145 physical lines.
Public entries and helper callables are different units; do not add their counts
as functions. File/line counts include declarations and supporting material;
they are scope measures, not remaining work or compliance percentages.

The checklists contain 4,085 active numbered steps in 484 algorithms, plus
explicit prose, grammar, table, equation, attribute, note and clause-scope rows.
A prose/table block can contain multiple obligations. Informative rows do not
become normative requirements. Nested step IDs remain stable within this
snapshot. Deleted text is excluded; published numbering gaps are preserved.

## Runtime and Intl first

Use existing JavaScript runtime operations and Intl where their contracts match:
coercion, object semantics, exact BigInt arithmetic, calendar projection and time
zone data. Map the delegated contract and its Temporal caller. Do not reimplement
ECMA-262/402 operations or replace working providers without a demonstrated gap.

Add only Temporal-specific behavior or necessary compatibility/precision fixes.
Keep existing fallback paths where supported environments need them. Use captured
runtime operations where required to preserve specified observable behavior.
Number conversions need exactness evidence and precision regressions; use existing
numeric support when needed rather than inventing another arithmetic layer.

## Tracking and completion rule

Each spec row records section/step, current source ranges, inline comment anchors, existing evidence and
review status. Maintain implementation, review and fix states separately:

- **Implementation:** present, confirmed missing, or mapping unresolved.
- **Review:** unreconciled, existing evidence pending, reviewed, conditional,
  verified_local_step, verified, informative, or spec issue. Local verified steps
  close only their stated requirement, not transitive callers.
- **Fix:** confirmed gap, correction commit, validation result and push state.
  Only demonstrated absent/incorrect behavior enters the fix backlog.

Unmapped/unreconciled never means missing or broken. Preserve existing tests,
source proofs, inherited traces and in-progress PR work. Reconcile them into the
same rows before repeating analysis. The first migration carries forward 1,747
core rows with existing evidence references; 45 exact algorithm rows have already
been reconciled from two current audits: 29 local reviewed, 16 conditional. These
are migration counts, not a claim that other code was never reviewed.

Review numbered sections in order; parallel reviewers own disjoint ranges.
Map each obligation to code, reuse established runtime/helper contracts, then
record verified behavior, a reproducible implementation gap, or a separate spec
issue. A conditional row must name its actual unresolved premise and next action.
Reopen completed rows only when changed code or a counterexample invalidates
existing evidence. Do not launch unrelated dependency or mutable-intrinsic sweeps.

For confirmed gaps: reproduce, fix, run focused Bazel validation and affected
backend checks, update those rows, commit and push directly. No new PRs. Respect
repository protection rules; record any rejected push. Batch related fixes. Keep spec inconsistencies separate; do not
silently implement contradictory text or report an unresolved issue as compliant.

Completion requires every applicable normative obligation reconciled and verified
against landed code, with numbered section/step comments beside audited code,
backend coverage and remaining standards issues stated
explicitly. Mapping or passing tests alone does not establish completion.

## Progress and estimate

Report fixed scope, rows with reconciled evidence, remaining review rows,
conditional obligations, confirmed implementation gaps and unlanded corrections
separately. Candidate source assignments require confirmation; 399 unresolved
helper mappings are a mapping queue, not 399 missing functions.

First pass reconciles all5,865 fixed rows:4,808 core and1,057 amendments.
Amendment applicability:433 owned Temporal bridges,467 shared dependencies,
86 runtime-delegated rows and71 editorial/nonbehavioral rows. Normal engine
and existing Intl contracts are reused, not reimplemented.

Remaining core states:403 conditional,90 comparison-issue rows and one partial
gate. Amendments:130 conditional and11 comparison-issue rows. Counts include
propagated clauses/prose; they are not independent bugs or compliance percentages.
The [remaining numbered-step queue](temporal-remaining-condition-steps.tsv) has
259 conditional steps (175 core,84 amendment), each with exact source ranges
and named premise. [Source candidates](temporal-open-candidates.md) remain
separate from confirmed runtime gaps. Existing contract reuse is a supplied
callee contract, not a fresh full Intl audit.

Measured first pass:03:06–04:04 UTC, about58minutes for5,865 rows with parallel
review, prior-proof reuse, corrections and backend checks (about101rows/minute).
First review pass is complete. Current estimate:2–4hours for queued candidate
reproductions, fixes, inline comment migration and affected validation. Full
signoff additionally requires actual remaining contracts and documented
comparison inconsistencies reconciled; first-pass completion alone is not that
signoff. Recalculate after each bounded correction batch. Earlier review-only
forecasts are retired; do not infer compliance from citation/PR/source-line counts.

Source hashes and extraction limits:
[public map manifest](temporal-public-code-spec-map-manifest.json),
[helper scope](temporal-helper-code-spec-map-summary.json),
[core extraction/reconciliation](temporal-core-requirement-checklist-summary.json),
[amendments](temporal-amendment-requirement-checklist-summary.json),
[amendment source versions](temporal-amendment-review-source-manifest.json).

## Register provenance

Public binding ranges come from `ast-grep scan` method definitions, constructor
proxy calls, descriptor definitions and getter registrations. Shared getter
factories and native Instant descriptor forwarding are included. Helper/backend
ranges come from TS callable nodes and qualified Rust function nodes. Nested
ranges can overlap; totals use file unions or nonoverlapping callable lines.
Target assignments identify ownership, not equivalence of every numbered step.
Candidate/dependency assignments stay distinct from direct targets.

The [extractor](temporal-extract-checklist.py) reads saved official rendered HTML,
not GitHub. Given the matching snapshot, regenerate into a temporary directory:

```bash
python3 knowledge-base/audits/temporal-extract-checklist.py \
  --html /path/to/temporal-published.html --scope all \
  --output /tmp/temporal-extracted-checklist.tsv
```

Extraction asserts clause ownership and independently checks active algorithm
list-item counts. Parent text excludes nested steps, which have their own rows.
Whitespace normalization cannot preserve mathematical typography or grammar
layout; retain the rendered source when reviewing those blocks. Unclassified
text stays explicit. Do not overwrite reconciled registers with fresh extraction:
join on stable row IDs and preserve source mappings, evidence and decisions.

Register validation: all row IDs unique, all source ranges within
current files, source hashes checked, independent numbered-step counts agree,
and core IDs/text unchanged when amendment extraction was added. Current runtime correction: no-Intl Now host offsets reuse existing
zeroPadDecimal. Public regression failed before correction; all 16 focused
Bazel targets pass (10 executed, six cached), covering TS/native Hermes source
and bytecode, Test262, installation and typechecking.
[Validation targets](temporal-numbered-first-pass-validation-targets.txt).

PlainDate correction reuses existing time conversion and zeroPadDecimal, removes
an extra getter, and gives private short-date fields null prototypes. Four public
regressions failed before correction. All 10 focused targets pass (four executed,
six cached). Shared oracle controls exercise exact
nanoseconds, private conversion, ordinary bag getters and ISO year strings.
[Validation targets](temporal-plain-date-conversion-validation-targets.txt).

MonthDay correction validates the original non-ISO string date before choosing
a reference year, including literal TS/Rust endpoint controls. Private merged
and parsed fields have null prototypes; leap-code handling uses indexed
characters. All 13 focused targets pass (10 executed, three cached), including
MonthDay and shared YearMonth TS/native Hermes source and bytecode.
[Validation targets](temporal-month-day-validation-targets.txt).

Plain relative total/round now validate unequal synthetic destinations with
existing PlainDateTime guards, including the exact lower excluded midnight.
One-nanosecond-inside and equal-zero controls remain valid. PlainDateTime reuses
internal time conversion and a captured runtime slice method for private ISO
formatting. All16 focused targets pass (10 executed, six cached), including
full Duration/PlainDateTime Test262 and both Hermes backends/source forms.
[Validation targets](temporal-plain-relative-validation-targets.txt).

Duration comparison correction follows §7.2.3 branches: full equality retains its
shortcut; zoned date components perform both required additions; plain comparison
bounds only years/months/weeks prefix, then combines fixed days/time exactly.
Boundary controls reproduce both missed RangeErrors and wrongly rejected valid
fixed-day cases. All9 focused targets pass (six executed, three cached).
[Validation targets](temporal-duration-compare-validation-targets.txt).
Numbered comments added beside recent TS/Rust corrections; broader public/helper
comment migration continues and remains part of completion.
