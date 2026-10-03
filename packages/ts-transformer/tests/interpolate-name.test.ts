import {interpolateName} from '#packages/ts-transformer/interpolate-name'
import {createHash} from 'crypto'
import {describe, it, expect} from 'vitest'
describe('interpolateName', function () {
  it('should match native base64', function () {
    const hasher = createHash('sha1')
    const content = 'foo#bar'
    hasher.update(content)
    expect(
      interpolateName({}, '[sha1:contenthash:base64:6]', {
        content,
      })
    ).toBe(hasher.digest('base64').slice(0, 6))
  })
  it('should match native base64url', function () {
    const hasher = createHash('sha1')
    const content = 'foo#bar'
    hasher.update(content)
    expect(
      interpolateName({}, '[sha1:contenthash:base64url:6]', {
        content,
      })
    ).toBe(hasher.digest('base64url').slice(0, 6))
  })
  it('should not interpolate placeholders inside the resource path', function () {
    expect(
      interpolateName({resourcePath: 'src/[path].tsx'}, '[name]', {
        content: 'foo',
      })
    ).toBe('[path]')
  })
  it('should interpolate placeholders inside unmatched brackets', function () {
    expect(
      interpolateName({resourcePath: 'src/a.ts'}, '[[name]] [x[ext]', {
        content: 'foo',
      })
    ).toBe('[a] [xts')
  })
  it('should only interpolate valid regExp group indexes', function () {
    expect(
      interpolateName(
        {resourcePath: 'src/a.ts'},
        '[0]-[1]-[2]-[-1]-[1.5]-[01]',
        {content: 'foo', regExp: /(a)/}
      )
    ).toBe('a-a-[2]-[-1]-[1.5]-[01]')
  })
  it('should interpolate raw content', function () {
    expect(
      interpolateName({resourcePath: 'src/a.ts'}, '[content]', {
        content: 'foo#bar',
      })
    ).toBe('foo#bar')
  })
  it('should not interpolate placeholders inside content', function () {
    expect(
      interpolateName({resourcePath: 'src/a.ts'}, '[name]:[CONTENT]', {
        content: 'Click [name] or [hash:5]',
      })
    ).toBe('a:Click [name] or [hash:5]')
  })
  it('should not interpolate [content] inside the resource path', function () {
    expect(
      interpolateName({resourcePath: 'app/[content]/page.tsx'}, '[folder]', {
        content: 'foo',
      })
    ).toBe('[content]')
  })
  it('should combine content, file, and hash placeholders', function () {
    const hasher = createHash('sha512')
    hasher.update('foo')
    expect(
      interpolateName(
        {resourcePath: 'src/a.ts'},
        '[name].[ext]_[content]_[sha512:contenthash:base64:6]',
        {content: 'foo'}
      )
    ).toBe(`a.ts_foo_${hasher.digest('base64').slice(0, 6)}`)
  })
})
