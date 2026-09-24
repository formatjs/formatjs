import type * as FsPromises from 'fs/promises'
import type * as Os from 'os'
import {mkdtemp, readFile, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import extractAndWrite, {extract} from '#packages/cli-lib/extract.js'

vi.mock('fs/promises', async importOriginal => ({
  ...(await importOriginal<typeof FsPromises>()),
  readFile: vi.fn(),
}))
vi.mock('os', async importOriginal => ({
  ...(await importOriginal<typeof Os>()),
  availableParallelism: () => 4,
}))

const actualFs = await vi.importActual<typeof FsPromises>('fs/promises')

describe('extract file reads', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-extract-reads-'))
    vi.mocked(readFile).mockImplementation(actualFs.readFile)
    vi.stubEnv('RAYON_NUM_THREADS', undefined)
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    await rm(tempDir, {recursive: true, force: true})
  })

  it.each([
    [undefined, 4],
    ['2', 2],
    ['1', 1],
    ['0', 4],
    ['-2', 4],
    ['1.5', 4],
    ['invalid', 4],
  ])('bounds reads with RAYON_NUM_THREADS=%s', async (threads, limit) => {
    vi.stubEnv('RAYON_NUM_THREADS', threads)
    const files = Array.from({length: 33}, (_, index) =>
      join(tempDir, `${index}.ts`)
    )
    let inFlight = 0
    let maxInFlight = 0
    vi.mocked(readFile).mockImplementation(async file => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise(resolve => setTimeout(resolve, 1))
      inFlight--
      if (maxInFlight > limit) {
        throw Object.assign(new Error('EMFILE'), {code: 'EMFILE'})
      }
      const id = files.indexOf(String(file))
      return `defineMessage({id: 'message.${id}', defaultMessage: 'Message ${id}'})`
    })

    const result = JSON.parse(await extract(files, {}))

    expect(maxInFlight).toBe(limit)
    expect(Object.keys(result)).toHaveLength(files.length)
    for (let index = 0; index < files.length; index++) {
      expect(result[`message.${index}`]).toEqual({
        defaultMessage: `Message ${index}`,
      })
    }
  })

  it.each([undefined, false, true])(
    'rejects EMFILE and preserves output with throws=%s',
    async throws => {
      const good = join(tempDir, 'good.ts')
      const bad = join(tempDir, 'bad.ts')
      const outFile = join(tempDir, 'messages.json')
      const previousCatalog = '{"previous":"Keep this catalog"}\n'
      await writeFile(
        good,
        "defineMessage({id: 'good', defaultMessage: 'Good'})"
      )
      await writeFile(outFile, previousCatalog)
      const error = Object.assign(
        new Error(`EMFILE: too many open files, open '${bad}'`),
        {
          code: 'EMFILE',
          path: bad,
        }
      )
      vi.mocked(readFile).mockImplementation((file, options) =>
        file === bad ? Promise.reject(error) : actualFs.readFile(file, options)
      )

      await expect(
        extractAndWrite([good, bad], {outFile, throws})
      ).rejects.toBe(error)
      expect(await actualFs.readFile(outFile, 'utf8')).toBe(previousCatalog)
    }
  )

  it('does not create output when an input cannot be read', async () => {
    const outFile = join(tempDir, 'messages.json')
    await expect(
      extractAndWrite([join(tempDir, 'missing.ts')], {outFile})
    ).rejects.toMatchObject({code: 'ENOENT'})
    await expect(actualFs.stat(outFile)).rejects.toMatchObject({code: 'ENOENT'})
  })

  it('preserves input order when reads complete out of order', async () => {
    const files = ['first.ts', 'last.ts']
    vi.spyOn(process.stderr, 'write').mockReturnValue(true)
    vi.mocked(readFile).mockImplementation(async file => {
      if (file === files[0])
        await new Promise(resolve => setTimeout(resolve, 10))
      return `defineMessage({id: 'duplicate', defaultMessage: '${file}'})`
    })
    expect(JSON.parse(await extract(files, {}))).toEqual({
      duplicate: {defaultMessage: 'last.ts'},
    })
  })
})
