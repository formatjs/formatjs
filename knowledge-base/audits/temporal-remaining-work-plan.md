# Temporal audit goal and execution plan

Updated 2026-11-22. Existing working polyfill is the baseline. Goal remains full
Temporal spec compliance, including observable ordering, precision, grammar,
attributes, supported backends and Temporal-specific Intl integration. Require
numbered spec section/step comments beside audited code, synchronized with code
ranges and the audit ledger. This is an audit and correction of existing code,
not a fresh implementation.

Required inline evidence: add concise numbered spec section/step comments beside
audited implementation paths, including corrected code. Use official rendered
section links where useful; retain the requested-authority/comparison distinction.
Keep comments, source ranges and the audit ledger synchronized after edits.
Existing GitHub source-line comments are historical evidence, not a substitute
for current numbered section/step anchors.

Completion requires inline references for every audited implementation path.
Missing or stale comments remain tracked audit work, even when behavior passes.
Comments identify the numbered algorithm and relevant steps, with rendered spec
anchors. Shared helpers cite their actual semantic owner or caller contract;
do not invent direct spec ownership. Track annotation coverage separately from
behavior verification. Both must be complete before declaring the audit done.
Include missing, stale and unlanded inline references in remaining scope and ETA.
Land comments with their corresponding fixes; documentation-only mappings do not
satisfy this requirement.

## Current scope

Realm-specific work is deferred at the user's direction. Preserve all realm
findings and keep the 16 shared constructor-realm steps in the fixed ledger.
57 of 73 conditional numbered steps remain in scope. The ordinary
`index.js` and `standalone.js` failures reproduced inside one realm are now
verified with shared private epoch and calendar slots. Full audit completion uses the active scope and records the realm
deferral explicitly.

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

| Register                                                            | Measured scope                                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Public code map](temporal-public-code-spec-map.tsv)                | 268 API/property/range entries, all linked to existing source ranges                                                   |
| [Helper/backend code map](temporal-helper-code-spec-map.tsv)        | 1,069 fixed identities: 719 mapped, 161 candidate/dependency assignments, 189 unmapped (including 3 retired callbacks) |
| [Core checklist](temporal-core-requirement-checklist.tsv)           | 553 clauses, 429 algorithms, 3,325 numbered steps; 4,808 rows including other text and clause gates                    |
| [Amendment checklist](temporal-amendment-requirement-checklist.tsv) | 101 clauses, 55 algorithms, 760 active numbered steps; 1,057 rows, applicability classified                            |

The initial code maps covered 82 distinct selected source files and 24,790 physical lines.
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
separately. Candidate source assignments require confirmation; 189 unresolved
helper mappings are a mapping queue, not missing functions.

First pass reconciles all5,865 fixed rows:4,808 core and1,057 amendments.
Amendment applicability:433 owned Temporal bridges,467 shared dependencies,
86 runtime-delegated rows and71 editorial/nonbehavioral rows. Normal engine
and existing Intl contracts are reused, not reimplemented.

Remaining core states:231 conditional and90 comparison-issue rows. No reviewed
or partial rows remain. Amendments:61 conditional and11 comparison-issue rows. Counts include
propagated clauses/prose; they are not independent bugs or compliance percentages.
The [remaining numbered-step queue](temporal-remaining-condition-steps.tsv) has
73 conditional steps (42 core,31 amendment), each with exact source ranges
and named premise. [Source candidates](temporal-open-candidates.md) remain
separate from confirmed runtime gaps. Existing contract reuse is a supplied
callee contract, not a fresh full Intl audit.

Measured first pass:03:06–04:04 UTC, about58minutes for5,865 rows with parallel
review, prior-proof reuse, corrections and backend checks (about101rows/minute).
First review pass is complete. Landed timezone/Intl corrections closed69 numbered
steps; the reader/calendar batch closes another17. Reusing those contracts
closes16 caller steps without runtime changes. At the preceding checkpoint,104 steps formed14
shared-premise families. All268 public entries have numbered inline anchors;
helper/backend annotation remains part of completion. Four confirmed cross-copy
steps join 16 constructor realm fallback steps. The four public controls
reproduce with separate module graphs and ordinary index/standalone imports.
[Cross-copy evidence](temporal-cross-copy-brand/README.md).

