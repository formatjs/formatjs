import {type BinaryToTextEncoding, createHash} from 'crypto'
import * as path from 'path'
export interface LoaderContext {
  resourceQuery?: string
  resourcePath?: string
  options?: {
    customInterpolateName(
      this: LoaderContext,
      url: string,
      name: string | NameFn,
      options: Options
    ): string
  }
}

export interface Options {
  context?: string
  content?: string
  regExp?: RegExp
}

export type NameFn = (resourcePath?: string, resourceQuery?: string) => string

function getHashDigest(
  content: string,
  hashType = 'md5',
  digestType: BinaryToTextEncoding = 'hex',
  length = 9999
) {
  const hasher = createHash(hashType)
  hasher.update(content)
  return hasher.digest(digestType).slice(0, length)
}

export function interpolateName(
  loaderContext: LoaderContext,
  name: string | NameFn,
  options: Options
): string {
  let filename

  const hasQuery =
    loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1

  if (typeof name === 'function') {
    filename = name(
      loaderContext.resourcePath,
      hasQuery ? loaderContext.resourceQuery : undefined
    )
  } else {
    filename = name || '[hash].[ext]'
  }

  const context = options.context
  const content = options.content
  const regExp = options.regExp

  let ext = 'bin'
  let basename = 'file'
  let directory = ''
  let folder = ''
  let query = ''

  if (loaderContext.resourcePath) {
    const parsed = path.parse(loaderContext.resourcePath)
    let resourcePath = loaderContext.resourcePath

    if (parsed.ext) {
      ext = parsed.ext.slice(1)
    }

    if (parsed.dir) {
      basename = parsed.name
      resourcePath = parsed.dir + path.sep
    }

    if (typeof context !== 'undefined') {
      directory = path
        .relative(context, resourcePath + '_')
        .replace(/\\/g, '/')
        .replace(/\.\.(\/)?/g, '_$1')
      directory = directory.slice(0, -1)
    } else {
      directory = resourcePath.replace(/\\/g, '/').replace(/\.\.(\/)?/g, '_$1')
    }

    if (directory.length === 1) {
      directory = ''
    } else if (directory.length > 1) {
      folder = path.basename(directory)
    }
  }

  if (loaderContext.resourceQuery && loaderContext.resourceQuery.length > 1) {
    query = loaderContext.resourceQuery

    const hashIdx = query.indexOf('#')

    if (hashIdx >= 0) {
      query = query.slice(0, hashIdx)
    }
  }

  const regExpMatch =
    regExp && loaderContext.resourcePath
      ? loaderContext.resourcePath.match(new RegExp(regExp))
      : null

  // Substitute every placeholder in a single pass so that substituted values
  // (such as file paths) are never interpolated again.
  let url = filename.replace(/\[([^[\]]*)\]/g, (placeholder, token: string) => {
    if (content) {
      // `hash` and `contenthash` are same in `loader-utils` context
      // let's keep `hash` for backward compatibility
      const hashMatch =
        /^(?:([^:]+):)?(?:hash|contenthash)(?::([a-z]+\d*[a-z]*))?(?::(\d+))?$/i.exec(
          token
        )
      if (hashMatch) {
        const [, hashType, digestType, maxLength] = hashMatch
        return getHashDigest(
          content,
          hashType,
          digestType as BinaryToTextEncoding,
          parseInt(maxLength, 10)
        )
      }
    }

    switch (token.toLowerCase()) {
      case 'ext':
        return ext
      case 'name':
        return basename
      case 'path':
        return directory
      case 'folder':
        return folder
      case 'query':
        return query
    }

    const index = Number(token)
    if (
      regExpMatch &&
      Number.isInteger(index) &&
      index >= 0 &&
      String(index) === token &&
      index < regExpMatch.length
    ) {
      return regExpMatch[index]
    }

    return placeholder
  })

  if (
    typeof loaderContext.options === 'object' &&
    typeof loaderContext.options.customInterpolateName === 'function'
  ) {
    url = loaderContext.options.customInterpolateName.call(
      loaderContext,
      url,
      name,
      options
    )
  }

  return url
}
