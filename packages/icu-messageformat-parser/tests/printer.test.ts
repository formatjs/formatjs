import {parse} from '..'
import {printAST} from '../printer'

test('should escape things properly', function () {
  expect(printAST(parse("Name: ''{name}''."))).toBe("Name: ''{name}''.")
  expect(printAST(parse("'just some {name} thing'"))).toBe(
    "'just some {name} thing'"
  )
  expect(
    printAST(
      parse(
        "Peter's brother {name1} is taller than {name} who is Peter's friend."
      )
    )
  ).toBe("Peter's brother {name1} is taller than {name} who is Peter's friend.")
})
