import {describe, it, expect, beforeEach, afterEach} from 'vitest'
import {mkdtempSync, writeFileSync, mkdirSync, rmSync} from 'fs'
import {join} from 'path'
import {tmpdir} from 'os'
import {validatePackageExports, collectPaths} from './check_package_exports'

describe('collectPaths', () => {
  it('collects string values', () => {
    const paths: string[] = []
    collectPaths({'.': './index.js', './server': './server.js'}, v =>
      paths.push(v)
    )
    expect(paths).toEqual(['./index.js', './server.js'])
  })

  it('recurses into nested conditional exports', () => {
    const paths: string[] = []
    collectPaths(
      {
        '.': {
          types: './index.d.ts',
          import: './index.js',
          require: './index.cjs',
        },
      },
      v => paths.push(v)
    )
    expect(paths).toEqual(['./index.d.ts', './index.js', './index.cjs'])
  })

  it('handles empty object', () => {
    const paths: string[] = []
    collectPaths({}, v => paths.push(v))
    expect(paths).toEqual([])
  })
})

describe('validatePackageExports', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'pkg-exports-test-'))
  })

  afterEach(() => {
    rmSync(tmpDir, {recursive: true, force: true})
  })

  it('returns error when package.json is missing', () => {
    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('package.json not found')
  })

  it('passes when all exported files and declarations exist', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js', './server': './server.js'},
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')
    writeFileSync(join(tmpDir, 'server.js'), '')
    writeFileSync(join(tmpDir, 'server.d.ts'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('detects missing static export file', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js', './missing': './missing.js'},
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')

    const errors = validatePackageExports(tmpDir)
    expect(errors[0]).toContain("'./missing.js'")
  })

  it('detects missing .d.ts for .js export', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js'},
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    // index.d.ts is missing

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("missing declaration file './index.d.ts'")
  })

  it('passes with polyfill-style exports when declarations exist', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './index.js',
          './polyfill.js': './polyfill.js',
          './polyfill-force.js': './polyfill-force.js',
          './should-polyfill.js': './should-polyfill.js',
        },
      })
    )
    for (const name of [
      'index',
      'polyfill',
      'polyfill-force',
      'should-polyfill',
    ]) {
      writeFileSync(join(tmpDir, `${name}.js`), '')
      writeFileSync(join(tmpDir, `${name}.d.ts`), '')
    }

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('passes with wildcard directory when .js and .d.ts exist', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './index.js',
          './locale-data/*': './locale-data/*',
        },
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')
    mkdirSync(join(tmpDir, 'locale-data'))
    writeFileSync(join(tmpDir, 'locale-data', 'en.js'), '')
    writeFileSync(join(tmpDir, 'locale-data', 'en.d.ts'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('detects missing .d.ts in wildcard directory', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'./locale-data/*': './locale-data/*'},
      })
    )
    mkdirSync(join(tmpDir, 'locale-data'))
    writeFileSync(join(tmpDir, 'locale-data', 'en.js'), '')
    // en.d.ts is missing

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("missing declaration file 'en.d.ts'")
  })

  it('detects missing wildcard export directory', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'./locale-data/*': './locale-data/*'},
      })
    )

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('exported directory')
  })

  it('detects empty wildcard export directory', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'./locale-data/*': './locale-data/*'},
      })
    )
    mkdirSync(join(tmpDir, 'locale-data'))

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('is empty')
  })

  it('passes when directory export exists', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'./locale-data': './locale-data'},
      })
    )
    mkdirSync(join(tmpDir, 'locale-data'))

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('detects missing types file', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js'},
        types: 'index.d.ts',
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('detects missing types field file', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js'},
        types: 'types.d.ts',
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')
    // types.d.ts is missing

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("types file 'types.d.ts'")
  })

  it('passes with no exports field', () => {
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({name: 'test'}))
    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('handles conditional exports with nested objects', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': {
            types: './index.d.ts',
            import: './index.js',
          },
        },
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'index.d.ts'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('detects missing file in conditional exports', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': {
            types: './index.d.ts',
            import: './index.js',
          },
        },
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    // index.d.ts is missing — reported both as missing export path and missing .d.ts for .js

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain("'./index.d.ts'")
    expect(errors[1]).toContain("missing declaration file './index.d.ts'")
  })

  it('does not require .d.ts for non-.js exports', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.cjs'},
      })
    )
    writeFileSync(join(tmpDir, 'index.cjs'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('reports multiple errors at once', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './index.js',
          './server': './server.js',
        },
        types: 'types.d.ts',
      })
    )
    // All files missing

    const errors = validatePackageExports(tmpDir)
    // index.js missing, index.d.ts missing, server.js missing, server.d.ts missing, types.d.ts missing
    expect(errors).toHaveLength(5)
  })
})
