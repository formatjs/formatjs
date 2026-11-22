# Temporal remaining work, 2026-11-22

Working estimate: **7–14 calendar days of continuous parallel work**, low
confidence. This is an engineering forecast, not a compliance claim or a promise
to resolve conflicting standards text by a date. Large calendar/timezone defects
can extend the range. Eight-hour staffed workdays imply a longer schedule.

Historical source-line counts no longer estimate remaining effort. New operation
maps and reusable proofs close dependencies without adding historical traces.
PR counts, audit file counts and passing tests also cannot measure compliance.

## Approach and completion rule

Scope is finite. Freeze the published spec snapshot and enumerate every numbered
step, prose requirement, grammar rule, table and attribute in that snapshot.
Use section and nested step numbers as stable checklist identifiers. Keep the
requested ECMA-262 authority and separately labelled Temporal comparison distinct.

Each row records current implementation lines, evidence and one outcome:
unreviewed, verified, fix needed, or spec issue. Work through sections in order;
parallel reviewers own disjoint ranges. Reconcile existing evidence into these
rows before repeating analysis. Audit only dependencies required by those rows.
Reopen a verified row only when changed code or a demonstrated counterexample
invalidates its evidence. New spec editions require an explicit scope update.

Report the fixed total, remaining unreviewed rows, unresolved fixes and spec
issues separately. Forecast from reviewed rows per elapsed work interval, with
remaining bug-fix work estimated separately. Section links, PR counts and new
audit documents do not close checklist rows.

Reproduce witnessed defects, correct them, validate focused controls and affected
backends, update the operation's ledger, then publish and land green stacked PRs.
Parallel reviewers own separate operation families; source edits, Bazel and stack
integration share one checkout and remain coordinated. Tests supplement source
analysis and proofs; passing tests alone cannot close a contract.

An operation stays conditional only for a named missing obligation with a concrete
next action. Broad caveats about all providers or realms must not erase completed
analysis. Reconcile parent documents when a dependency closes. Group related
fixes to reduce repeated broad validation and stack overhead.

## Remaining deliverables

These are estimated agent work-hours, not measured counts of remaining tasks.

| Workstream                        | Exit criteria                                                                                                                                                      | Hours |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----: |
| Public operations and conversions | Exhaustive constructor/static/instance/getter/Now inventory; conversions, with/merge, differences, comparison, rounding, arithmetic caller order and bounds mapped | 40–75 |
| Coercion, attributes and realms   | Per-operation brand/option/argument order, abrupt identity, descriptors, length/name, fresh allocation and supported cross-realm installation reviewed             | 24–45 |
| Calendar, zone and data           | Named zones, possible instants, gaps/folds, start of day, future rules and host/data dependencies closed; reuse calendar partition and shipped-join proofs         | 35–65 |
| Temporal Intl interop             | Temporal input types, ranges, calendar compatibility, locale-list and formatter producer/exposure contracts reviewed                                               | 18–35 |
| Grammar and output                | Entrypoint acceptance, annotations, leap seconds, ambiguity, precision, rounding, negative zero and TS/Rust correspondence reviewed                                | 15–30 |
| Source/native parity              | Optional native/generic paths and fallback profiles mapped to the same operation contracts; missing branches covered                                               | 20–35 |
| Reconciliation and integration    | Current operation matrix, source anchors, original in-progress PR reconciliation, final heads validated and changes landed                                         | 12–25 |

Base 164–310 agent-hours; reserve 35–75 for bugs and integration: approximately
**200–385 agent-hours**. Effective 2–2.5-fold concurrency gives roughly 80–190
wall-hours of active progress. Serialized CI, review and landing justify the
7–14 calendar-day planning range. These assumptions are not statistical bounds.

## Checkpoints

Within 24 hours: finish the public-operation inventory; reconcile recent
addition, difference and provider proofs; name each open operation's missing
obligation, source owner and next witness/proof. Report reviewed, conditional and
unreviewed operation counts separately, then revise the forecast.

Following 2–4 days: parallel queues for public conversion/callers, zone/window
contracts, and grammar/output plus Temporal Intl. Realm/native checks follow
each operation family. Timebox a review slice to 2–4 hours: deliver a closed
bounded contract, reproducible defect, or concrete unresolved dependency.

Remaining window: finish uncovered families, fix witnessed defects, validate the
final backend/engine matrix and reconcile landed code with the ledger. Document
standards inconsistencies separately.

Requested authority remains [ECMA-262](https://tc39.es/ecma262/). Its checked
document lacks Temporal API chapters; separately labelled proposal comparisons
support engineering work. Resolving that authority mismatch is a final signoff
gate, separate from the engineering forecast. No silent substitution of sources.
