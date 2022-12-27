import {generateXXHA, generateXXLS} from '../../src/pseudo_locale'

describe('pseudo-locale: xx-LS', () => {
  it('works with messages that ends with a tag', () => {
    expect(generateXXLS('Foo <a>bar</a>')).toMatchSnapshot()
  })

  it('works with message that does not contain literal element', () => {
    expect(generateXXLS('{foo} bar')).toMatchSnapshot()
  })
})

describe('pseudo-locale: en-HA', () => {
  it('works with message that does not start with a literal element', () => {
    expect(generateXXHA('{foo} bar')).toMatchSnapshot()
  })

  it('works with a message that starts with a literal element', () => {
    expect(generateXXHA('foo {bar}')).toMatchSnapshot()
  })
})
