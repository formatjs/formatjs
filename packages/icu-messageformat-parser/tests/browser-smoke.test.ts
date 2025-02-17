import {Parser} from '../parser'
import {describe, expect, it} from 'vitest'
describe('@formatjs/icu-messageformat-parser', function () {
  it('plural_arg_2', () => {
    expect(
      new Parser(`
    You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
    }.`).parse()
    ).toEqual({
      err: null,
      val: [
        {
          location: {
            end: {
              column: 14,
              line: 2,
              offset: 14,
            },
            start: {
              column: 1,
              line: 1,
              offset: 0,
            },
          },
          type: 0,
          value: `
    You have `,
        },
        {
          location: {
            end: {
              column: 6,
              line: 6,
              offset: 116,
            },
            start: {
              column: 14,
              line: 2,
              offset: 14,
            },
          },
          offset: 0,
          options: {
            '=0': {
              location: {
                end: {
                  column: 22,
                  line: 3,
                  offset: 55,
                },
                start: {
                  column: 12,
                  line: 3,
                  offset: 45,
                },
              },
              value: [
                {
                  location: {
                    end: {
                      column: 21,
                      line: 3,
                      offset: 54,
                    },
                    start: {
                      column: 13,
                      line: 3,
                      offset: 46,
                    },
                  },
                  type: 0,
                  value: 'no items',
                },
              ],
            },
            one: {
              location: {
                end: {
                  column: 21,
                  line: 4,
                  offset: 76,
                },
                start: {
                  column: 13,
                  line: 4,
                  offset: 68,
                },
              },
              value: [
                {
                  location: {
                    end: {
                      column: 20,
                      line: 4,
                      offset: 75,
                    },
                    start: {
                      column: 14,
                      line: 4,
                      offset: 69,
                    },
                  },
                  type: 0,
                  value: '1 item',
                },
              ],
            },
            other: {
              location: {
                end: {
                  column: 34,
                  line: 5,
                  offset: 110,
                },
                start: {
                  column: 15,
                  line: 5,
                  offset: 91,
                },
              },
              value: [
                {
                  location: {
                    end: {
                      column: 27,
                      line: 5,
                      offset: 103,
                    },
                    start: {
                      column: 16,
                      line: 5,
                      offset: 92,
                    },
                  },
                  type: 1,
                  value: 'itemCount',
                },
                {
                  location: {
                    end: {
                      column: 33,
                      line: 5,
                      offset: 109,
                    },
                    start: {
                      column: 27,
                      line: 5,
                      offset: 103,
                    },
                  },
                  type: 0,
                  value: ' items',
                },
              ],
            },
          },
          pluralType: 'cardinal',
          type: 6,
          value: 'itemCount',
        },
        {
          location: {
            end: {
              column: 7,
              line: 6,
              offset: 117,
            },
            start: {
              column: 6,
              line: 6,
              offset: 116,
            },
          },
          type: 0,
          value: '.',
        },
      ],
    })
  })
})
