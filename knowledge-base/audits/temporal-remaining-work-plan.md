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

Realm-specific work is out of scope. The fixed ledger records the 16 shared
constructor-realm steps for reference. They do not count toward completion
or the remaining estimate.
15 of 31 conditional numbered steps remain in scope. Of those, nine track
published comparison conflicts, two track relative-window premises and four
track timezone-provider applicability. The ordinary `index.js` and
`standalone.js` cases pass with shared private epoch and calendar slots.

## Source and finite scope

Requested authority: [ECMA-262](https://tc39.es/ecma262/), cited by section and
step. Rechecked 2026-11-22: published document has no Temporal API chapters.
Temporal API numbers in the registers therefore explicitly identify the
separately published [Temporal comparison](https://tc39.es/proposal-temporal/),
not an adopted replacement authority. Keep this distinction until resolved.
The rendered ECMAScript named-zone contracts still apply to the provider
audit. §21.4.1.20 requires every matching epoch in ascending order.
§21.4.1.21 requires the offset in nanoseconds at the requested epoch. Both
describe named-zone behavior separately from their numbered UTC-only default.
[Candidate contract](https://tc39.es/ecma262/#sec-getnamedtimezoneepochnanoseconds).
[Offset contract](https://tc39.es/ecma262/#sec-getnamedtimezoneoffsetnanoseconds).

Comparison snapshot retrieved 2026-11-21; SHA-256
`fc35bf6d3ae565bd8984f44b1f5740ec8024743215f82af818f0f48ad57ef22e`.
Freeze that text for this pass. A newer edition requires an explicit diff and
scope update, not an automatic restart.

| Register                                                            | Measured scope                                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Public code map](temporal-public-code-spec-map.tsv)                | 268 API/property/range entries, all linked to existing source ranges                                                   |
| [Helper/backend code map](temporal-helper-code-spec-map.tsv)        | 1,069 fixed identities: 1,014 mapped, 33 candidate/dependency assignments, 22 unmapped (including 5 retired callbacks) |
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
separately. The 33 candidate assignments and 22 unmapped identities all have
reviewed dispositions, including five retired callbacks.

First pass reconciles all5,865 fixed rows:4,808 core and1,057 amendments.
Amendment applicability:433 owned Temporal bridges,467 shared dependencies,
86 runtime-delegated rows and71 editorial/nonbehavioral rows. Normal engine
and existing Intl contracts are reused, not reimplemented.

Remaining core states include 215 conditional and 97 comparison-issue rows. No reviewed
or partial rows remain. Amendments have 35 conditional and 11 comparison-issue rows. Counts include
propagated clauses/prose; they are not independent bugs or compliance percentages.
The [remaining numbered-step queue](temporal-remaining-condition-steps.tsv) has
31 conditional steps (26 core, 5 amendment), each with exact source ranges
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
Transition-spacing checks establish sample completeness for shipped zone data
and the three pinned Node builds. The ICU proof directly enumerates annual
starts and checks candidate offset boundaries. All three Node builds pass the
Umm al-Qura chronology check. The seven-day scan also verifies each generated
transition probe interval against the corresponding pinned ICU rules.
[Sampling proof](temporal-timezone-boundary-proof/relative-window-sampler.md).
[Transition probe proof](temporal-timezone-boundary-proof/node-icu/temporal-node26-direct-spacing-proof.md#native-transition-lookup).
Chromium 156 matches 3,630 browser probes. Its exact 2026e timezone resources
pass the spacing, spread and endpoint scans on the pinned ICU reader. Controlled
native Intl and Temporal runs bind the explicit and recurring data paths.
Two exact Chromium builds each pass 131,471 direct reader checks across
candidate boundaries, endpoints and native transition walks. Two pinned builds
pass 8,784 more checks for the projected endpoint windows. Full provider
coverage and ordinary Node system ICU builds remain open.
[Chromium evidence](temporal-timezone-boundary-proof/chromium-provider-audit.md).
Other host profiles remain conditional. Numeric Intl cannot observe an outside
transition that creates an invalid second candidate.
[Unbound host proof](temporal-timezone-boundary-proof/README.md#unbound-host-intl-provider).
[Timezone evidence](temporal-timezone-boundary-proof/node-icu/temporal-pinned-node-icu-proof.md). Helper annotation
work remains separately tracked. An ETA for full in-scope compliance remains unresolved. Published-comparison
conflicts and remaining provider assumptions need reconciliation. The [same-loader epoch fix](temporal-cross-copy-brand/same-loader-epoch-fix.md) closes §8.5.3 step 1.a.
The [same-loader calendar fix](temporal-cross-copy-brand/same-loader-calendar-fix.md) closes the three Plain calendar-slot
steps. Annotation timing estimates cover the numbered source comments.
Recalculate annotation and local-correction estimates from completed batches.

All eight directly revoked Proxy cases pass. Bound chains that revoke
during the prototype Get now reject on the validated Node and Hermes paths.
The 16 realm steps remain historical evidence and are excluded from completion.
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
retains 1,069 identities, including 1,064 live bindings and five retired callbacks.
[1,008 mapping dispositions](temporal-helper-annotation-reconciliation.json)
cover ISO scanners, PlainTime, Rust formatting, plain-relative arithmetic, TS/Rust
rounding, calendar and timezone providers, and native Duration transport.
996 receive reviewed local inline scope;12 transport rows have narrow
inline caller/dependency links. Current mapping states are 1,014 mapped,
33 candidate and 22 unmapped, including five retired identities. Annotation
presence is 987 direct, 26 enclosing, 51 without a direct anchor, and 5 retired. These are
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
The next 84 mappings cover Rust short dates and the remaining TypeScript native
bridge dependencies. 82 add numbered anchors. Two reconcile code with existing
anchors. Seven focused Bazel targets pass.
[Short-date proof](temporal-native-shortdates45-annotation-source-proof.json).
[Bridge proof](temporal-ts-native38-annotation-source-proof.json).
[Candidate List transport](temporal-ts-native-existing-929-source-proof.json).
The next 72 helper mappings cover native Intl providers and legacy date
formatting. The legacy batch binds 65 local comments to rendered ECMA-262 and
ECMA-402 clauses. Six focused Bazel targets pass.
[Native provider proof](temporal-native-intlctx36-annotation-source-proof.json).
[Legacy proof](temporal-legacy-calendar-rendered-annotation-source-proof.json).

The next 43 mappings cover TypeScript calendar operations and timezone
routing. Two callable predicates share an enclosing comment. Eleven structural
or test-only rows have recorded reviews with no exact step established.
Five focused Bazel targets pass.
[Calendar proof](temporal-typescript-calendar28-annotation-source-proof.json).
[Timezone proof](temporal-zones-routing15-annotation-source-proof.json).

The Rust pass maps another 17 helpers and classifies all 18 remaining
structural or transport rows. Every Rust row in the fixed inventory now has a
numbered reference or a documented structural disposition. Five focused Bazel
targets pass. [Rust proof](temporal-native-remainder17-annotation-source-proof.json).

The next 35 mappings cover Duration conversion and host formatting, date and
calendar helpers, and exact Date-to-Instant conversion. Nineteen helpers gained
numbered anchors and two TypeScript casts received structural dispositions.
Six focused Bazel targets pass.
[Duration proof](temporal-ts-duration23-annotation-source-proof.json).
[Date proof](temporal-ts-date-helpers12-annotation-source-proof.json).

The next 78 mappings cover legacy Intl, fallback providers, kernel arithmetic,
Instant, and ZonedDateTime. Twenty-three structural reviews and a retired
fallback callback also leave the queue. Six focused Bazel targets pass.
[Legacy proof](temporal-legacy-ancestor57-annotation-source-proof.json).
[Kernel proof](temporal-ts-kernel19-annotation-source-proof.json).
[Instant and ZonedDateTime proof](temporal-ts-epoch-routing23-annotation-source-proof.json).

The final 98 mappings cover Plain types, calendar and timezone providers,
relative durations, locale support, and Instant parsing. Nine more structural
helpers receive documented dispositions. Every fixed inventory row now has a
reviewed numbered scope, a structural disposition, or a retired identity.
Nine focused Bazel targets pass.
[Plain types](temporal-ts-plain21-annotation-source-proof.json).
[Providers and relative duration](temporal-ts-provider-relative19-annotation-source-proof.json).
[Locale and Instant](temporal-ts-locale27-annotation-source-proof.json).
[Date and short dates](temporal-ts-date-final31-annotation-source-proof.json).

Source review of the fixed helper inventory is complete. Behavioral review
still has 15 in-scope conditional Temporal steps. Both exact owned candidate lookup
and gap disambiguation now pass public packed-data regressions. Owned next
and previous transition lookup uses exact decoded boundaries. Owned gap resolution
checks actual boundary candidates near both Instant limits.
[Edge evidence](temporal-timezone-boundary-proof/README.md#owned-gaps-near-the-instant-limits). Other Intl
profiles retain candidate, gap and transition coverage premises. The native
Intl search now preserves known finite future history before skipping recurring
years, verified by the pinned Casablanca and El_Aaiun regressions. The published
ECMA-402 range-collapse regression is fixed and validated.
The numeric-year and era path reuses a validated host layout, including
numeric month and day widths and weekday labels verified against the
selected range parts, plus Buddhist textual months with verified ordinals.
Distinct narrow month ordinals prevent collapse, and verified Month patterns
retain shared year parts. Verified UTC day-only Buddhist intervals preserve
month and year fields introduced by the selected host pattern. Verified UTC two-digit
year ranges preserve shared era and full-year comparisons.
UTC Chinese and Dangi intervals reuse Day or Month selection when the
related year, month code and corrected day widths are verified. Verified
year-boundary labels retain their layout. Regular and leap months stay
distinct at Month or Day precision. Verified UTC day-only leap ranges reuse
the Month pattern. Verified explicit-year and full-date ranges keep native
punctuation and tagged weekdays. Same-year searches cover skipped and reversed
controls. Verified UTC layouts with clock fields also retain native widths
and source tags. Layouts without verified controls remain open.
[Range proof](temporal-pattern-partition-audit.md#legacy-corrected-range-collapse).
The zoned locale bridge keeps warm host-offset cache lookups private under
replaced collection methods. [Cache proof](temporal-legacy-bridge-state-audit.md#zoned-locale-offset-cache).
Owned range records use own data properties for sources and selected local time.
[Range record proof](temporal-pattern-partition-audit.md#owned-private-range-records).
Five independent range steps now have local verification. The configured-zone
comparison and dependent branch predicates remain open.
[Local evidence](temporal-pattern-partition-audit.md#owned-private-range-traversal).
Eleven core steps now have local evidence for dispatch, ISO prefix operations,
exact subtraction and compatible endpoint resolution.
[ISO evidence](temporal-iso-date-until-prefix-proof-audit.md#independent-step-evidence).
[Zoned evidence](temporal-relative-rounding-contract-audit.md#independent-step-evidence).
Ten additional local steps cover reachable ISO day probes and independent Intl
range values and allocation.
[ISO day evidence](temporal-iso-date-until-prefix-proof-audit.md#reachable-day-probes).
[Intl evidence](temporal-pattern-partition-audit.md#range-field-and-fresh-list-leaves).
Seven more local Intl steps cover field dispatch, the default-width guard,
inequality encoding and collapsed rendering. The distinct range renderer
also reads its optional precision from own fields. Eight Bazel targets pass.
[Range evidence](temporal-pattern-partition-audit.md#range-dispatch-and-rendering).
Three more local Intl steps verify day-period values and the precision slot.
Cold and cached range regressions cover own interval metadata. A Rust borrowed
calendar regression fixes an early error on a discarded zoned date probe.
[Interval metadata](temporal-pattern-partition-audit.md#day-period-values-and-private-interval-metadata).
[Borrowed calendar boundary](temporal-relative-rounding-contract-audit.md#discarded-gap-probe-at-a-borrowed-calendar-boundary).
Plain and zoned date transport, Intl equality and the collapse predicate now
have numbered caller and branch evidence. Borrowed Rust providers have new
calendar coverage and wide-gap regressions.
[Plain and zoned proofs](temporal-relative-rounding-contract-audit.md#borrowed-timezone-rounding-and-plain-date-transport).
[Range equality](temporal-pattern-partition-audit.md#range-equality-and-collapse).
Four more caller steps preserve the calendar dates, exact instants, original
zone, units and rounding settings. Their calendar and window contracts stay
separate. Nine Bazel targets pass.
[Caller arguments](temporal-relative-rounding-contract-audit.md#plain-and-zoned-caller-arguments).
Wide-transition controls now verify repeated outward retries, inward rounding
and initial weekly total endpoint validation. Overlapping gaps use their
nearest reachable local boundaries.
[Wide windows](temporal-relative-rounding-contract-audit.md#wide-transitions-and-initial-total-validation).
[Owned gap boundaries](temporal-timezone-boundary-proof/README.md#overlapping-owned-gap-boundaries).
Borrowed Rust and compact TypeScript now reject exact mixed-range candidates
at both Instant limits. Retained-week rounding validates its later endpoint
after an outward retry. The lower-side retry now keeps both bounds valid when
the retained prefix overshoots with zero weeks. Unbound provider capability
and the published assertions remain open.
[Mixed-range candidates](temporal-timezone-boundary-proof/README.md#borrowed-mixed-range-candidate).
[Retained-week upper bound](temporal-relative-rounding-contract-audit.md#retained-week-upper-bound).
[Retained-week lower bound](temporal-relative-rounding-contract-audit.md#retained-week-lower-bound).
Day and month rounding now retain a valid lower grid when a zero component
overshoots. Both signs and variable month counts pass public replay. The
Duration and ZonedDateTime full Test262 targets still pass.
[Retained day and month lower bounds](temporal-relative-rounding-contract-audit.md#retained-day-and-month-lower-bounds).
The final nonexact-window proof now covers bounded borrowed zones whose
calendar add-back, compatible offset and endpoint contracts are established.
Exact Apia and published retry rules are separate open requirements.
[Nonexact window proof](temporal-year-month-week-nonexact-window.md#current-source-proof).
The exact-first replay also covers an owned zone whose second endpoint
precedes its exact first endpoint. The published retry still lacks a bracket.
[Reversed exact window](temporal-apia-exact-target-spec-issue.md#exact-first-endpoint-with-reversed-span).
The exact Apia target is now a shared public oracle across TypeScript and
native Hermes. Its endpoint policy is verified independently of the published
zero-span assertion. The Intl witnesses isolate two separate prerequisites,
Plain timezone projection and the comparison cutoff for numeric ranges.
[Apia exact target](temporal-apia-exact-target-spec-issue.md).
[Intl witnesses](temporal-amendment-spec-issues.md).

The two shipped DateTimeFormat 7.8.1 datasets now have checked spacing and
endpoint bounds for all four host timezone conditions. Replacement data still
need their own proof. The native Intl candidate path now appends private
candidates without calling inherited index setters.
[Legacy dataset proof](temporal-timezone-boundary-proof/README.md#released-formatter-with-its-shipped-data).
[Host regression](../../packages/temporal/tests/host-timezone.test.ts#L129).
The Debian JavaScriptCoreGTK 2.54.3 and ICU 76.1 binding now has exact
candidate, gap, endpoint and six-day spread bounds, plus public controls.
Other JavaScriptCore builds remain conditional.
[Debian JSC proof](temporal-timezone-boundary-proof/jsc-provider-audit.md).
The pinned Debian SpiderMonkey shell and bundled ICU now have the same
checked timezone bounds. The explicit Temporal installer now refreshes
offset and transition samples on each lookup for the captured FormatJS
DateTimeFormat 7.8.1 formatter. The direct import still reproduces stale
samples after reload. Provider spacing and TimeClip premises stay open.
Source reflection cannot classify the direct provider across supported
engines. The pinned Hermes runner observes a callable Proxy property and
hides formatter source behind a bytecode placeholder.
[Debian SpiderMonkey proof](temporal-timezone-boundary-proof/spidermonkey-provider-audit.md).
[Legacy reload replay](temporal-timezone-boundary-proof/README.md#legacy-reload-after-installing-temporal).
[Source reflection replay](temporal-timezone-boundary-proof/README.md#function-source-recognition-for-direct-imports).
The owned formatter's Temporal hooks now follow the same canonical timezone
rows as Intl formatting after reload. The packaged regression covers an alias
whose custom row conflicts with the canonical data zone.
[Alias reload proof](temporal-timezone-boundary-proof/README.md#canonical-timezone-rows-after-an-alias-reload).
Host capability checks now require an own data field on the descriptor.
The regression observes zero inherited getter calls.
[Capability proof](temporal-timezone-boundary-proof/README.md#host-capability-descriptors).
Owned Intl now shares the loaded-kernel fallback when a supported exact gap
shift still lands inside a gap. Start-of-day now searches for the nearest
reachable local time across intersecting transitions within an unclipped
interval. Its date-only callers pass the requested date explicitly.
[Gap replay](temporal-timezone-boundary-proof/README.md#shifted-clock-still-inside-a-gap).
[Day-start replay](temporal-timezone-boundary-proof/README.md#start-of-day-after-intersecting-transitions).
The compact provider now uses the owned formatter's transition search, and
borrowed Rust checks its footer handoff at the second its offset actually
changes. The day-start proof now also covers a clipped upper search when
the nearest result bounds every competing instant inside the range.
[Footer handoff proof](temporal-timezone-boundary-proof/README.md#fixed-footer-handoff-in-loaded-zones).
Borrowed Rust now returns an explicit or recurring previous transition at
the minimum Instant. Raw predecessor offsets provide the comparison.
[Minimum transition](temporal-timezone-boundary-proof/README.md#rust-transition-at-the-minimum-instant).
The compact gap scan also includes the transition at the minimum Instant.
The regression verifies valid nearest candidates and all four modes.
[Minimum gap](temporal-timezone-boundary-proof/README.md#compact-gap-crossing-the-minimum-instant).
Owned, compact and Rust providers can now prove a missing-midnight
day start near the minimum using raw boundaries.
[Lower day-start proof](temporal-timezone-boundary-proof/README.md#exact-start-of-day-at-the-minimum-instant).
The same raw-provider query now handles upper day starts that a clipped
scan cannot prove, including a first valid instant equal to the maximum.
[Upper day-start proof](temporal-timezone-boundary-proof/README.md#exact-start-of-day-at-the-maximum-instant).
Rust now also uses complete raw boundaries for exact minimum-Instant
gap disambiguation. Both offset engines carry daylight time through
January 1 when extended TZif rules shift both previous-year events
into January.
[Gap parity](temporal-timezone-boundary-proof/README.md#compact-gap-crossing-the-minimum-instant).
[TZif carry](temporal-timezone-boundary-proof/README.md#extended-tzif-rules-crossing-a-year-boundary).
The nearest earlier boundary of a separate exact synthetic gap has two
candidates. This gives a published comparison issue at §11.1.12 step 9.
[Folded boundary](temporal-timezone-boundary-proof/README.md#folded-nearest-gap-boundary).
A second witness puts the nearest later candidate beyond the maximum
Instant. The comparison's infallible lookup fails, and owned and compact
providers differ on fallback.
[Auxiliary candidate](temporal-timezone-boundary-proof/README.md#gap-auxiliary-candidate-outside-the-instant-range).
The finite retained-week count now has an explicit provider-bound proof.
A separate public replay isolates the month bubbling policy after a valid
directed rounding window. The numbered conditions keep their current scope.
[Week count](temporal-relative-rounding-contract-audit.md#retained-week-count-under-finite-calendar-projection).
[Bubbling](temporal-relative-rounding-contract-audit.md#bubbling-can-reverse-the-directed-result).
Three exact helper comments now cover the Object branch, cached ISO projection
and canonical packed zone selection. A fourth now maps native zoned offset
transport to §6.5.2 steps 5.f–5.g.i and 5.k–5.l.iii. The wire result preserves
wall, UTC, minute and exact classifications for the caller. Two more comments
bind the prepared calendar Number predicate and captured Proxy construction to
their ECMA-262 algorithms. The 51 remaining helpers without a direct anchor
have recorded owners, including seven with narrower enclosing caller links.
[Residual helper owners](temporal-helper-residual-owners.tsv).
[Number predicate](https://tc39.es/ecma262/#sec-number.issafeinteger).
[Proxy construction](https://tc39.es/ecma262/#sec-proxy-target-handler).

From 16:35 to 17:47 UTC, 44 numbered conditions closed in 71 minutes. The
final two batches in that interval each landed a validated local correction
in about eight minutes, with 16 in-scope conditions still open. The earlier
closure rate cannot estimate publication or unbound-provider dependencies.
From 18:22:55 to 18:44:03 UTC, nine audit commits landed, five with runtime
fixes. The patch rate measures local work. None of the 15 remaining
conditional rows closed in that interval, so it gives no full signoff date.

Full pinned Node Test262 passed all 9,090 executions across the eight Temporal
class targets at `5654ccf78` with Node 26.8.1 and Test262
`2a1ade303f72d3de80565c921d685222405c32ce`. The full Temporal Intl target
passed 4,078 of 4,080.
Both failures exercise the same published timezone policy issue. The range
interval lookup now has independent evidence under §15.6.8 step 23.b.
The surrounding comparison loop remains conditional.
[Fixture policy](temporal-spec-issues.md#published-zone-primary-rule-versus-pending-legacy-posix-policy).
[Interval lookup evidence](temporal-amendment-spec-issues.md#sparse-range-interval-records).
Combined-style construction now keeps private component and interval work
independent of the eight observed Object, Array and String hooks.
[Combined style evidence](temporal-selected-locale-adapter-audit.md#combined-date-and-time-styles).
The legacy Intl bridge now keeps extended Gregorian endpoint and part
lists private. The packed public regression covers both strings and
both parts methods, and all six focused Bazel targets pass.
[Legacy bridge evidence](temporal-legacy-bridge-state-audit.md#reproduced-gap).

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
