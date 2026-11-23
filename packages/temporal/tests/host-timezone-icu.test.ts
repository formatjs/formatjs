import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import {Temporal as Reference} from 'temporal-polyfill/full/implementation'
import {createHostTimeZone} from '#packages/temporal/host-timezone.js'
import {checkHostTimezoneOracle} from '#packages/temporal/tests/host-timezone-oracle.js'
import {timeZoneIdentifier} from '#packages/temporal/zones.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'
import type {HostTimeZone} from '#packages/temporal/host-timezone.js'

function referenceZone(id: string): HostTimeZone {
  timeZoneIdentifier(id)
  const resolve: HostTimeZone['resolve'] = (
    fields,
    disambiguation = 'compatible'
  ) =>
    Reference.PlainDateTime.from(
      typeof fields === 'bigint' ? epochNanosecondsToISO(fields) : fields
    ).toZonedDateTime(id, {disambiguation}).epochNanoseconds
  return {
    offsetNanoseconds: instant =>
      BigInt(new Reference.ZonedDateTime(instant, id).offsetNanoseconds),
    resolve,
    possibleInstants: fields => {
      const local = Reference.PlainDateTime.from(fields)
      return [
        ...new Set([resolve(fields, 'earlier'), resolve(fields, 'later')]),
      ].filter(instant =>
        new Reference.ZonedDateTime(instant, id).toPlainDateTime().equals(local)
      )
    },
  }
}

it('checks the complete ICU corpus and separates host data differences using temporal-polyfill', () => {
  const read = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/${name}`
      ),
      'utf8'
    )
  const identities = read('temporal-timezone-identity-fixtures.tsv'),
    offsets = read('temporal-timezone-fixtures.tsv')
  function check(create: (id: string) => HostTimeZone) {
    const failures: {context: string; actual: string; expected: string}[] = []
    const counts = checkHostTimezoneOracle(
      create,
      identities,
      offsets,
      (actual, expected, context) => {
        if (actual !== expected)
          failures.push({
            context,
            actual: String(actual),
            expected: String(expected),
          })
      }
    )
    expect(counts).toEqual({
      identities: 597,
      offsets: 17640,
      gapsAndFolds: 1900,
    })
    return failures
  }
  const failures = check(id => createHostTimeZone(timeZoneIdentifier(id)))
  console.log(
    JSON.stringify({
      node: process.version,
      icu: process.versions.icu,
      tz: process.versions.tz,
      oracle: offsets.split('\n')[0],
      failures: failures.length,
      samples: failures.slice(0, 10),
    })
  )
  if (process.env.FORMATJS_TEMPORAL_HOST_TIMEZONE_STRICT === '1')
    expect(failures).toEqual([])
  else expect(failures).toEqual(check(referenceZone))
}, 60000)
