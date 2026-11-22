# Retained-week and minimum local gap audit

## Retained-week inward retry

A Coptic five-day month exposes a retry that underestimates gap
displacement. Set hour zero to 2024-09-11T00:00 UTC. With initial offset
−23h and changes to +22h, −18h and +6h at hours −20, +17 and +47, the
origin is at −97h and the target at +10h. The retained month adds to +18h.
The rebased week adds exactly to +10h after compatible gap resolution.
The old five-day physical gate skipped the week because the target was
107 hours from the shortened base. The new window finds the exact
`P1W` result. The negative control also finds `-P1W`.
[Packaged regression](../../packages/temporal/tests/host-candidate-range.test.mjs#L630).
[Rust regression](../../crates/temporal/lib.test.rs#L4187).

Compatible gap displacement has magnitude below two days on exact
providers. Consecutive nominal week endpoints are at least seven days
apart, so their resolved epochs remain strictly ordered. A candidate
nominally four signed days beyond the retained upper endpoint comes
after it in signed order and cannot fit. An eligible candidate lies at
least four nominal days inside the initially validated upper quantum.
Its shifted raw epochs stay in range on that side. On the origin side,
the seven-day separation from the already validated lower endpoint
supplies the bound. Both kernels check each eligible epoch and exit
when it is exact. Published collapsed-window and unbound provider
conditions remain open.
[Comparison §7.5.34 steps 5.a.ii and 6.a.ii](https://tc39.es/proposal-temporal/#sec-temporal-nudgetocalendarunit).

## Local clock before the minimum Instant

The Rust exact provider now accepts a valid wall clock below the minimum
Instant. The regression uses minute offsets −26, −3, −27, −23 and 0,
with switches at minimum plus 0, 1, 3 and 15 minutes. The missing clock
at minimum minus five minutes has two unique valid neighboring clocks.
The actual shift is 20 minutes. Earlier returns minimum plus two minutes.
Compatible and later return minimum plus 15 minutes. Checking the ISO
local range lets the raw projection see the transition at minimum.
The bounded Instant scan alone gave a 23-minute shift.
[Rust regression](../../crates/temporal/lib.test.rs#L1794).
[Comparison §11.1.12 steps 6–7](https://tc39.es/proposal-temporal/#sec-temporal-disambiguatepossibleepochnanoseconds).

## Additional inline mappings

These comments bind the property or part read by each helper. Temporal
behavior stays with the owning algorithm. The old part-value map callback
at inventory row 790 was already replaced by the annotated indexed loop
in commit `849f13dc7`. Its identity is now marked retired.

| Row | Exact source comment                                                                | Local scope                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 550 | [accessors.ts:1](../../packages/temporal/accessors.ts#L1)                           | Installs each selected prototype accessor using the runtime property-definition operation.                                                                                        |
| 551 | [accessors.ts:7](../../packages/temporal/accessors.ts#L7)                           | Reads the getter descriptor and defines the target accessor within its capture scope.                                                                                             |
| 763 | [legacy-calendar-date.ts:329](../../packages/temporal/legacy-calendar-date.ts#L329) | Consumes host-emitted date part types for the compatibility presence guard. No complete host formatter or Temporal method signoff.                                                |
| 764 | [legacy-calendar-date.ts:377](../../packages/temporal/legacy-calendar-date.ts#L377) | Preserves emitted types and substitutes real-clock part values for surrogate labels; data dependency only. No complete host formatter or Temporal method signoff.                 |
| 765 | [legacy-calendar-date.ts:381](../../packages/temporal/legacy-calendar-date.ts#L381) | Selects the original host clock part with the same emitted type. No complete host formatter or Temporal method signoff.                                                           |
| 766 | [legacy-calendar-date.ts:415](../../packages/temporal/legacy-calendar-date.ts#L415) | Consumes surrogate part types to decide whether date correction applies. No complete host formatter or Temporal method signoff.                                                   |
| 769 | [legacy-calendar-date.ts:480](../../packages/temporal/legacy-calendar-date.ts#L480) | Tests for a host-emitted year part before restoring its text. No complete host formatter or Temporal method signoff.                                                              |
| 771 | [legacy-calendar-date.ts:545](../../packages/temporal/legacy-calendar-date.ts#L545) | Tests for a host-emitted day part before restoring its text. No complete host formatter or Temporal method signoff.                                                               |
| 773 | [legacy-calendar-date.ts:595](../../packages/temporal/legacy-calendar-date.ts#L595) | Compares corrected labels against emitted type/value pairs for private reuse; not a normative correction algorithm. No complete host formatter or Temporal method signoff.        |
| 776 | [legacy-calendar-date.ts:947](../../packages/temporal/legacy-calendar-date.ts#L947) | Host part-list equality helper consumes emitted type/value records before native reuse; criterion is compatibility policy. No complete host formatter or Temporal method signoff. |
| 777 | [legacy-calendar-date.ts:955](../../packages/temporal/legacy-calendar-date.ts#L955) | Compares each emitted type/value pair inside the compatibility reuse predicate. No complete host formatter or Temporal method signoff.                                            |
| 785 | [legacy-extended-date.ts:101](../../packages/temporal/legacy-extended-date.ts#L101) | Restores a matching surrogate label from precomputed year display values.                                                                                                         |
| 787 | [legacy-extended-date.ts:119](../../packages/temporal/legacy-extended-date.ts#L119) | Supplies the already projected timezone label for the matched output part.                                                                                                        |
| 788 | [legacy-extended-date.ts:137](../../packages/temporal/legacy-extended-date.ts#L137) | Uses the numeric host part value to restore year text.                                                                                                                            |
| 797 | [legacy-extended-date.ts:223](../../packages/temporal/legacy-extended-date.ts#L223) | Uses the range part source to choose a year rewrite while preserving host pattern selection.                                                                                      |
| 844 | [legacy-zoned-date.ts:75](../../packages/temporal/legacy-zoned-date.ts#L75)         | Consumes the host timezone-name part type to decide whether zone-label restoration is needed. No complete host formatter or Temporal method signoff.                              |
| 847 | [legacy-zoned-date.ts:116](../../packages/temporal/legacy-zoned-date.ts#L116)       | Selects the host sample timezone-name part by its emitted type. No complete host formatter or Temporal method signoff.                                                            |
