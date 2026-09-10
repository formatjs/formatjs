/*---
description: bare assertion failure retains its host diagnostic
---*/
class Test262Error {
  message = ''
  toString() {
    return 'Test262Error: '
  }
}
throw new Test262Error()
