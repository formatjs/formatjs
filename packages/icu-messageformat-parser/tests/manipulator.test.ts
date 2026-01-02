import {parse} from '../index.js'
import {hoistSelectors, isStructurallySame} from '../manipulator.js'
import {printAST} from '../printer.js'
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

// https://github.com/formatjs/formatjs/issues/4202
test('GH #4202: multiple plurals with hash placeholders', function () {
  const input =
    '{topicCount, plural, one {# topic} other {# topics}} and {noteCount, plural, one {# note} other {# notes}}'
  const result = printAST(hoistSelectors(parse(input)))

  // When hoisting multiple plurals, the outer plural's # is replaced with
  // explicit {variable, number} to avoid ambiguity with the inner plural's #
  // Expected: topicCount's # → {topicCount, number}, noteCount's # → # (innermost)
  expect(result).toBe(
    '{topicCount,plural,one{{noteCount,plural,one{{topicCount, number} topic and # note} other{{topicCount, number} topic and # notes}}} other{{noteCount,plural,one{{topicCount, number} topics and # note} other{{topicCount, number} topics and # notes}}}}'
  )
})

test('GH #4202: three plurals with hash placeholders', function () {
  const input =
    '{a, plural, one {# a} other {# as}}, {b, plural, one {# b} other {# bs}}, and {c, plural, one {# c} other {# cs}}'
  const result = printAST(hoistSelectors(parse(input)))

  // With 3 plurals, the nesting should be: a (outer) → b (middle) → c (inner)
  // a's # → {a, number}, b's # → {b, number}, c's # → # (innermost)
  // The structure creates a cartesian product: a×b×c options
  expect(result).toBe(
    '{a,plural,one{{b,plural,one{{c,plural,one{{a, number} a, {b, number} b, and # c} other{{a, number} a, {b, number} b, and # cs}}} other{{c,plural,one{{a, number} a, {b, number} bs, and # c} other{{a, number} a, {b, number} bs, and # cs}}}}} other{{b,plural,one{{c,plural,one{{a, number} as, {b, number} b, and # c} other{{a, number} as, {b, number} b, and # cs}}} other{{c,plural,one{{a, number} as, {b, number} bs, and # c} other{{a, number} as, {b, number} bs, and # cs}}}}}}'
  )
})
