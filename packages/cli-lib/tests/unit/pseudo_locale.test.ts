import {generateXXLS} from '../../src/pseudo_locale'

describe('pseudo-locale: xx-LS', () => {
  it('works with messages that ends with a tag', () => {
    expect(generateXXLS('Foo <a>bar</a>')).toMatchSnapshot()
  })

  it('works with message that does not contain literal element', () => {
    expect(generateXXLS('{foo}')).toMatchSnapshot()
  })
})

describe('pseudo-locale: en-HA', () => {
  it('works with message that does not contain literal element', () => {
    expect(generateXXLS('{foo}')).toMatchSnapshot()
  })
})
