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
        af: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['af'],
    },
    {
      data: {
        ak: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ak'],
    },
    {
      data: {
        am: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['am'],
    },
    {
      data: {
        an: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['an'],
    },
    {
      data: {
        ar: {
          categories: {
            cardinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2);
            if (ord) return 'other';
            return n == 0
              ? 'zero'
              : n == 1
              ? 'one'
              : n == 2
              ? 'two'
              : n100 >= 3 && n100 <= 10
              ? 'few'
              : n100 >= 11 && n100 <= 99
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['ar'],
    },
    {
      data: {
        ars: {
          categories: {
            cardinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2);
            if (ord) return 'other';
            return n == 0
              ? 'zero'
              : n == 1
              ? 'one'
              : n == 2
              ? 'two'
              : n100 >= 3 && n100 <= 10
              ? 'few'
              : n100 >= 11 && n100 <= 99
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['ars'],
    },
    {
      data: {
        as: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : n == 6
                ? 'many'
                : 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['as'],
    },
    {
      data: {
        asa: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['asa'],
    },
    {
      data: {
        ast: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ast'],
    },
    {
      data: {
        az: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              i1000 = i.slice(-3);
            if (ord)
              return i10 == 1 ||
                i10 == 2 ||
                i10 == 5 ||
                i10 == 7 ||
                i10 == 8 ||
                i100 == 20 ||
                i100 == 50 ||
                i100 == 70 ||
                i100 == 80
                ? 'one'
                : i10 == 3 ||
                  i10 == 4 ||
                  i1000 == 100 ||
                  i1000 == 200 ||
                  i1000 == 300 ||
                  i1000 == 400 ||
                  i1000 == 500 ||
                  i1000 == 600 ||
                  i1000 == 700 ||
                  i1000 == 800 ||
                  i1000 == 900
                ? 'few'
                : i == 0 || i10 == 6 || i100 == 40 || i100 == 60 || i100 == 90
                ? 'many'
                : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['az'],
    },
    {
      data: {
        be: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['few', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2);
            if (ord)
              return (n10 == 2 || n10 == 3) && n100 != 12 && n100 != 13
                ? 'few'
                : 'other';
            return n10 == 1 && n100 != 11
              ? 'one'
              : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)
              ? 'few'
              : (t0 && n10 == 0) ||
                (n10 >= 5 && n10 <= 9) ||
                (n100 >= 11 && n100 <= 14)
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['be'],
    },
    {
      data: {
        bem: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['bem'],
    },
    {
      data: {
        bez: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['bez'],
    },
    {
      data: {
        bg: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['bg'],
    },
    {
      data: {
        bho: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['bho'],
    },
    {
      data: {
        bm: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['bm'],
    },
    {
      data: {
        bn: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : n == 6
                ? 'many'
                : 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['bn'],
    },
    {
      data: {
        bo: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['bo'],
    },
    {
      data: {
        br: {
          categories: {
            cardinal: ['one', 'two', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2),
              n1000000 = t0 && s[0].slice(-6);
            if (ord) return 'other';
            return n10 == 1 && n100 != 11 && n100 != 71 && n100 != 91
              ? 'one'
              : n10 == 2 && n100 != 12 && n100 != 72 && n100 != 92
              ? 'two'
              : (n10 == 3 || n10 == 4 || n10 == 9) &&
                (n100 < 10 || n100 > 19) &&
                (n100 < 70 || n100 > 79) &&
                (n100 < 90 || n100 > 99)
              ? 'few'
              : n != 0 && t0 && n1000000 == 0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['br'],
    },
    {
      data: {
        brx: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['brx'],
    },
    {
      data: {
        bs: {
          categories: {cardinal: ['one', 'few', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              f10 = f.slice(-1),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i10 == 1 && i100 != 11) || (f10 == 1 && f100 != 11)
              ? 'one'
              : (v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)) ||
                (f10 >= 2 && f10 <= 4 && (f100 < 12 || f100 > 14))
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['bs'],
    },
    {
      data: {
        ca: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord)
              return n == 1 || n == 3
                ? 'one'
                : n == 2
                ? 'two'
                : n == 4
                ? 'few'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ca'],
    },
    {
      data: {
        ce: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ce'],
    },
    {
      data: {
        ceb: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              f10 = f.slice(-1);
            if (ord) return 'other';
            return (v0 && (i == 1 || i == 2 || i == 3)) ||
              (v0 && i10 != 4 && i10 != 6 && i10 != 9) ||
              (!v0 && f10 != 4 && f10 != 6 && f10 != 9)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['ceb'],
    },
    {
      data: {
        cgg: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['cgg'],
    },
    {
      data: {
        chr: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['chr'],
    },
    {
      data: {
        ckb: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ckb'],
    },
    {
      data: {
        cs: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0
              ? 'one'
              : i >= 2 && i <= 4 && v0
              ? 'few'
              : !v0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['cs'],
    },
    {
      data: {
        cy: {
          categories: {
            cardinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
            ordinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 0 || n == 7 || n == 8 || n == 9
                ? 'zero'
                : n == 1
                ? 'one'
                : n == 2
                ? 'two'
                : n == 3 || n == 4
                ? 'few'
                : n == 5 || n == 6
                ? 'many'
                : 'other';
            return n == 0
              ? 'zero'
              : n == 1
              ? 'one'
              : n == 2
              ? 'two'
              : n == 3
              ? 'few'
              : n == 6
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['cy'],
    },
    {
      data: {
        da: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              t0 = Number(s[0]) == n;
            if (ord) return 'other';
            return n == 1 || (!t0 && (i == 0 || i == 1)) ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['da'],
    },
    {
      data: {
        de: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['de'],
    },
    {
      data: {
        dsb: {
          categories: {
            cardinal: ['one', 'two', 'few', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i100 = i.slice(-2),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i100 == 1) || f100 == 1
              ? 'one'
              : (v0 && i100 == 2) || f100 == 2
              ? 'two'
              : (v0 && (i100 == 3 || i100 == 4)) || f100 == 3 || f100 == 4
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['dsb'],
    },
    {
      data: {
        dv: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['dv'],
    },
    {
      data: {
        dz: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['dz'],
    },
    {
      data: {
        ee: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ee'],
    },
    {
      data: {
        el: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['el'],
    },
    {
      data: {
        en: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2);
            if (ord)
              return n10 == 1 && n100 != 11
                ? 'one'
                : n10 == 2 && n100 != 12
                ? 'two'
                : n10 == 3 && n100 != 13
                ? 'few'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['en'],
    },
    {
      data: {
        eo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['eo'],
    },
    {
      data: {
        es: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['es'],
    },
    {
      data: {
        et: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['et'],
    },
    {
      data: {
        eu: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['eu'],
    },
    {
      data: {
        fa: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fa'],
    },
    {
      data: {
        ff: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n < 2 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ff'],
    },
    {
      data: {
        fi: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fi'],
    },
    {
      data: {
        fil: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              f10 = f.slice(-1);
            if (ord) return n == 1 ? 'one' : 'other';
            return (v0 && (i == 1 || i == 2 || i == 3)) ||
              (v0 && i10 != 4 && i10 != 6 && i10 != 9) ||
              (!v0 && f10 != 4 && f10 != 6 && f10 != 9)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['fil'],
    },
    {
      data: {
        fo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fo'],
    },
    {
      data: {
        fr: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 ? 'one' : 'other';
            return n >= 0 && n < 2 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fr'],
    },
    {
      data: {
        fur: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fur'],
    },
    {
      data: {
        fy: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['fy'],
    },
    {
      data: {
        ga: {
          categories: {
            cardinal: ['one', 'two', 'few', 'many', 'other'],
            ordinal: ['one', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord) return n == 1 ? 'one' : 'other';
            return n == 1
              ? 'one'
              : n == 2
              ? 'two'
              : t0 && n >= 3 && n <= 6
              ? 'few'
              : t0 && n >= 7 && n <= 10
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['ga'],
    },
    {
      data: {
        gd: {
          categories: {
            cardinal: ['one', 'two', 'few', 'other'],
            ordinal: ['one', 'two', 'few', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord)
              return n == 1 || n == 11
                ? 'one'
                : n == 2 || n == 12
                ? 'two'
                : n == 3 || n == 13
                ? 'few'
                : 'other';
            return n == 1 || n == 11
              ? 'one'
              : n == 2 || n == 12
              ? 'two'
              : (t0 && n >= 3 && n <= 10) || (t0 && n >= 13 && n <= 19)
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['gd'],
    },
    {
      data: {
        gl: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['gl'],
    },
    {
      data: {
        gsw: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['gsw'],
    },
    {
      data: {
        gu: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 1
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : n == 6
                ? 'many'
                : 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['gu'],
    },
    {
      data: {
        guw: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['guw'],
    },
    {
      data: {
        gv: {
          categories: {
            cardinal: ['one', 'two', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2);
            if (ord) return 'other';
            return v0 && i10 == 1
              ? 'one'
              : v0 && i10 == 2
              ? 'two'
              : v0 &&
                (i100 == 0 ||
                  i100 == 20 ||
                  i100 == 40 ||
                  i100 == 60 ||
                  i100 == 80)
              ? 'few'
              : !v0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['gv'],
    },
    {
      data: {
        ha: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ha'],
    },
    {
      data: {
        haw: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['haw'],
    },
    {
      data: {
        he: {
          categories: {
            cardinal: ['one', 'two', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1);
            if (ord) return 'other';
            return n == 1 && v0
              ? 'one'
              : i == 2 && v0
              ? 'two'
              : v0 && (n < 0 || n > 10) && t0 && n10 == 0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['he'],
    },
    {
      data: {
        hi: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 1
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : n == 6
                ? 'many'
                : 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['hi'],
    },
    {
      data: {
        hr: {
          categories: {cardinal: ['one', 'few', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              f10 = f.slice(-1),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i10 == 1 && i100 != 11) || (f10 == 1 && f100 != 11)
              ? 'one'
              : (v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)) ||
                (f10 >= 2 && f10 <= 4 && (f100 < 12 || f100 > 14))
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['hr'],
    },
    {
      data: {
        hsb: {
          categories: {
            cardinal: ['one', 'two', 'few', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i100 = i.slice(-2),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i100 == 1) || f100 == 1
              ? 'one'
              : (v0 && i100 == 2) || f100 == 2
              ? 'two'
              : (v0 && (i100 == 3 || i100 == 4)) || f100 == 3 || f100 == 4
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['hsb'],
    },
    {
      data: {
        hu: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 || n == 5 ? 'one' : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['hu'],
    },
    {
      data: {
        hy: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 ? 'one' : 'other';
            return n >= 0 && n < 2 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['hy'],
    },
    {
      data: {
        ia: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ia'],
    },
    {
      data: {
        id: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['id'],
    },
    {
      data: {
        ig: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['ig'],
    },
    {
      data: {
        ii: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['ii'],
    },
    {
      data: {
        in: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['in'],
    },
    {
      data: {
        io: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['io'],
    },
    {
      data: {
        is: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              t0 = Number(s[0]) == n,
              i10 = i.slice(-1),
              i100 = i.slice(-2);
            if (ord) return 'other';
            return (t0 && i10 == 1 && i100 != 11) || !t0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['is'],
    },
    {
      data: {
        it: {
          categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord)
              return n == 11 || n == 8 || n == 80 || n == 800
                ? 'many'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['it'],
    },
    {
      data: {
        iu: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['iu'],
    },
    {
      data: {
        iw: {
          categories: {
            cardinal: ['one', 'two', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1);
            if (ord) return 'other';
            return n == 1 && v0
              ? 'one'
              : i == 2 && v0
              ? 'two'
              : v0 && (n < 0 || n > 10) && t0 && n10 == 0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['iw'],
    },
    {
      data: {
        ja: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['ja'],
    },
    {
      data: {
        jbo: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['jbo'],
    },
    {
      data: {
        jgo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['jgo'],
    },
    {
      data: {
        ji: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ji'],
    },
    {
      data: {
        jmc: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['jmc'],
    },
    {
      data: {
        jv: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['jv'],
    },
    {
      data: {
        jw: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['jw'],
    },
    {
      data: {
        ka: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              i100 = i.slice(-2);
            if (ord)
              return i == 1
                ? 'one'
                : i == 0 ||
                  (i100 >= 2 && i100 <= 20) ||
                  i100 == 40 ||
                  i100 == 60 ||
                  i100 == 80
                ? 'many'
                : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ka'],
    },
    {
      data: {
        kab: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n < 2 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kab'],
    },
    {
      data: {
        kaj: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kaj'],
    },
    {
      data: {
        kcg: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kcg'],
    },
    {
      data: {
        kde: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['kde'],
    },
    {
      data: {
        kea: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['kea'],
    },
    {
      data: {
        kk: {
          categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1);
            if (ord)
              return n10 == 6 || n10 == 9 || (t0 && n10 == 0 && n != 0)
                ? 'many'
                : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kk'],
    },
    {
      data: {
        kkj: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kkj'],
    },
    {
      data: {
        kl: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kl'],
    },
    {
      data: {
        km: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['km'],
    },
    {
      data: {
        kn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['kn'],
    },
    {
      data: {
        ko: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['ko'],
    },
    {
      data: {
        ks: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ks'],
    },
    {
      data: {
        ksb: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ksb'],
    },
    {
      data: {
        ksh: {
          categories: {cardinal: ['zero', 'one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 ? 'zero' : n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ksh'],
    },
    {
      data: {
        ku: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ku'],
    },
    {
      data: {
        kw: {
          categories: {
            cardinal: ['zero', 'one', 'two', 'few', 'many', 'other'],
            ordinal: ['one', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2),
              n1000 = t0 && s[0].slice(-3),
              n100000 = t0 && s[0].slice(-5),
              n1000000 = t0 && s[0].slice(-6);
            if (ord)
              return (t0 && n >= 1 && n <= 4) ||
                (n100 >= 1 && n100 <= 4) ||
                (n100 >= 21 && n100 <= 24) ||
                (n100 >= 41 && n100 <= 44) ||
                (n100 >= 61 && n100 <= 64) ||
                (n100 >= 81 && n100 <= 84)
                ? 'one'
                : n == 5 || n100 == 5
                ? 'many'
                : 'other';
            return n == 0
              ? 'zero'
              : n == 1
              ? 'one'
              : n100 == 2 ||
                n100 == 22 ||
                n100 == 42 ||
                n100 == 62 ||
                n100 == 82 ||
                (t0 &&
                  n1000 == 0 &&
                  ((n100000 >= 1000 && n100000 <= 20000) ||
                    n100000 == 40000 ||
                    n100000 == 60000 ||
                    n100000 == 80000)) ||
                (n != 0 && n1000000 == 100000)
              ? 'two'
              : n100 == 3 ||
                n100 == 23 ||
                n100 == 43 ||
                n100 == 63 ||
                n100 == 83
              ? 'few'
              : n != 1 &&
                (n100 == 1 ||
                  n100 == 21 ||
                  n100 == 41 ||
                  n100 == 61 ||
                  n100 == 81)
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['kw'],
    },
    {
      data: {
        ky: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ky'],
    },
    {
      data: {
        lag: {
          categories: {cardinal: ['zero', 'one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0];
            if (ord) return 'other';
            return n == 0
              ? 'zero'
              : (i == 0 || i == 1) && n != 0
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['lag'],
    },
    {
      data: {
        lb: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['lb'],
    },
    {
      data: {
        lg: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['lg'],
    },
    {
      data: {
        lkt: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['lkt'],
    },
    {
      data: {
        ln: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ln'],
    },
    {
      data: {
        lo: {
          categories: {cardinal: ['other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 ? 'one' : 'other';
            return 'other';
          },
        },
      },
      availableLocales: ['lo'],
    },
    {
      data: {
        lt: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              f = s[1] || '',
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2);
            if (ord) return 'other';
            return n10 == 1 && (n100 < 11 || n100 > 19)
              ? 'one'
              : n10 >= 2 && n10 <= 9 && (n100 < 11 || n100 > 19)
              ? 'few'
              : f != 0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['lt'],
    },
    {
      data: {
        lv: {
          categories: {cardinal: ['zero', 'one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              f = s[1] || '',
              v = f.length,
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2),
              f100 = f.slice(-2),
              f10 = f.slice(-1);
            if (ord) return 'other';
            return (t0 && n10 == 0) ||
              (n100 >= 11 && n100 <= 19) ||
              (v == 2 && f100 >= 11 && f100 <= 19)
              ? 'zero'
              : (n10 == 1 && n100 != 11) ||
                (v == 2 && f10 == 1 && f100 != 11) ||
                (v != 2 && f10 == 1)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['lv'],
    },
    {
      data: {
        mas: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['mas'],
    },
    {
      data: {
        mg: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['mg'],
    },
    {
      data: {
        mgo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['mgo'],
    },
    {
      data: {
        mk: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              f10 = f.slice(-1),
              f100 = f.slice(-2);
            if (ord)
              return i10 == 1 && i100 != 11
                ? 'one'
                : i10 == 2 && i100 != 12
                ? 'two'
                : (i10 == 7 || i10 == 8) && i100 != 17 && i100 != 18
                ? 'many'
                : 'other';
            return (v0 && i10 == 1 && i100 != 11) || (f10 == 1 && f100 != 11)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['mk'],
    },
    {
      data: {
        ml: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ml'],
    },
    {
      data: {
        mn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['mn'],
    },
    {
      data: {
        mo: {
          categories: {
            cardinal: ['one', 'few', 'other'],
            ordinal: ['one', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2);
            if (ord) return n == 1 ? 'one' : 'other';
            return n == 1 && v0
              ? 'one'
              : !v0 || n == 0 || (n100 >= 2 && n100 <= 19)
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['mo'],
    },
    {
      data: {
        mr: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'other'],
          },
          fn: function (n, ord) {
            if (ord)
              return n == 1
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['mr'],
    },
    {
      data: {
        ms: {
          categories: {cardinal: ['other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 ? 'one' : 'other';
            return 'other';
          },
        },
      },
      availableLocales: ['ms'],
    },
    {
      data: {
        mt: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2);
            if (ord) return 'other';
            return n == 1
              ? 'one'
              : n == 0 || (n100 >= 2 && n100 <= 10)
              ? 'few'
              : n100 >= 11 && n100 <= 19
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['mt'],
    },
    {
      data: {
        my: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['my'],
    },
    {
      data: {
        nah: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nah'],
    },
    {
      data: {
        naq: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['naq'],
    },
    {
      data: {
        nb: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nb'],
    },
    {
      data: {
        nd: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nd'],
    },
    {
      data: {
        ne: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord) return t0 && n >= 1 && n <= 4 ? 'one' : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ne'],
    },
    {
      data: {
        nl: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nl'],
    },
    {
      data: {
        nn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nn'],
    },
    {
      data: {
        nnh: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nnh'],
    },
    {
      data: {
        no: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['no'],
    },
    {
      data: {
        nqo: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['nqo'],
    },
    {
      data: {
        nr: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nr'],
    },
    {
      data: {
        nso: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nso'],
    },
    {
      data: {
        ny: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ny'],
    },
    {
      data: {
        nyn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['nyn'],
    },
    {
      data: {
        om: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['om'],
    },
    {
      data: {
        or: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'two', 'few', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord)
              return n == 1 || n == 5 || (t0 && n >= 7 && n <= 9)
                ? 'one'
                : n == 2 || n == 3
                ? 'two'
                : n == 4
                ? 'few'
                : n == 6
                ? 'many'
                : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['or'],
    },
    {
      data: {
        os: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['os'],
    },
    {
      data: {
        osa: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['osa'],
    },
    {
      data: {
        pa: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['pa'],
    },
    {
      data: {
        pap: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['pap'],
    },
    {
      data: {
        pl: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2);
            if (ord) return 'other';
            return n == 1 && v0
              ? 'one'
              : v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)
              ? 'few'
              : (v0 && i != 1 && (i10 == 0 || i10 == 1)) ||
                (v0 && i10 >= 5 && i10 <= 9) ||
                (v0 && i100 >= 12 && i100 <= 14)
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['pl'],
    },
    {
      data: {
        prg: {
          categories: {cardinal: ['zero', 'one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              f = s[1] || '',
              v = f.length,
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2),
              f100 = f.slice(-2),
              f10 = f.slice(-1);
            if (ord) return 'other';
            return (t0 && n10 == 0) ||
              (n100 >= 11 && n100 <= 19) ||
              (v == 2 && f100 >= 11 && f100 <= 19)
              ? 'zero'
              : (n10 == 1 && n100 != 11) ||
                (v == 2 && f10 == 1 && f100 != 11) ||
                (v != 2 && f10 == 1)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['prg'],
    },
    {
      data: {
        ps: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ps'],
    },
    {
      data: {
        pt: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0];
            if (ord) return 'other';
            return i == 0 || i == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['pt'],
    },
    {
      data: {
        'pt-PT': {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['pt-PT'],
    },
    {
      data: {
        rm: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['rm'],
    },
    {
      data: {
        ro: {
          categories: {
            cardinal: ['one', 'few', 'other'],
            ordinal: ['one', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n100 = t0 && s[0].slice(-2);
            if (ord) return n == 1 ? 'one' : 'other';
            return n == 1 && v0
              ? 'one'
              : !v0 || n == 0 || (n100 >= 2 && n100 <= 19)
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['ro'],
    },
    {
      data: {
        rof: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['rof'],
    },
    {
      data: {
        root: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['root'],
    },
    {
      data: {
        ru: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2);
            if (ord) return 'other';
            return v0 && i10 == 1 && i100 != 11
              ? 'one'
              : v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)
              ? 'few'
              : (v0 && i10 == 0) ||
                (v0 && i10 >= 5 && i10 <= 9) ||
                (v0 && i100 >= 11 && i100 <= 14)
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['ru'],
    },
    {
      data: {
        rwk: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['rwk'],
    },
    {
      data: {
        sah: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['sah'],
    },
    {
      data: {
        saq: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['saq'],
    },
    {
      data: {
        sc: {
          categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord)
              return n == 11 || n == 8 || n == 80 || n == 800
                ? 'many'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sc'],
    },
    {
      data: {
        scn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['many', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord)
              return n == 11 || n == 8 || n == 80 || n == 800
                ? 'many'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['scn'],
    },
    {
      data: {
        sd: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sd'],
    },
    {
      data: {
        sdh: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sdh'],
    },
    {
      data: {
        se: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['se'],
    },
    {
      data: {
        seh: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['seh'],
    },
    {
      data: {
        ses: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['ses'],
    },
    {
      data: {
        sg: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['sg'],
    },
    {
      data: {
        sh: {
          categories: {cardinal: ['one', 'few', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              f10 = f.slice(-1),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i10 == 1 && i100 != 11) || (f10 == 1 && f100 != 11)
              ? 'one'
              : (v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)) ||
                (f10 >= 2 && f10 <= 4 && (f100 < 12 || f100 > 14))
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['sh'],
    },
    {
      data: {
        shi: {
          categories: {cardinal: ['one', 'few', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord) return 'other';
            return n >= 0 && n <= 1
              ? 'one'
              : t0 && n >= 2 && n <= 10
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['shi'],
    },
    {
      data: {
        si: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '';
            if (ord) return 'other';
            return n == 0 || n == 1 || (i == 0 && f == 1) ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['si'],
    },
    {
      data: {
        sk: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0
              ? 'one'
              : i >= 2 && i <= 4 && v0
              ? 'few'
              : !v0
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['sk'],
    },
    {
      data: {
        sl: {
          categories: {
            cardinal: ['one', 'two', 'few', 'other'],
            ordinal: ['other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              i100 = i.slice(-2);
            if (ord) return 'other';
            return v0 && i100 == 1
              ? 'one'
              : v0 && i100 == 2
              ? 'two'
              : (v0 && (i100 == 3 || i100 == 4)) || !v0
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['sl'],
    },
    {
      data: {
        sma: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['sma'],
    },
    {
      data: {
        smi: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['smi'],
    },
    {
      data: {
        smj: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['smj'],
    },
    {
      data: {
        smn: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['smn'],
    },
    {
      data: {
        sms: {
          categories: {cardinal: ['one', 'two', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : n == 2 ? 'two' : 'other';
          },
        },
      },
      availableLocales: ['sms'],
    },
    {
      data: {
        sn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sn'],
    },
    {
      data: {
        so: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['so'],
    },
    {
      data: {
        sq: {
          categories: {
            cardinal: ['one', 'other'],
            ordinal: ['one', 'many', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2);
            if (ord)
              return n == 1 ? 'one' : n10 == 4 && n100 != 14 ? 'many' : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sq'],
    },
    {
      data: {
        sr: {
          categories: {cardinal: ['one', 'few', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              i100 = i.slice(-2),
              f10 = f.slice(-1),
              f100 = f.slice(-2);
            if (ord) return 'other';
            return (v0 && i10 == 1 && i100 != 11) || (f10 == 1 && f100 != 11)
              ? 'one'
              : (v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)) ||
                (f10 >= 2 && f10 <= 4 && (f100 < 12 || f100 > 14))
              ? 'few'
              : 'other';
          },
        },
      },
      availableLocales: ['sr'],
    },
    {
      data: {
        ss: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ss'],
    },
    {
      data: {
        ssy: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ssy'],
    },
    {
      data: {
        st: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['st'],
    },
    {
      data: {
        su: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['su'],
    },
    {
      data: {
        sv: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2);
            if (ord)
              return (n10 == 1 || n10 == 2) && n100 != 11 && n100 != 12
                ? 'one'
                : 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sv'],
    },
    {
      data: {
        sw: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['sw'],
    },
    {
      data: {
        syr: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['syr'],
    },
    {
      data: {
        ta: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ta'],
    },
    {
      data: {
        te: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['te'],
    },
    {
      data: {
        teo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['teo'],
    },
    {
      data: {
        th: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['th'],
    },
    {
      data: {
        ti: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ti'],
    },
    {
      data: {
        tig: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['tig'],
    },
    {
      data: {
        tk: {
          categories: {cardinal: ['one', 'other'], ordinal: ['few', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1);
            if (ord) return n10 == 6 || n10 == 9 || n == 10 ? 'few' : 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['tk'],
    },
    {
      data: {
        tl: {
          categories: {cardinal: ['one', 'other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              f = s[1] || '',
              v0 = !s[1],
              i10 = i.slice(-1),
              f10 = f.slice(-1);
            if (ord) return n == 1 ? 'one' : 'other';
            return (v0 && (i == 1 || i == 2 || i == 3)) ||
              (v0 && i10 != 4 && i10 != 6 && i10 != 9) ||
              (!v0 && f10 != 4 && f10 != 6 && f10 != 9)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['tl'],
    },
    {
      data: {
        tn: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['tn'],
    },
    {
      data: {
        to: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['to'],
    },
    {
      data: {
        tr: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['tr'],
    },
    {
      data: {
        ts: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ts'],
    },
    {
      data: {
        tzm: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              t0 = Number(s[0]) == n;
            if (ord) return 'other';
            return n == 0 || n == 1 || (t0 && n >= 11 && n <= 99)
              ? 'one'
              : 'other';
          },
        },
      },
      availableLocales: ['tzm'],
    },
    {
      data: {
        ug: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ug'],
    },
    {
      data: {
        uk: {
          categories: {
            cardinal: ['one', 'few', 'many', 'other'],
            ordinal: ['few', 'other'],
          },
          fn: function (n, ord) {
            var s = String(n).split('.'),
              i = s[0],
              v0 = !s[1],
              t0 = Number(s[0]) == n,
              n10 = t0 && s[0].slice(-1),
              n100 = t0 && s[0].slice(-2),
              i10 = i.slice(-1),
              i100 = i.slice(-2);
            if (ord) return n10 == 3 && n100 != 13 ? 'few' : 'other';
            return v0 && i10 == 1 && i100 != 11
              ? 'one'
              : v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14)
              ? 'few'
              : (v0 && i10 == 0) ||
                (v0 && i10 >= 5 && i10 <= 9) ||
                (v0 && i100 >= 11 && i100 <= 14)
              ? 'many'
              : 'other';
          },
        },
      },
      availableLocales: ['uk'],
    },
    {
      data: {
        ur: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ur'],
    },
    {
      data: {
        uz: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['uz'],
    },
    {
      data: {
        ve: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['ve'],
    },
    {
      data: {
        vi: {
          categories: {cardinal: ['other'], ordinal: ['one', 'other']},
          fn: function (n, ord) {
            if (ord) return n == 1 ? 'one' : 'other';
            return 'other';
          },
        },
      },
      availableLocales: ['vi'],
    },
    {
      data: {
        vo: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['vo'],
    },
    {
      data: {
        vun: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['vun'],
    },
    {
      data: {
        wa: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 0 || n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['wa'],
    },
    {
      data: {
        wae: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['wae'],
    },
    {
      data: {
        wo: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['wo'],
    },
    {
      data: {
        xh: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['xh'],
    },
    {
      data: {
        xog: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n == 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['xog'],
    },
    {
      data: {
        yi: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            var s = String(n).split('.'),
              v0 = !s[1];
            if (ord) return 'other';
            return n == 1 && v0 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['yi'],
    },
    {
      data: {
        yo: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['yo'],
    },
    {
      data: {
        yue: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['yue'],
    },
    {
      data: {
        zh: {
          categories: {cardinal: ['other'], ordinal: ['other']},
          fn: function (n, ord) {
            return 'other';
          },
        },
      },
      availableLocales: ['zh'],
    },
    {
      data: {
        zu: {
          categories: {cardinal: ['one', 'other'], ordinal: ['other']},
          fn: function (n, ord) {
            if (ord) return 'other';
            return n >= 0 && n <= 1 ? 'one' : 'other';
          },
        },
      },
      availableLocales: ['zu'],
    }
  );
}