The numbered queue falls from144 to104:36 steps are locally verified, two Notes
become informative and two steps retain explicit comparison issues. These are
evidence/status reconciliations, not40 runtime fixes.

Duration constructor/method capture and private calendar field-name append now
pass [12 targets](temporal-duration-provider-validation-targets.txt). New formatters
adopt late supplied data-valued providers; existing instances retain theirs.
[Evidence](temporal-duration-provider-private-operations-audit.md) keeps three
Duration gates conditional at that checkpoint. The memoizer candidate now has
two public pre-fix failures and a validated correction; [ten targets](temporal-duration-memoizer-validation-targets.txt)
pass at that checkpoint. Slot/cache corrections now pass the18-target batch;
fresh-constructor locale adapters remain separate. GetDifferenceSettings now has a complete local settings-operation
reconciliation, separate from its difference-method callers.

Prior owned Intl batch closes21 numbered steps and corrects four previously
verified numeric rows after public failures. Six selected-kind rows retain the
exact matchRangeWidths helper premise. Three precreated Duration method/group
gates close; fresh construction reopens one actual constructor step and three
containing clauses. Net queue:84 conditional steps across11 families.
[Eighteen targets](temporal-intl-producer-state-facade-validation-targets.txt) pass.
[Duration invocation](temporal-duration-invocation-private-operations-audit.md)
and [Intl adapters](temporal-intl-producer-state-facade-audit.md) bind scope.

Selected-kind matching, range widths and lazy interval initialization now
reconcile six more steps. [21 focused Bazel targets](temporal-selected-locale-adapter-validation-targets.txt)
returned passing cached results for these sources. Fresh Duration prefix lookup and Unicode extension adapters pass public
controls. Empty extension fields on prefix lookup and best-fit snapshot/request Lists
pass public controls. Best-fit key parsing, private cache state, native Locale
maximization and partition scoring pass. Fresh memoizer storage, captured
locale invariants and generated-table fallbacks now pass as well. §15.11.1.1
step 3 and its three containing clause gates are verified under the supplied
provider contract. [Fresh constructor evidence](temporal-duration-fresh-constructor-closure-evidence.json).
Generated profiles, both configured Linux x64 Node binaries, and the tested
Hermes compiled formatter supply endpoint and spread proofs. Both pinned runtime-relative tests pass. The manual strict Node24 test reports
290 fixture differences reproduced by its own Intl data and the independent
reference.
Other host profiles remain conditional.
[Timezone evidence](temporal-timezone-boundary-proof/node-icu/temporal-pinned-node-icu-proof.md). Helper annotation
work remains separately tracked. An ETA for full in-scope compliance remains unresolved. Published-comparison
conflicts and remaining provider assumptions need reconciliation. The [same-loader epoch fix](temporal-cross-copy-brand/same-loader-epoch-fix.md) closes §8.5.3 step 1.a.
The [same-loader calendar fix](temporal-cross-copy-brand/same-loader-calendar-fix.md) closes the three Plain calendar-slot
steps. Annotation timing estimates cover the numbered source comments.
Recalculate annotation and local-correction estimates from completed batches.

