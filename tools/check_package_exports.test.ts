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

  it('passes when all exported files exist', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {'.': './index.js', './server': './server.js'},
      })
    )
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'server.js'), '')

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

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("'./missing.js'")
  })

  it('passes with polyfill-style exports', () => {
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
    writeFileSync(join(tmpDir, 'index.js'), '')
    writeFileSync(join(tmpDir, 'polyfill.js'), '')
    writeFileSync(join(tmpDir, 'polyfill-force.js'), '')
    writeFileSync(join(tmpDir, 'should-polyfill.js'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
  })

  it('passes with wildcard export directory containing files', () => {
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
    mkdirSync(join(tmpDir, 'locale-data'))
    writeFileSync(join(tmpDir, 'locale-data', 'en.js'), '')

    expect(validatePackageExports(tmpDir)).toEqual([])
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

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("types file 'index.d.ts'")
  })

  it('passes when types file exists', () => {
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
    // index.d.ts is missing

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain("'./index.d.ts'")
  })

  it('reports multiple errors at once', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({
        exports: {
          '.': './index.js',
          './server': './server.js',
        },
        types: 'index.d.ts',
      })
    )
    // All files missing

    const errors = validatePackageExports(tmpDir)
    expect(errors).toHaveLength(3)
  })
})
