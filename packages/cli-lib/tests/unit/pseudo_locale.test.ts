import {generateXXLS} from '../../src/pseudo_locale'

describe.only('pseudo-locale: xx-LS', () => {
  it('works with messages that ends with a tag', () => {
    expect(generateXXLS('Foo <a>bar</a>')).toMatchSnapshot()
  })
})
