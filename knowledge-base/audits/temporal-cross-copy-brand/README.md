# Cross-copy Temporal brand failures

The [same-loader epoch fix](same-loader-epoch-fix.md) resolves the packaged
Instant and ZonedDateTime copy failures below. The [same-loader calendar fix](same-loader-calendar-fix.md) resolves the Plain
calendar cases. This document preserves the original failing comparison.

Node 26.5.1 and ICU 78.3 reproduce four failing public controls against the
packaged FormatJS entry points. Native Temporal across two VM realms and FormatJS
within one module instance return the same exact values with zero public hook
reads. Separate FormatJS brands fail in both directions, across realms, within
one realm after independent module evaluation, and between Node imports of
`index.js` and `standalone.js`. The forced installer and `index.js` share one
module graph and pass these controls.

| Frozen comparison                                                                                                      | Public control                                              | FormatJS cross-copy result                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| [§8.5.3 step 1.a](https://tc39.es/proposal-temporal/#sec-temporal-totemporalinstant)                                   | `Instant.from` on Instant and ZonedDateTime                 | Gets `Symbol.toPrimitive` on both, skipping the exact epoch slot |
| [§12.3.10 step 1](https://tc39.es/proposal-temporal/#sec-temporal-totemporalcalendaridentifier)                        | `PlainDate.prototype.withCalendar` on a Gregorian PlainDate | Throws `TypeError` before returning the calendar slot            |
| [§12.3.11 steps 1 and 1.a](https://tc39.es/proposal-temporal/#sec-temporal-gettemporalcalendarslotvaluewithisodefault) | `PlainYearMonth.from` on that PlainDate                     | Gets public `calendar` instead of the internal slot              |

Exact reader ranges are
[`toInstant`](../../../packages/temporal/instant.ts#L154-L164),
[`calendarSlot`](../../../packages/temporal/date-core.ts#L130-L138),
[`calendarFromObject`](../../../packages/temporal/date-core.ts#L139-L144) and
[`calendarId`](../../../packages/temporal/date-core.ts#L167-L180).
The ledger retains local same-copy behavior and marks four numbered steps as
confirmed gaps. Four failing public controls cover these four steps, with two
controls for §8.5.3 step 1.a and one for both §12.3.11 steps.

## Reproduce

With Node 26.5.1 and the repository Bazel toolchain, run from the repository root.

```sh
bazel build //packages/temporal:pkg
pkg_path="$(bazel cquery --output=files //packages/temporal:pkg)"
node --experimental-vm-modules knowledge-base/audits/temporal-cross-copy-brand/reproduce.mjs "$pkg_path"
```

[Captured output](observed-node26.json) includes package artifact hashes,
ordinary Proxy traces, mixed native and FormatJS controls and the two native and
FormatJS slot reader probes. The frozen proposal comparison supplies the Temporal
step numbers. [ECMA-262](https://tc39.es/ecma262/) remains the requested authority.

## Reader discovery constraint

A frozen genuine Instant with null prototype and a frozen null-prototype ordinary
object have identical own keys, prototype and extensibility. A captured native
epoch getter rejects both. The genuine object's producing FormatJS getter reads
its exact epoch with zero hooks. Prototype and descriptor discovery trigger
additional observable traps on ordinary Proxy inputs. Two realms share the
global symbol registry in this profile and keep separate globals and module
state.

Explicitly handing the producer namespace to the existing DateTimeFormat
registration path restores Gregorian formatting with zero hook reads. This
demonstrates a possible trusted handoff boundary. Automatic core slot reader
discovery remains open. Candidate designs must preserve private slot ownership,
Proxy behavior and package entry contracts.