All eight directly revoked Proxy cases pass. Bound chains that revoke
during the prototype Get now reject on the validated Node and Hermes paths.
Foreign intrinsic selection and runtime limits keep 16 realm steps conditional.
[Realm proof](temporal-bound-constructor-realm-audit.md).
The [Apia exact-target assertion conflict](temporal-apia-exact-target-spec-issue.md)
is recorded separately from the two nonexact-window conditions. The
[generated-zone spread proof](temporal-zoned-day-window-spread-proof.md) supplies
the packed, compact and native day subdomain under its calendar and endpoint
contracts. The [shared nonexact proof](temporal-year-month-week-nonexact-window.md)
extends that result to week, month and year and incorporates the exact
Node ICU host spread certificate. The retained-prefix week shortcut reaches
337/336 in a New York fold. Its public result matches the intended retry
on the certified valid endpoints. The [endpoint proof](temporal-retained-week-endpoint-validity.md)
validates that extra week on the certified profiles. Published assertion and
retry conflicts and unexamined provider premises stay conditional.

Helper annotation checkpoint: [current queue](temporal-helper-annotation-queue.tsv)
retains1,069 identities:1,066 live bindings and three retired callbacks.
[581 mapping dispositions](temporal-helper-annotation-reconciliation.json)
cover ISO scanners, PlainTime, Rust formatting, plain-relative arithmetic, TS/Rust
rounding, calendar and timezone providers, and native Duration transport.
569 receive reviewed local inline scope;12 transport rows have narrow
inline caller/dependency links. Current mapping states:719 mapped,161 candidate,
189 unmapped, including three retired identities. Annotation presence alone
is644 direct,13 enclosing,409 without numbered anchors,3 retired; these are
ownership/annotation queues, not missing functionality or step-verification counts.

Measured sample:438seconds parallel review,211seconds integration preparation,
about2minutes root application/rescan/evidence, excluding commit hooks. Sample
reuses established proofs. Preliminary annotation-only estimate:3–5hours with
three parallel reviewers plus root integration, assuming comparable review cost.
Additional measured reviews:130seconds for18 calendar-provider mappings,131seconds
for12 existing transport caller links. Both reuse established semantic proofs;
root integration overlaps runtime work and is not assigned an invented duration.
Twelve timezone mappings took 35 seconds to apply and rebind after preliminary
review. Seventeen Rust parser mappings preserve all 31 callable bodies.
[Parser evidence](temporal-native-parse17-annotation-source-proof.json).
A further 42 mappings cover TypeScript clock/ISO helpers and Rust timezone
registry routing. Seven Bazel targets pass.
[Clock evidence](temporal-ts-clock26-annotation-source-proof.json)
[Registry evidence](temporal-native-zoneregistry16-annotation-source-proof.json).
The next 31 mappings cover Rust table-calendar pack validation and math.
[Table calendar evidence](temporal-table-calendar31-annotation-source-proof.json).
Another 35 mappings cover Rust arithmetic calendar conversions and bounds.
[Calendar core evidence](temporal-calendar-core35-annotation-source-proof.json).
The next 38 mappings cover Rust date, time, short date and zoned strings.
[Date and time evidence](temporal-native-date38-annotation-source-proof.json).
Added 41 native Duration and relative arithmetic mappings and reconciled five
TypeScript epoch helper references. [Native evidence](temporal-native-duration41-annotation-source-proof.json).
[Epoch mappings](temporal-epoch-annotation-proof.json).
Added 74 native calendar registry, timezone, zoned and clock mappings plus
four TypeScript calendar factory references. [Registry and zone evidence](temporal-native-zonecal39-annotation-source-proof.json).
[Zoned and clock evidence](temporal-native-zoned-now35-annotation-source-proof.json).
[Calendar factories](temporal-calendar-entry-annotation-proof.json).
The 166-mapping batch covers typed dates, clocks, calendar arithmetic,
Rust FFI and the TypeScript native bridge. [Date proof](temporal-native-date51-annotation-source-proof.json).
[Arithmetic proof](temporal-native-typed26-annotation-source-proof.json).
[FFI proof](temporal-native-ffi45-annotation-source-proof.json).
[Bridge proof](temporal-ts-native44-annotation-source-proof.json).
The prior measured-cost model gives about 1.5–2.5 hours for 409 remaining
annotations at comparable cost. Use 1.5–3 hours provisionally because the
remaining mix has more legacy calendar and timezone providers.

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
