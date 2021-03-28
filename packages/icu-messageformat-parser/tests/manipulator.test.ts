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
})

test('hoist some random case 1', function () {
  expect(
    printAST(
      hoistSelectors(
        parse(
          '{p1, plural, one{one {foo, select, bar{two} baz{three}} other{other} }}'
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
                } <b>dog</b>
            } 
            other{many dogs}} and {count, plural, 
                one{a {
                    gender, select, 
                        male{male} 
                        female{female} 
                    } <strong>cat</strong>
                } 
                other{many cats}}`)
      )
    )
  ).toMatchSnapshot()
})
