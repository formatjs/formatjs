import {mkdtemp, rm, writeFile} from 'fs/promises'
import {tmpdir} from 'os'
import {join} from 'path'
import {afterEach, describe, expect, it} from 'vitest'
import {extract} from '#packages/cli-lib/extract.js'

describe('extract', () => {
  let tempDir: string | undefined

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, {recursive: true, force: true})
      tempDir = undefined
    }
  })

  it('extracts messages wrapped in TypeScript assertions', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'typeAssertions.tsx')
    await writeFile(
      filePath,
      `
type DefaultMessage = string
type MessageDescriptor = {id: string; defaultMessage: string}

intl.formatMessage({
  id: 'format.satisfies',
  defaultMessage: \`Format satisfies\` satisfies DefaultMessage,
})

intl.formatMessage({
  id: 'format.as',
  defaultMessage: 'Format as' as DefaultMessage,
})

defineMessage({
  id: 'define.object.satisfies',
  defaultMessage: 'Define object satisfies',
} satisfies MessageDescriptor)
`
    )

    const result = JSON.parse(await extract([filePath], {throws: true}))

    expect(result).toEqual({
      'define.object.satisfies': {
        defaultMessage: 'Define object satisfies',
      },
      'format.as': {
        defaultMessage: 'Format as',
      },
      'format.satisfies': {
        defaultMessage: 'Format satisfies',
      },
    })
  })

  it('extracts vue-intl $t calls from Vue SFCs', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'App.vue')
    await writeFile(
      filePath,
      `
<template>
  <p>{{ $t('template.title') }}</p>
  <button :title="$t('button.title')" />
</template>

<script>
export default {
  mounted() {
    this.$t('script.ready')
  },
}
</script>
`
    )

    const result = JSON.parse(await extract([filePath], {throws: true}))

    expect(result).toEqual({
      'button.title': {},
      'script.ready': {},
      'template.title': {},
    })
  })

  it('uses the native binding for supported extraction options', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'formatjs-cli-lib-'))
    const filePath = join(tempDir, 'native.ts')
    const nativePath = join(tempDir, 'native.cjs')
    const previousNativePath = process.env.FORMATJS_CLI_LIB_NATIVE_PATH

    await writeFile(
      filePath,
      `defineMessage({id: 'native', defaultMessage: 'Native'})`
    )
    await writeFile(
      nativePath,
      `
module.exports = {
  extract(files, opts) {
    return JSON.stringify({files, opts})
  },
  compile() {
    return '{}'
  },
  compileMessages() {
    return '{}'
  },
  supportedBuiltinFormatters() {
    return []
  },
}
`
    )

    process.env.FORMATJS_CLI_LIB_NATIVE_PATH = nativePath
    try {
      const result = JSON.parse(
        await extract([filePath], {
          additionalFunctionNames: ['t'],
          flatten: true,
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          preserveWhitespace: true,
          throws: true,
        })
      )

      expect(result).toEqual({
        files: [filePath],
        opts: {
          additionalComponentNames: ['$formatMessage'],
          additionalFunctionNames: ['t'],
          flatten: true,
          idInterpolationPattern: '[sha512:contenthash:base64:6]',
          preserveWhitespace: true,
          throws: true,
        },
      })
    } finally {
      if (previousNativePath === undefined) {
        delete process.env.FORMATJS_CLI_LIB_NATIVE_PATH
      } else {
        process.env.FORMATJS_CLI_LIB_NATIVE_PATH = previousNativePath
      }
    }
  })
})
