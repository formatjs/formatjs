import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readdirSync, readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {endianness} from 'node:os'
import {isAbsolute, join} from 'node:path'

const chromiumResources = {
  'metaZones.res':
    '5b484c7f02c99d5164208ce84e18fba67c6314d77cf60503e2b19f708b66c6da',
  'timezoneTypes.res':
    'a0f9621945e0282d7861b05149cb3db2610ed0a87c4a5e440d8743ec15511582',
  'windowsZones.res':
    'b8c3a7adb94fd659f8203ee4af4dc72a4e6b14566baac1855c493096f337184b',
  'zoneinfo64.res':
    '5a168fb78cccfc872f9a50e91facf0bf8b7204a6c4f92fe5c64a8165e9e62448',
}

const sha256 = path =>
  createHash('sha256').update(readFileSync(path)).digest('hex')

export async function loadPinnedIcu() {
  assert.equal(endianness(), 'LE', 'UChar buffers require little endian')
  assert.equal(process.platform, 'linux')
  assert.equal(process.arch, 'x64')
  for (const name of [
    'NODE_ICU_DATA',
    'ICU_DATA',
    'NODE_OPTIONS',
    'LD_PRELOAD',
    'LD_LIBRARY_PATH',
  ]) {
    assert.equal(process.env[name], undefined, name)
  }
  const binarySha256 = sha256(process.execPath)
  const timezoneDirectory = process.env.ICU_TIMEZONE_FILES_DIR
  if (timezoneDirectory !== undefined) {
    // Scope the resource replay to the verified browser data and Node reader.
    assert.equal(
      binarySha256,
      'fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6'
    )
    assert.ok(isAbsolute(timezoneDirectory))
    assert.equal(process.versions.tz, '2026e')
    assert.deepEqual(
      readdirSync(timezoneDirectory).sort(),
      Object.keys(chromiumResources).sort()
    )
    for (const [name, digest] of Object.entries(chromiumResources)) {
      assert.equal(sha256(join(timezoneDirectory, name)), digest, name)
    }
  }
  const icuMajor = process.versions.icu.split('.')[0]
  assert.equal(process.config.variables.icu_small, false)
  if (
    binarySha256 ===
    'e237a2839d0cbdc9a9a2adda1a184afc0f5b20306ffbe923af5686550472d8a8'
  ) {
    assert.deepEqual(process.execArgv, [])
    assert.equal(process.config.variables.node_shared_icu, undefined)
    const addonPath = process.env.FORMATJS_TEMPORAL_ICU_AUDIT_ADDON
    assert.ok(
      addonPath && isAbsolute(addonPath),
      'Supply the absolute diagnostic addon path'
    )
    const addon = createRequire(import.meta.url)(addonPath)
    return {
      binarySha256,
      icuMajor,
      lib: {
        getFunction(name, signature) {
          addon.symbol(name)
          return (...args) =>
            addon.call(name, signature.return, signature.arguments, ...args)
        },
        getSymbol(name) {
          return addon.symbol(name)
        },
        close() {},
      },
      toString: addon.toString,
    }
  }
  assert.ok(
    [
      'fb48e77df2f8e92fedfec39afa60a5f41563441f6b61316ada5fb295a431c2c6',
      '19235a9b678f84729464c52623f92de130a165452747c6826d3fdc13df3abcc3',
    ].includes(binarySha256),
    'Unreviewed Node executable'
  )
  assert.deepEqual(process.execArgv, ['--experimental-ffi'])
  assert.equal(process.config.variables.icu_system, false)
  const {DynamicLibrary, toString} = await import('node:ffi')
  return {binarySha256, icuMajor, lib: new DynamicLibrary(null), toString}
}
