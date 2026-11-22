# Temporal audit goal and execution plan

Updated 2026-11-22. Existing working polyfill is the baseline. Goal remains full
Temporal spec compliance, including observable ordering, precision, grammar,
attributes, supported backends and Temporal-specific Intl integration. This is an
audit and correction of existing code, not a fresh implementation.

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
| [Helper/backend code map](temporal-helper-code-spec-map.tsv)        | 1,068 existing callables: 174 explicit target assignments, 495 candidate/dependency assignments, 399 unresolved mappings |
| [Core checklist](temporal-core-requirement-checklist.tsv)           | 553 clauses, 429 algorithms, 3,325 numbered steps; 4,808 rows including other text and clause gates                      |
| [Amendment checklist](temporal-amendment-requirement-checklist.tsv) | 101 clauses, 55 algorithms, 760 active numbered steps; 1,057 rows, applicability pending                                 |

Code maps cover 82 distinct selected source files and 23,709 physical lines.
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

Each spec row records section/step, current source ranges, existing evidence and
review status. Maintain implementation, review and fix states separately:

- **Implementation:** present, confirmed missing, or mapping unresolved.
- **Review:** unreconciled, existing evidence pending, reviewed, conditional,
  verified, or spec issue. Local reviewed steps do not close complete callers.
- **Fix:** confirmed gap, correction PR, validation result and landing state.
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
backend checks, update those rows, publish with `gh stack`, and land when required
checks pass. Batch related fixes. Keep spec inconsistencies separate; do not
silently implement contradictory text or report an unresolved issue as compliant.

Completion requires every applicable normative obligation reconciled and verified
against landed code, with backend coverage and remaining standards issues stated
explicitly. Mapping or passing tests alone does not establish completion.

## Progress and estimate

Report fixed scope, rows with reconciled evidence, remaining review rows,
conditional obligations, confirmed implementation gaps and unlanded corrections
separately. Candidate source assignments require confirmation; 399 unresolved
helper mappings are a mapping queue, not 399 missing functions.

First finish importing existing evidence, then measure newly reviewed obligations
per elapsed interval. Estimate remaining review from that rate; estimate confirmed
fixes and integration separately. Do not use citation growth, PR counts, source-line
extrapolation or checklist migration speed as review throughput. Earlier 7–14-day
forecast was provisional and is not a measured completion estimate.

Source hashes and extraction limits:
[public map manifest](temporal-public-code-spec-map-manifest.json),
[helper scope](temporal-helper-code-spec-map-summary.json),
[core extraction/reconciliation](temporal-core-requirement-checklist-summary.json),
[amendments](temporal-amendment-requirement-checklist-summary.json).

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

Validation for this register change: all row IDs unique, all source ranges within
current files, source hashes checked, independent numbered-step counts agree,
and core IDs/text unchanged when amendment extraction was added. No runtime
behavior changed; this documentation update does not require another full
Temporal test run. Runtime validation remains attached to its correction PRs.
