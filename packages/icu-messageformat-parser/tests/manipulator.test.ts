import {parse} from '..'
import {hoistSelectors, isStructurallySame} from '../manipulator'
import {printAST} from '../printer'
import {expect, test} from 'vitest'
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
  ).toBe(
    '{p1,plural,one{{foo,select,bar{one two} baz{one three} other{one other}}} other{other}}'
  )
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
  )
    .toBe(`{count,plural,one{{gender,select,male{{count,plural,one{{gender,select,male{I have a male <b>dog</b>
             and a male <strong>cat</strong>
                } female{I have a male <b>dog</b>
             and a female <strong>cat</strong>
                } other{I have a male <b>dog</b>
             and a male <strong>cat</strong>
                }}} other{I have a male <b>dog</b>
             and many cats}}} female{{count,plural,one{{gender,select,male{I have a female <b>dog</b>
             and a male <strong>cat</strong>
                } female{I have a female <b>dog</b>
             and a female <strong>cat</strong>
                } other{I have a female <b>dog</b>
             and a male <strong>cat</strong>
                }}} other{I have a female <b>dog</b>
             and many cats}}} other{{count,plural,one{{gender,select,male{I have a male <b>dog</b>
             and a male <strong>cat</strong>
                } female{I have a male <b>dog</b>
             and a female <strong>cat</strong>
                } other{I have a male <b>dog</b>
             and a male <strong>cat</strong>
                }}} other{I have a male <b>dog</b>
             and many cats}}}}} other{{count,plural,one{{gender,select,male{I have many dogs and a male <strong>cat</strong>
                } female{I have many dogs and a female <strong>cat</strong>
                } other{I have many dogs and a male <strong>cat</strong>
                }}} other{I have many dogs and many cats}}}}`)
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

test('structurally same plural', function () {
  expect(
    isStructurallySame(
      parse(
        '{count, plural, one {{count, number} cat} other {{count, number} cats}}'
      ),
      parse(
        '{count, plural, one {{count, number} foo} few{# cats} other {{count, number} bax}}'
      )
    )
  ).toEqual({
    success: true,
  })
})

test('structurally same plural mismatch element', function () {
  expect(
    isStructurallySame(
      parse(
        'some static string {count, plural, one {{count, number} cat} other {{count, number} cats}}'
      ),
      parse(
        '{count2, plural, one {{count, number} foo} other {{count, number} bax}}'
      )
    )
  ).toEqual({
    success: false,
    error: new Error(
      `Different number of variables: [count] vs [count2, count]`
    ),
  })
})

test('structurally same literal', function () {
  expect(isStructurallySame(parse('some static string'), parse('asd'))).toEqual(
    {
      success: true,
    }
  )
})
