import {
  generateXXAC,
  generateXXHA,
  generateXXLS,
  generateENXA,
  generateENXB,
} from '../../src/pseudo_locale'

const pseudoLocales = [
  {name: 'en-LS', generate: generateXXLS},
  {name: 'en-AC', generate: generateXXAC},
  {name: 'en-HA', generate: generateXXHA},
  {name: 'en-XA', generate: generateENXA},
  {name: 'en-XB', generate: generateENXB},
]

for (const {name, generate} of pseudoLocales) {
  describe(`pseudo-locale ${name}`, () => {
    it('works with a string literal', () => {
      expect(generate('Find Help Online')).toMatchSnapshot()
    })

    it('works with message that does not start with a literal element', () => {
      expect(generate('{foo} bar')).toMatchSnapshot()
    })

    it('works with a message that starts with a literal element', () => {
      expect(generate('foo {bar}')).toMatchSnapshot()
    })

    it('works with a message that has a plural element', () => {
      expect(
        generate('foo {bar, plural, =1 {1 bar} other {# bars}}')
      ).toMatchSnapshot()
    })

    it('works with messages that ends with a tag', () => {
      expect(generate('Foo <a>bar</a>')).toMatchSnapshot()
    })

    it('works with message that does not contain a literal element', () => {
      expect(generate('{foo}')).toMatchSnapshot()
    })
  })
}
