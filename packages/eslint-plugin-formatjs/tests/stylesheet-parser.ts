import type {Linter} from 'eslint'

function getLoc(text: string, index: number) {
  let line = 1
  let column = 0

  for (let i = 0; i < index; i++) {
    if (text[i] === '\n') {
      line++
      column = 0
    } else {
      column++
    }
  }

  return {line, column}
}

export const stylesheetParser: Linter.Parser = {
  parseForESLint(code) {
    return {
      ast: {
        type: 'Program',
        body: [],
        comments: [],
        sourceType: 'module',
        tokens: [],
        range: [0, code.length],
        loc: {
          start: {line: 1, column: 0},
          end: getLoc(code, code.length),
        },
      },
      services: {},
      scopeManager: null,
      visitorKeys: {
        Program: [],
      },
    }
  },
}
