import {parse} from '..'
import {hoistSelectors} from '../manipulator'
import {printAST} from '../printer'

test('should hoist 1 plural', function () {
  expect(
    printAST(
      hoistSelectors(
        parse('I have {count, plural, one{a dog} other{many dogs}}')
      )
    )
  ).toBe('{count,plural,one{I have a dog} other{I have many dogs}}')
  expect(() =>
    hoistSelectors(
      parse('I have <b>{count, plural, one{a dog} other{many dogs}}</b>')
    )
  ).toThrowError(
    'Cannot hoist plural/select within a tag element. Please put the tag element inside each plural/select option'
  )
})

test('hoist some random case 1', function () {
  expect(
    printAST(
      hoistSelectors(
        parse(
          '{p1, plural, one{one {foo, select, bar{two} baz{three} other{other}}} other{other}}'
        )
      )
    )
  ).toMatchSnapshot()
})

test('should hoist plural & select and tag', function () {
  expect(
    printAST(
      hoistSelectors(
        parse(`I have {count, plural, 
            one{a {
                gender, select, 
                    male{male} 
                    female{female} 
                    other{male}
                } <b>dog</b>
            } 
            other{many dogs}} and {count, plural, 
                one{a {
                    gender, select, 
                        male{male} 
                        female{female} 
                        other{male}
                    } <strong>cat</strong>
                } 
                other{many cats}}`)
      )
    )
  ).toMatchSnapshot()
})

test('should hoist 1 plural with number', function () {
  expect(
    printAST(
      hoistSelectors(
        parse(
          '{count, plural, one {{count, number} cat} other {{count, number} cats}}'
        )
      )
    )
  ).toBe('{count,plural,one{{count, number} cat} other{{count, number} cats}}')
})
