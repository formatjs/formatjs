import {
  mathAbs,
  mathTrunc,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-262 §21.4.1.31 TimeClip: input is already a Number.
// https://tc39.es/ecma262/#sec-timeclip
export function TimeClip(time: number): number {
  // Step 1: non-finite inputs represent no instant.
  if (!numberIsFinite(time)) return NaN
  // Step 2: exact inclusive bound; 8.64 * 1e15 rounds one millisecond too high.
  if (mathAbs(time) > 8_640_000_000_000_000) return NaN
  // Step 3: ToIntegerOrInfinity truncates and maps both zero signs to +0.
  return mathTrunc(time) || 0
}
