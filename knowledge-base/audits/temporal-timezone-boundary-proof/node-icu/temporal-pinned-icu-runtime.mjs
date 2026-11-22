import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {endianness} from 'node:os'
import {isAbsolute} from 'node:path'

export async function loadPinnedIcu() {
  assert.equal(endianness(), 'LE', 'UChar buffers require little endian')
  assert.equal(process.platform, 'linux')
  assert.equal(process.arch, 'x64')
  for (const name of [
    'NODE_ICU_DATA',
    'ICU_DATA',
    'ICU_TIMEZONE_FILES_DIR',
    'NODE_OPTIONS',
    'LD_PRELOAD',
    'LD_LIBRARY_PATH',
  ]) {
    assert.equal(process.env[name], undefined, name)
  }
  const binarySha256 = createHash('sha256')
    .update(readFileSync(process.execPath))
    .digest('hex')
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
