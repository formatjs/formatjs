/* @generated */
// prettier-ignore
require('./polyfill')
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
IntlPluralRules.__addLocaleData({"locale":"af","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ak","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return ((n == 0
          || n == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"am","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ar","categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return (n == 0) ? 'zero'
      : (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : ((n100 >= 3 && n100 <= 10)) ? 'few'
      : ((n100 >= 11 && n100 <= 99)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"as","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return ((n == 1 || n == 5 || n == 7 || n == 8 || n == 9
          || n == 10)) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"asa","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ast","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"az","categories":{"cardinal":["one","other"],"ordinal":["one","few","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], i10 = i.slice(-1),
      i100 = i.slice(-2), i1000 = i.slice(-3);
  if (ord) return ((i10 == 1 || i10 == 2 || i10 == 5 || i10 == 7 || i10 == 8)
          || (i100 == 20 || i100 == 50 || i100 == 70
          || i100 == 80)) ? 'one'
      : ((i10 == 3 || i10 == 4) || (i1000 == 100 || i1000 == 200
          || i1000 == 300 || i1000 == 400 || i1000 == 500 || i1000 == 600 || i1000 == 700
          || i1000 == 800
          || i1000 == 900)) ? 'few'
      : (i == 0 || i10 == 6 || (i100 == 40 || i100 == 60
          || i100 == 90)) ? 'many'
      : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"be","categories":{"cardinal":["one","few","many","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return ((n10 == 2
          || n10 == 3) && n100 != 12 && n100 != 13) ? 'few' : 'other';
  return (n10 == 1 && n100 != 11) ? 'one'
      : ((n10 >= 2 && n10 <= 4) && (n100 < 12
          || n100 > 14)) ? 'few'
      : (t0 && n10 == 0 || (n10 >= 5 && n10 <= 9)
          || (n100 >= 11 && n100 <= 14)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bem","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bez","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bg","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bm","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bn","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return ((n == 1 || n == 5 || n == 7 || n == 8 || n == 9
          || n == 10)) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bo","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"br","categories":{"cardinal":["one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2),
      n1000000 = t0 && s[0].slice(-6);
  if (ord) return 'other';
  return (n10 == 1 && n100 != 11 && n100 != 71 && n100 != 91) ? 'one'
      : (n10 == 2 && n100 != 12 && n100 != 72 && n100 != 92) ? 'two'
      : (((n10 == 3 || n10 == 4) || n10 == 9) && (n100 < 10
          || n100 > 19) && (n100 < 70 || n100 > 79) && (n100 < 90
          || n100 > 99)) ? 'few'
      : (n != 0 && t0 && n1000000 == 0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"brx","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"bs","categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return (v0 && i10 == 1 && i100 != 11
          || f10 == 1 && f100 != 11) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14)
          || (f10 >= 2 && f10 <= 4) && (f100 < 12
          || f100 > 14)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ca","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return ((n == 1
          || n == 3)) ? 'one'
      : (n == 2) ? 'two'
      : (n == 4) ? 'few'
      : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ce","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ceb","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return 'other';
  return (v0 && (i == 1 || i == 2 || i == 3)
          || v0 && i10 != 4 && i10 != 6 && i10 != 9
          || !v0 && f10 != 4 && f10 != 6 && f10 != 9) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"cgg","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"chr","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ckb","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"cs","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one'
      : ((i >= 2 && i <= 4) && v0) ? 'few'
      : (!v0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"cy","categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["zero","one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return ((n == 0 || n == 7 || n == 8
          || n == 9)) ? 'zero'
      : (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : ((n == 3
          || n == 4)) ? 'few'
      : ((n == 5
          || n == 6)) ? 'many'
      : 'other';
  return (n == 0) ? 'zero'
      : (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : (n == 3) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"da","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return (n == 1 || !t0 && (i == 0
          || i == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"de","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"dsb","categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return (v0 && i100 == 1
          || f100 == 1) ? 'one'
      : (v0 && i100 == 2
          || f100 == 2) ? 'two'
      : (v0 && (i100 == 3 || i100 == 4) || (f100 == 3
          || f100 == 4)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"dz","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ee","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"el","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"en","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n10 == 1 && n100 != 11) ? 'one'
      : (n10 == 2 && n100 != 12) ? 'two'
      : (n10 == 3 && n100 != 13) ? 'few'
      : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"eo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"es","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"et","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"eu","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fa","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ff","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fi","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fil","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return (n == 1) ? 'one' : 'other';
  return (v0 && (i == 1 || i == 2 || i == 3)
          || v0 && i10 != 4 && i10 != 6 && i10 != 9
          || !v0 && f10 != 4 && f10 != 6 && f10 != 9) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fr","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fur","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"fy","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ga","categories":{"cardinal":["one","two","few","many","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : ((t0 && n >= 3 && n <= 6)) ? 'few'
      : ((t0 && n >= 7 && n <= 10)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"gd","categories":{"cardinal":["one","two","few","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return ((n == 1
          || n == 11)) ? 'one'
      : ((n == 2
          || n == 12)) ? 'two'
      : ((n == 3
          || n == 13)) ? 'few'
      : 'other';
  return ((n == 1
          || n == 11)) ? 'one'
      : ((n == 2
          || n == 12)) ? 'two'
      : (((t0 && n >= 3 && n <= 10)
          || (t0 && n >= 13 && n <= 19))) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"gl","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"gsw","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"gu","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"gv","categories":{"cardinal":["one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1),
      i100 = i.slice(-2);
  if (ord) return 'other';
  return (v0 && i10 == 1) ? 'one'
      : (v0 && i10 == 2) ? 'two'
      : (v0 && (i100 == 0 || i100 == 20 || i100 == 40 || i100 == 60
          || i100 == 80)) ? 'few'
      : (!v0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ha","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"haw","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"he","categories":{"cardinal":["one","two","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1);
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one'
      : (i == 2 && v0) ? 'two'
      : (v0 && (n < 0
          || n > 10) && t0 && n10 == 0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"hi","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"hr","categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return (v0 && i10 == 1 && i100 != 11
          || f10 == 1 && f100 != 11) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14)
          || (f10 >= 2 && f10 <= 4) && (f100 < 12
          || f100 > 14)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"hsb","categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return (v0 && i100 == 1
          || f100 == 1) ? 'one'
      : (v0 && i100 == 2
          || f100 == 2) ? 'two'
      : (v0 && (i100 == 3 || i100 == 4) || (f100 == 3
          || f100 == 4)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"hu","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return ((n == 1
          || n == 5)) ? 'one' : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"hy","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ia","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"id","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ig","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ii","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"is","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n,
      i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return (t0 && i10 == 1 && i100 != 11
          || !t0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"it","categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return ((n == 11 || n == 8 || n == 80
          || n == 800)) ? 'many' : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ja","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"jgo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"jmc","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"jv","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ka","categories":{"cardinal":["one","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], i100 = i.slice(-2);
  if (ord) return (i == 1) ? 'one'
      : (i == 0 || ((i100 >= 2 && i100 <= 20) || i100 == 40 || i100 == 60
          || i100 == 80)) ? 'many'
      : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kab","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n < 2) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kde","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kea","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kk","categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1);
  if (ord) return (n10 == 6 || n10 == 9
          || t0 && n10 == 0 && n != 0) ? 'many' : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kkj","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kl","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"km","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kn","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ko","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ks","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ksb","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ksh","categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0) ? 'zero'
      : (n == 1) ? 'one'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ku","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"kw","categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n100 = t0 && s[0].slice(-2), n1000 = t0 && s[0].slice(-3),
      n100000 = t0 && s[0].slice(-5), n1000000 = t0 && s[0].slice(-6);
  if (ord) return ((t0 && n >= 1 && n <= 4) || ((n100 >= 1 && n100 <= 4)
          || (n100 >= 21 && n100 <= 24) || (n100 >= 41 && n100 <= 44)
          || (n100 >= 61 && n100 <= 64)
          || (n100 >= 81 && n100 <= 84))) ? 'one'
      : (n == 5
          || n100 == 5) ? 'many'
      : 'other';
  return (n == 0) ? 'zero'
      : (n == 1) ? 'one'
      : ((n100 == 2 || n100 == 22 || n100 == 42 || n100 == 62 || n100 == 82)
          || t0 && n1000 == 0 && ((n100000 >= 1000 && n100000 <= 20000) || n100000 == 40000
          || n100000 == 60000 || n100000 == 80000)
          || n != 0 && n1000000 == 100000) ? 'two'
      : ((n100 == 3 || n100 == 23 || n100 == 43 || n100 == 63
          || n100 == 83)) ? 'few'
      : (n != 1 && (n100 == 1 || n100 == 21 || n100 == 41 || n100 == 61
          || n100 == 81)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ky","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lag","categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0];
  if (ord) return 'other';
  return (n == 0) ? 'zero'
      : ((i == 0
          || i == 1) && n != 0) ? 'one'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lb","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lg","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lkt","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ln","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return ((n == 0
          || n == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lo","categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lt","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return (n10 == 1 && (n100 < 11
          || n100 > 19)) ? 'one'
      : ((n10 >= 2 && n10 <= 9) && (n100 < 11
          || n100 > 19)) ? 'few'
      : (f != 0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"lv","categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', v = f.length,
      t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1),
      n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return (t0 && n10 == 0 || (n100 >= 11 && n100 <= 19)
          || v == 2 && (f100 >= 11 && f100 <= 19)) ? 'zero'
      : (n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11
          || v != 2 && f10 == 1) ? 'one'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mas","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mg","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return ((n == 0
          || n == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mgo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mk","categories":{"cardinal":["one","other"],"ordinal":["one","two","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return (i10 == 1 && i100 != 11) ? 'one'
      : (i10 == 2 && i100 != 12) ? 'two'
      : ((i10 == 7
          || i10 == 8) && i100 != 17 && i100 != 18) ? 'many'
      : 'other';
  return (v0 && i10 == 1 && i100 != 11
          || f10 == 1 && f100 != 11) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ml","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mn","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mr","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ms","categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"mt","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return (n == 1) ? 'one'
      : (n == 0
          || (n100 >= 2 && n100 <= 10)) ? 'few'
      : ((n100 >= 11 && n100 <= 19)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"my","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"naq","categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nb","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nd","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ne","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return ((t0 && n >= 1 && n <= 4)) ? 'one' : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nl","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nn","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nnh","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"nyn","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"om","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"or","categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return ((n == 1 || n == 5
          || (t0 && n >= 7 && n <= 9))) ? 'one'
      : ((n == 2
          || n == 3)) ? 'two'
      : (n == 4) ? 'few'
      : (n == 6) ? 'many'
      : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"os","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"pa","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return ((n == 0
          || n == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"pl","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1),
      i100 = i.slice(-2);
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12
          || i100 > 14)) ? 'few'
      : (v0 && i != 1 && (i10 == 0 || i10 == 1)
          || v0 && (i10 >= 5 && i10 <= 9)
          || v0 && (i100 >= 12 && i100 <= 14)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"prg","categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', v = f.length,
      t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1),
      n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return (t0 && n10 == 0 || (n100 >= 11 && n100 <= 19)
          || v == 2 && (f100 >= 11 && f100 <= 19)) ? 'zero'
      : (n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11
          || v != 2 && f10 == 1) ? 'one'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ps","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"pt","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0];
  if (ord) return 'other';
  return ((i == 0
          || i == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"rm","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ro","categories":{"cardinal":["one","few","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n,
      n100 = t0 && s[0].slice(-2);
  if (ord) return (n == 1) ? 'one' : 'other';
  return (n == 1 && v0) ? 'one'
      : (!v0 || n == 0
          || (n100 >= 2 && n100 <= 19)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"rof","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"root","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ru","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1),
      i100 = i.slice(-2);
  if (ord) return 'other';
  return (v0 && i10 == 1 && i100 != 11) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12
          || i100 > 14)) ? 'few'
      : (v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9)
          || v0 && (i100 >= 11 && i100 <= 14)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"rwk","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sah","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"saq","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sd","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"se","categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"seh","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ses","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sg","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"shi","categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return (n >= 0 && n <= 1) ? 'one'
      : ((t0 && n >= 2 && n <= 10)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"si","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '';
  if (ord) return 'other';
  return ((n == 0 || n == 1)
          || i == 0 && f == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sk","categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one'
      : ((i >= 2 && i <= 4) && v0) ? 'few'
      : (!v0) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sl","categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i100 = i.slice(-2);
  if (ord) return 'other';
  return (v0 && i100 == 1) ? 'one'
      : (v0 && i100 == 2) ? 'two'
      : (v0 && (i100 == 3 || i100 == 4)
          || !v0) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"smn","categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one'
      : (n == 2) ? 'two'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sn","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"so","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sq","categories":{"cardinal":["one","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n == 1) ? 'one'
      : (n10 == 4 && n100 != 14) ? 'many'
      : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sr","categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1],
      i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return (v0 && i10 == 1 && i100 != 11
          || f10 == 1 && f100 != 11) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14)
          || (f10 >= 2 && f10 <= 4) && (f100 < 12
          || f100 > 14)) ? 'few'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sv","categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return ((n10 == 1
          || n10 == 2) && n100 != 11 && n100 != 12) ? 'one' : 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"sw","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ta","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"te","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"teo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"th","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ti","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return ((n == 0
          || n == 1)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"tk","categories":{"cardinal":["one","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1);
  if (ord) return ((n10 == 6 || n10 == 9)
          || n == 10) ? 'few' : 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"to","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"tr","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"tzm","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return ((n == 0 || n == 1)
          || (t0 && n >= 11 && n <= 99)) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ug","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"uk","categories":{"cardinal":["one","few","many","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], t0 = Number(s[0]) == n,
      n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), i10 = i.slice(-1),
      i100 = i.slice(-2);
  if (ord) return (n10 == 3 && n100 != 13) ? 'few' : 'other';
  return (v0 && i10 == 1 && i100 != 11) ? 'one'
      : (v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12
          || i100 > 14)) ? 'few'
      : (v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9)
          || v0 && (i100 >= 11 && i100 <= 14)) ? 'many'
      : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"ur","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"uz","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"vi","categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1) ? 'one' : 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"vo","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"vun","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"wae","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"wo","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"xh","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"xog","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 1) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"yi","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return (n == 1 && v0) ? 'one' : 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"yo","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"yue","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"zh","categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return 'other';
}})
IntlPluralRules.__addLocaleData({"locale":"zu","categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n >= 0 && n <= 1) ? 'one' : 'other';
}})
}
