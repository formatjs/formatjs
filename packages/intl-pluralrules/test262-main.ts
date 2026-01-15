/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (
  Intl.PluralRules &&
  typeof Intl.PluralRules.__addLocaleData === 'function'
) {
  Intl.PluralRules.__addLocaleData(
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'af',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'other',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ak',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'am',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'an',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two', 'zero'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n % 100 >= 3 && n % 100 <= 10) return 'few'
            if (n % 100 >= 11 && n % 100 <= 99) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            one_two: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'other',
            other_other: 'other',
            other_two: 'other',
            two_few: 'few',
            two_many: 'many',
            two_other: 'other',
            zero_few: 'few',
            zero_many: 'many',
            zero_one: 'zero',
            zero_other: 'other',
            zero_two: 'zero',
          },
          ordinal: {},
        },
      },
      locale: 'ar',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two', 'zero'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n % 100 >= 3 && n % 100 <= 10) return 'few'
            if (n % 100 >= 11 && n % 100 <= 99) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
      },
      locale: 'ars',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 6) return 'many'
            if (n === 1 || n === 5 || n === 7 || n === 8 || n === 9 || n === 10)
              return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'as',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'asa',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ast',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (
              i % 10 === 3 ||
              i % 10 === 4 ||
              i % 1000 === 100 ||
              i % 1000 === 200 ||
              i % 1000 === 300 ||
              i % 1000 === 400 ||
              i % 1000 === 500 ||
              i % 1000 === 600 ||
              i % 1000 === 700 ||
              i % 1000 === 800 ||
              i % 1000 === 900
            )
              return 'few'
            if (
              i === 0 ||
              i % 10 === 6 ||
              i % 100 === 40 ||
              i % 100 === 60 ||
              i % 100 === 90
            )
              return 'many'
            if (
              i % 10 === 1 ||
              i % 10 === 2 ||
              i % 10 === 5 ||
              i % 10 === 7 ||
              i % 10 === 8 ||
              i % 100 === 20 ||
              i % 100 === 50 ||
              i % 100 === 70 ||
              i % 100 === 80
            )
              return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'az',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'bal',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['few', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (
              (n % 10 === 2 || n % 10 === 3) &&
              n % 100 !== 12 &&
              n % 100 !== 13
            )
              return 'few'
          } else {
            if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14))
              return 'few'
            if (
              n % 10 === 0 ||
              (n % 10 >= 5 && n % 10 <= 9) ||
              (n % 100 >= 11 && n % 100 <= 14)
            )
              return 'many'
            if (n % 10 === 1 && n % 100 !== 11) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_one: 'one',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'be',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'bem',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'bez',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'bg',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'bho',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'bm',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 6) return 'many'
            if (n === 1 || n === 5 || n === 7 || n === 8 || n === 9 || n === 10)
              return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'bn',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'bo',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (
              ((n % 10 >= 3 && n % 10 <= 4) || n % 10 === 9) &&
              (n % 100 < 10 || n % 100 > 19) &&
              (n % 100 < 70 || n % 100 > 79) &&
              (n % 100 < 90 || n % 100 > 99)
            )
              return 'few'
            if (n !== 0 && n % 1000000 === 0) return 'many'
            if (
              n % 10 === 1 &&
              n % 100 !== 11 &&
              n % 100 !== 71 &&
              n % 100 !== 91
            )
              return 'one'
            if (
              n % 10 === 2 &&
              n % 100 !== 12 &&
              n % 100 !== 72 &&
              n % 100 !== 92
            )
              return 'two'
          }
          return 'other'
        },
      },
      locale: 'br',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'brx',
    },
    {
      data: {
        categories: {cardinal: ['few', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 &&
                i % 10 >= 2 &&
                i % 10 <= 4 &&
                (i % 100 < 12 || i % 100 > 14)) ||
              (f % 10 >= 2 && f % 10 <= 4 && (f % 100 < 12 || f % 100 > 14))
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (f % 10 === 1 && f % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_one: 'one',
            few_other: 'other',
            one_few: 'few',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'bs',
    },
    {
      data: {
        categories: {
          cardinal: ['many', 'one', 'other'],
          ordinal: ['few', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 1 || n === 3) return 'one'
            if (n === 2) return 'two'
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ca',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ce',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 && (i === 1 || i === 2 || i === 3)) ||
              (v === 0 && i % 10 !== 4 && i % 10 !== 6 && i % 10 !== 9) ||
              (v !== 0 && f % 10 !== 4 && f % 10 !== 6 && f % 10 !== 9)
            )
              return 'one'
          }
          return 'other'
        },
      },
      locale: 'ceb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'cgg',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'chr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ckb',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i >= 2 && i <= 4 && v === 0) return 'few'
            if (v !== 0) return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'cs',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two', 'zero'],
          ordinal: ['few', 'many', 'one', 'other', 'two', 'zero'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 3 || n === 4) return 'few'
            if (n === 5 || n === 6) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
            if (n === 0 || n === 7 || n === 8 || n === 9) return 'zero'
          } else {
            if (n === 3) return 'few'
            if (n === 6) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_many: 'many',
            few_other: 'other',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            one_two: 'two',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
            other_two: 'two',
            two_few: 'few',
            two_many: 'many',
            two_other: 'other',
            zero_few: 'few',
            zero_many: 'many',
            zero_one: 'one',
            zero_other: 'other',
            zero_two: 'two',
          },
          ordinal: {},
        },
      },
      locale: 'cy',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const w = decimalPart.replace(/0+$/, '').length
          const t = w > 0 ? parseInt(decimalPart.replace(/0+$/, ''), 10) : 0
          if (isOrdinal) {
          } else {
            if (n === 1 || (t !== 0 && (i === 0 || i === 1))) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'da',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'de',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'doi',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 && i % 100 >= 3 && i % 100 <= 4) ||
              (f % 100 >= 3 && f % 100 <= 4)
            )
              return 'few'
            if ((v === 0 && i % 100 === 1) || f % 100 === 1) return 'one'
            if ((v === 0 && i % 100 === 2) || f % 100 === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'dsb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'dv',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'dz',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ee',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'el',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (n % 10 === 3 && n % 100 !== 13) return 'few'
            if (n % 10 === 1 && n % 100 !== 11) return 'one'
            if (n % 10 === 2 && n % 100 !== 12) return 'two'
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'en',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'eo',
    },
    {
      data: {
        categories: {cardinal: ['many', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'es',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'et',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'eu',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'other',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'fa',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || i === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ff',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'fi',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (
              (v === 0 && (i === 1 || i === 2 || i === 3)) ||
              (v === 0 && i % 10 !== 4 && i % 10 !== 6 && i % 10 !== 9) ||
              (v !== 0 && f % 10 !== 4 && f % 10 !== 6 && f % 10 !== 9)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'fil',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'fo',
    },
    {
      data: {
        categories: {
          cardinal: ['many', 'one', 'other'],
          ordinal: ['one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i === 0 || i === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'fr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'fur',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
      },
      locale: 'fy',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two'],
          ordinal: ['one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (n >= 3 && n <= 6) return 'few'
            if (n >= 7 && n <= 10) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_other: 'other',
            many_many: 'many',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            one_two: 'two',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
            other_two: 'two',
            two_few: 'few',
            two_many: 'many',
            two_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ga',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other', 'two'],
          ordinal: ['few', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 3 || n === 13) return 'few'
            if (n === 1 || n === 11) return 'one'
            if (n === 2 || n === 12) return 'two'
          } else {
            if ((n >= 3 && n <= 10) || (n >= 13 && n <= 19)) return 'few'
            if (n === 1 || n === 11) return 'one'
            if (n === 2 || n === 12) return 'two'
          }
          return 'other'
        },
      },
      locale: 'gd',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'gl',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'gsw',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 6) return 'many'
            if (n === 1) return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'gu',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'guw',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (
              v === 0 &&
              (i % 100 === 0 ||
                i % 100 === 20 ||
                i % 100 === 40 ||
                i % 100 === 60 ||
                i % 100 === 80)
            )
              return 'few'
            if (v !== 0) return 'many'
            if (v === 0 && i % 10 === 1) return 'one'
            if (v === 0 && i % 10 === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'gv',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ha',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'haw',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if ((i === 1 && v === 0) || (i === 0 && v !== 0)) return 'one'
            if (i === 2 && v === 0) return 'two'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            one_two: 'other',
            other_one: 'other',
            other_other: 'other',
            other_two: 'other',
            two_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'he',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 6) return 'many'
            if (n === 1) return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'hi',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'hnj',
    },
    {
      data: {
        categories: {cardinal: ['few', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 &&
                i % 10 >= 2 &&
                i % 10 <= 4 &&
                (i % 100 < 12 || i % 100 > 14)) ||
              (f % 10 >= 2 && f % 10 <= 4 && (f % 100 < 12 || f % 100 > 14))
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (f % 10 === 1 && f % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_one: 'one',
            few_other: 'other',
            one_few: 'few',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'hr',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 && i % 100 >= 3 && i % 100 <= 4) ||
              (f % 100 >= 3 && f % 100 <= 4)
            )
              return 'few'
            if ((v === 0 && i % 100 === 1) || f % 100 === 1) return 'one'
            if ((v === 0 && i % 100 === 2) || f % 100 === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'hsb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1 || n === 5) return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'hu',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (i === 0 || i === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'hy',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ia',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'id',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'ig',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'ii',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'io',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const w = decimalPart.replace(/0+$/, '').length
          const t = w > 0 ? parseInt(decimalPart.replace(/0+$/, ''), 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (t === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (t % 10 === 1 && t % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'is',
    },
    {
      data: {
        categories: {
          cardinal: ['many', 'one', 'other'],
          ordinal: ['many', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
            if (n === 11 || n === 8 || n === 80 || n === 800) return 'many'
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'it',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'iu',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'ja',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'jbo',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'jgo',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'jmc',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'jv',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'jw',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['many', 'one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
            if (
              i === 0 ||
              (i % 100 >= 2 && i % 100 <= 20) ||
              i % 100 === 40 ||
              i % 100 === 60 ||
              i % 100 === 80
            )
              return 'many'
            if (i === 1) return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'one',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ka',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || i === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'kab',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'kaj',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'kcg',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'kde',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'kea',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n % 10 === 6 || n % 10 === 9 || (n % 10 === 0 && n !== 0))
              return 'many'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'kk',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'kkj',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'kl',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'km',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'kn',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'ko',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ks',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ksb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'zero'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
      },
      locale: 'ksh',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ku',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two', 'zero'],
          ordinal: ['many', 'one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 5 || n % 100 === 5) return 'many'
            if (
              (n >= 1 && n <= 4) ||
              (n % 100 >= 1 && n % 100 <= 4) ||
              (n % 100 >= 21 && n % 100 <= 24) ||
              (n % 100 >= 41 && n % 100 <= 44) ||
              (n % 100 >= 61 && n % 100 <= 64) ||
              (n % 100 >= 81 && n % 100 <= 84)
            )
              return 'one'
          } else {
            if (
              n % 100 === 3 ||
              n % 100 === 23 ||
              n % 100 === 43 ||
              n % 100 === 63 ||
              n % 100 === 83
            )
              return 'few'
            if (
              n !== 1 &&
              (n % 100 === 1 ||
                n % 100 === 21 ||
                n % 100 === 41 ||
                n % 100 === 61 ||
                n % 100 === 81)
            )
              return 'many'
            if (n === 1) return 'one'
            if (
              n % 100 === 2 ||
              n % 100 === 22 ||
              n % 100 === 42 ||
              n % 100 === 62 ||
              n % 100 === 82 ||
              (n % 1000 === 0 &&
                ((n % 100000 >= 1000 && n % 100000 <= 20000) ||
                  n % 100000 === 40000 ||
                  n % 100000 === 60000 ||
                  n % 100000 === 80000)) ||
              (n !== 0 && n % 1000000 === 100000)
            )
              return 'two'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
      },
      locale: 'kw',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ky',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'zero'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if ((i === 0 || i === 1) && n !== 0) return 'one'
            if (n === 0) return 'zero'
          }
          return 'other'
        },
      },
      locale: 'lag',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'lb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'lg',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (
              n === 11 ||
              n === 8 ||
              (n >= 80 && n <= 89) ||
              (n >= 800 && n <= 899)
            )
              return 'many'
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'lij',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'lkt',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ln',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
          }
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'lo',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 11 || n % 100 > 19))
              return 'few'
            if (f !== 0) return 'many'
            if (n % 10 === 1 && (n % 100 < 11 || n % 100 > 19)) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_one: 'one',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'lt',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'zero'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (n % 10 === 1 && n % 100 !== 11) ||
              (v === 2 && f % 10 === 1 && f % 100 !== 11) ||
              (v !== 2 && f % 10 === 1)
            )
              return 'one'
            if (
              n % 10 === 0 ||
              (n % 100 >= 11 && n % 100 <= 19) ||
              (v === 2 && f % 100 >= 11 && f % 100 <= 19)
            )
              return 'zero'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            one_zero: 'other',
            other_one: 'one',
            other_other: 'other',
            other_zero: 'other',
            zero_one: 'one',
            zero_other: 'other',
            zero_zero: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'lv',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'mas',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'mg',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'mgo',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
            if (
              (i % 10 === 7 || i % 10 === 8) &&
              i % 100 !== 17 &&
              i % 100 !== 18
            )
              return 'many'
            if (i % 10 === 1 && i % 100 !== 11) return 'one'
            if (i % 10 === 2 && i % 100 !== 12) return 'two'
          } else {
            if (
              (v === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (f % 10 === 1 && f % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'other',
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'mk',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ml',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'mn',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other'],
          ordinal: ['one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (
              v !== 0 ||
              n === 0 ||
              (n !== 1 && n % 100 >= 1 && n % 100 <= 19)
            )
              return 'few'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
      },
      locale: 'mo',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 1) return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'mr',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
          }
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'ms',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 0 || (n % 100 >= 3 && n % 100 <= 10)) return 'few'
            if (n % 100 >= 11 && n % 100 <= 19) return 'many'
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'mt',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'my',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nah',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'naq',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'nb',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nd',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n >= 1 && n <= 4) return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ne',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'nl',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nn',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nnh',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'no',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'nqo',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nso',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ny',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'nyn',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'om',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['few', 'many', 'one', 'other', 'two'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 4) return 'few'
            if (n === 6) return 'many'
            if (n === 1 || n === 5 || (n >= 7 && n <= 9)) return 'one'
            if (n === 2 || n === 3) return 'two'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'other',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'or',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'os',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'osa',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'pa',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'pap',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'pcm',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (
              v === 0 &&
              i % 10 >= 2 &&
              i % 10 <= 4 &&
              (i % 100 < 12 || i % 100 > 14)
            )
              return 'few'
            if (
              (v === 0 && i !== 1 && i % 10 >= 0 && i % 10 <= 1) ||
              (v === 0 && i % 10 >= 5 && i % 10 <= 9) ||
              (v === 0 && i % 100 >= 12 && i % 100 <= 14)
            )
              return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'pl',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'zero'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (n % 10 === 1 && n % 100 !== 11) ||
              (v === 2 && f % 10 === 1 && f % 100 !== 11) ||
              (v !== 2 && f % 10 === 1)
            )
              return 'one'
            if (
              n % 10 === 0 ||
              (n % 100 >= 11 && n % 100 <= 19) ||
              (v === 2 && f % 100 >= 11 && f % 100 <= 19)
            )
              return 'zero'
          }
          return 'other'
        },
      },
      locale: 'prg',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'ps',
    },
    {
      data: {
        categories: {cardinal: ['many', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
      },
      locale: 'pt-PT',
    },
    {
      data: {
        categories: {cardinal: ['many', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i >= 0 && i <= 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'pt',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'rm',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other'],
          ordinal: ['one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (
              v !== 0 ||
              n === 0 ||
              (n !== 1 && n % 100 >= 1 && n % 100 <= 19)
            )
              return 'few'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_one: 'few',
            few_other: 'other',
            one_few: 'few',
            one_other: 'other',
            other_few: 'few',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ro',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'rof',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (
              v === 0 &&
              i % 10 >= 2 &&
              i % 10 <= 4 &&
              (i % 100 < 12 || i % 100 > 14)
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 0) ||
              (v === 0 && i % 10 >= 5 && i % 10 <= 9) ||
              (v === 0 && i % 100 >= 11 && i % 100 <= 14)
            )
              return 'many'
            if (v === 0 && i % 10 === 1 && i % 100 !== 11) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_one: 'one',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ru',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'rwk',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'sah',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'saq',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'sat',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (n === 11 || n === 8 || n === 80 || n === 800) return 'many'
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sc',
    },
    {
      data: {
        categories: {
          cardinal: ['many', 'one', 'other'],
          ordinal: ['many', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const e = 0
          if (isOrdinal) {
            if (
              n === 11 ||
              n === 8 ||
              (n >= 80 && n <= 89) ||
              (n >= 800 && n <= 899)
            )
              return 'many'
          } else {
            if (
              (e === 0 && i !== 0 && i % 1000000 === 0 && v === 0) ||
              e < 0 ||
              e > 5
            )
              return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'scn',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'other',
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sd',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'sdh',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'se',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'seh',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'ses',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'sg',
    },
    {
      data: {
        categories: {cardinal: ['few', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 &&
                i % 10 >= 2 &&
                i % 10 <= 4 &&
                (i % 100 < 12 || i % 100 > 14)) ||
              (f % 10 >= 2 && f % 10 <= 4 && (f % 100 < 12 || f % 100 > 14))
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (f % 10 === 1 && f % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
      },
      locale: 'sh',
    },
    {
      data: {
        categories: {cardinal: ['few', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (n >= 2 && n <= 10) return 'few'
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'shi',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (n === 0 || n === 1 || (i === 0 && f === 1)) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_one: 'one',
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'si',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i >= 2 && i <= 4 && v === 0) return 'few'
            if (v !== 0) return 'many'
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sk',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'one', 'other', 'two'],
          ordinal: ['other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if ((v === 0 && i % 100 >= 3 && i % 100 <= 4) || v !== 0)
              return 'few'
            if (v === 0 && i % 100 === 1) return 'one'
            if (v === 0 && i % 100 === 2) return 'two'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_one: 'few',
            few_other: 'other',
            few_two: 'two',
            one_few: 'few',
            one_one: 'few',
            one_other: 'other',
            one_two: 'two',
            other_few: 'few',
            other_one: 'few',
            other_other: 'other',
            other_two: 'two',
            two_few: 'few',
            two_one: 'few',
            two_other: 'other',
            two_two: 'two',
          },
          ordinal: {},
        },
      },
      locale: 'sl',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'sma',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'smi',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'smj',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'smn',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other', 'two'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
            if (n === 2) return 'two'
          }
          return 'other'
        },
      },
      locale: 'sms',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'sn',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'so',
    },
    {
      data: {
        categories: {
          cardinal: ['one', 'other'],
          ordinal: ['many', 'one', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n % 10 === 4 && n % 100 !== 14) return 'many'
            if (n === 1) return 'one'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sq',
    },
    {
      data: {
        categories: {cardinal: ['few', 'one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
          } else {
            if (
              (v === 0 &&
                i % 10 >= 2 &&
                i % 10 <= 4 &&
                (i % 100 < 12 || i % 100 > 14)) ||
              (f % 10 >= 2 && f % 10 <= 4 && (f % 100 < 12 || f % 100 > 14))
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 1 && i % 100 !== 11) ||
              (f % 10 === 1 && f % 100 !== 11)
            )
              return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_one: 'one',
            few_other: 'other',
            one_few: 'few',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ss',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ssy',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'st',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'su',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (
              (n % 10 === 1 || n % 10 === 2) &&
              n % 100 !== 11 &&
              n % 100 !== 12
            )
              return 'one'
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sv',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'sw',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'syr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ta',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'te',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'teo',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'th',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ti',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'tig',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['few', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n % 10 === 6 || n % 10 === 9 || n === 10) return 'few'
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'tk',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          const f = v > 0 ? parseInt(decimalPart, 10) : 0
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
            if (
              (v === 0 && (i === 1 || i === 2 || i === 3)) ||
              (v === 0 && i % 10 !== 4 && i % 10 !== 6 && i % 10 !== 9) ||
              (v !== 0 && f % 10 !== 4 && f % 10 !== 6 && f % 10 !== 9)
            )
              return 'one'
          }
          return 'other'
        },
      },
      locale: 'tl',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'tn',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'to',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'tpi',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'tr',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'ts',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if ((n >= 0 && n <= 1) || (n >= 11 && n <= 99)) return 'one'
          }
          return 'other'
        },
      },
      locale: 'tzm',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ug',
    },
    {
      data: {
        categories: {
          cardinal: ['few', 'many', 'one', 'other'],
          ordinal: ['few', 'other'],
        },
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
            if (n % 10 === 3 && n % 100 !== 13) return 'few'
          } else {
            if (
              v === 0 &&
              i % 10 >= 2 &&
              i % 10 <= 4 &&
              (i % 100 < 12 || i % 100 > 14)
            )
              return 'few'
            if (
              (v === 0 && i % 10 === 0) ||
              (v === 0 && i % 10 >= 5 && i % 10 <= 9) ||
              (v === 0 && i % 100 >= 11 && i % 100 <= 14)
            )
              return 'many'
            if (v === 0 && i % 10 === 1 && i % 100 !== 11) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            few_few: 'few',
            few_many: 'many',
            few_one: 'one',
            few_other: 'other',
            many_few: 'few',
            many_many: 'many',
            many_one: 'one',
            many_other: 'other',
            one_few: 'few',
            one_many: 'many',
            one_one: 'one',
            one_other: 'other',
            other_few: 'few',
            other_many: 'many',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'uk',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'und',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'other',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'ur',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {
            one_other: 'other',
            other_one: 'one',
            other_other: 'other',
          },
          ordinal: {},
        },
      },
      locale: 'uz',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 've',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['one', 'other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
            if (n === 1) return 'one'
          } else {
          }
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'vi',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'vo',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'vun',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n >= 0 && n <= 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'wa',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'wae',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'wo',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'xh',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          if (isOrdinal) {
          } else {
            if (n === 1) return 'one'
          }
          return 'other'
        },
      },
      locale: 'xog',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          const v = decimalPart.length
          if (isOrdinal) {
          } else {
            if (i === 1 && v === 0) return 'one'
          }
          return 'other'
        },
      },
      locale: 'yi',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
      },
      locale: 'yo',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'yue',
    },
    {
      data: {
        categories: {cardinal: ['other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          return 'other'
        },
        pluralRanges: {cardinal: {other_other: 'other'}, ordinal: {}},
      },
      locale: 'zh',
    },
    {
      data: {
        categories: {cardinal: ['one', 'other'], ordinal: ['other']},
        fn: function anonymous(num, isOrdinal) {
          const numStr = String(num)
          const parts = numStr.split('.')
          const integerPart = parts[0]
          const decimalPart = parts[1] || ''
          const n = Math.abs(parseFloat(numStr))
          const i = Math.floor(Math.abs(parseFloat(integerPart)))
          if (isOrdinal) {
          } else {
            if (i === 0 || n === 1) return 'one'
          }
          return 'other'
        },
        pluralRanges: {
          cardinal: {one_one: 'one', one_other: 'other', other_other: 'other'},
          ordinal: {},
        },
      },
      locale: 'zu',
    }
  )
}
