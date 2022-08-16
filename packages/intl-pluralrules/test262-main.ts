/* @generated */
// prettier-ignore
// @ts-nocheck
import './polyfill-force'
if (Intl.PluralRules && typeof Intl.PluralRules.__addLocaleData === 'function') {
  Intl.PluralRules.__addLocaleData({"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"af"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"ak"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"am"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"an"},
{"data":{"categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
}},"locale":"ar"},
{"data":{"categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n100 >= 3 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 99) ? 'many'
    : 'other';
}},"locale":"ars"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"as"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"asa"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"ast"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","few","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], i10 = i.slice(-1), i100 = i.slice(-2), i1000 = i.slice(-3);
  if (ord) return (i10 == 1 || i10 == 2 || i10 == 5 || i10 == 7 || i10 == 8) || (i100 == 20 || i100 == 50 || i100 == 70 || i100 == 80) ? 'one'
    : (i10 == 3 || i10 == 4) || (i1000 == 100 || i1000 == 200 || i1000 == 300 || i1000 == 400 || i1000 == 500 || i1000 == 600 || i1000 == 700 || i1000 == 800 || i1000 == 900) ? 'few'
    : i == 0 || i10 == 6 || (i100 == 40 || i100 == 60 || i100 == 90) ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"az"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  return n == 1 ? 'one' : 'other';
}},"locale":"bal"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n10 == 2 || n10 == 3) && n100 != 12 && n100 != 13 ? 'few' : 'other';
  return n10 == 1 && n100 != 11 ? 'one'
    : (n10 >= 2 && n10 <= 4) && (n100 < 12 || n100 > 14) ? 'few'
    : t0 && n10 == 0 || (n10 >= 5 && n10 <= 9) || (n100 >= 11 && n100 <= 14) ? 'many'
    : 'other';
}},"locale":"be"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"bem"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"bez"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"bg"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"bho"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"bm"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1 || n == 5 || n == 7 || n == 8 || n == 9 || n == 10) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"bn"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"bo"},
{"data":{"categories":{"cardinal":["one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), n1000000 = t0 && s[0].slice(-6);
  if (ord) return 'other';
  return n10 == 1 && n100 != 11 && n100 != 71 && n100 != 91 ? 'one'
    : n10 == 2 && n100 != 12 && n100 != 72 && n100 != 92 ? 'two'
    : ((n10 == 3 || n10 == 4) || n10 == 9) && (n100 < 10 || n100 > 19) && (n100 < 70 || n100 > 79) && (n100 < 90 || n100 > 99) ? 'few'
    : n != 0 && t0 && n1000000 == 0 ? 'many'
    : 'other';
}},"locale":"br"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"brx"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
}},"locale":"bs"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return (n == 1 || n == 3) ? 'one'
    : n == 2 ? 'two'
    : n == 4 ? 'few'
    : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"ca"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ce"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
}},"locale":"ceb"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"cgg"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"chr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ckb"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
}},"locale":"cs"},
{"data":{"categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["zero","one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return (n == 0 || n == 7 || n == 8 || n == 9) ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : (n == 3 || n == 4) ? 'few'
    : (n == 5 || n == 6) ? 'many'
    : 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : n == 2 ? 'two'
    : n == 3 ? 'few'
    : n == 6 ? 'many'
    : 'other';
}},"locale":"cy"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return n == 1 || !t0 && (i == 0 || i == 1) ? 'one' : 'other';
}},"locale":"da"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"de"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"doi"},
{"data":{"categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
}},"locale":"dsb"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"dv"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"dz"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ee"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"el"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return n10 == 1 && n100 != 11 ? 'one'
    : n10 == 2 && n100 != 12 ? 'two'
    : n10 == 3 && n100 != 13 ? 'few'
    : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"en"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"eo"},
{"data":{"categories":{"cardinal":["one","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var _n = String(n), se = _n.split(/[ce]/), e = se[1] || 0, c = e, s = String(e ? Number(se[0]) * Math.pow(10, e) : _n).split("."), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return n == 1 ? 'one'
    : e == 0 && i != 0 && i1000000 == 0 && v0 || (e < 0 || e > 5) ? 'many'
    : 'other';
}},"locale":"es"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"et"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"eu"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"fa"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
}},"locale":"ff"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"fi"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return n == 1 ? 'one' : 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
}},"locale":"fil"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"fo"},
{"data":{"categories":{"cardinal":["one","many","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var _n = String(n), se = _n.split(/[ce]/), e = se[1] || 0, c = e, s = String(e ? Number(se[0]) * Math.pow(10, e) : _n).split("."), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return n == 1 ? 'one' : 'other';
  return n >= 0 && n < 2 ? 'one'
    : e == 0 && i != 0 && i1000000 == 0 && v0 || (e < 0 || e > 5) ? 'many'
    : 'other';
}},"locale":"fr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"fur"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"fy"},
{"data":{"categories":{"cardinal":["one","two","few","many","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : (t0 && n >= 3 && n <= 6) ? 'few'
    : (t0 && n >= 7 && n <= 10) ? 'many'
    : 'other';
}},"locale":"ga"},
{"data":{"categories":{"cardinal":["one","two","few","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : (n == 3 || n == 13) ? 'few'
    : 'other';
  return (n == 1 || n == 11) ? 'one'
    : (n == 2 || n == 12) ? 'two'
    : ((t0 && n >= 3 && n <= 10) || (t0 && n >= 13 && n <= 19)) ? 'few'
    : 'other';
}},"locale":"gd"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"gl"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"gsw"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"gu"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"guw"},
{"data":{"categories":{"cardinal":["one","two","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 ? 'one'
    : v0 && i10 == 2 ? 'two'
    : v0 && (i100 == 0 || i100 == 20 || i100 == 40 || i100 == 60 || i100 == 80) ? 'few'
    : !v0 ? 'many'
    : 'other';
}},"locale":"gv"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ha"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"haw"},
{"data":{"categories":{"cardinal":["one","two","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : i == 2 && v0 ? 'two'
    : v0 && (n < 0 || n > 10) && t0 && n10 == 0 ? 'many'
    : 'other';
}},"locale":"he"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"hi"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"hnj"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
}},"locale":"hr"},
{"data":{"categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i100 = i.slice(-2), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 || f100 == 1 ? 'one'
    : v0 && i100 == 2 || f100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || (f100 == 3 || f100 == 4) ? 'few'
    : 'other';
}},"locale":"hsb"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return (n == 1 || n == 5) ? 'one' : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"hu"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one' : 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
}},"locale":"hy"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"ia"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"id"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"ig"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"ii"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"io"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], t0 = Number(s[0]) == n, i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return t0 && i10 == 1 && i100 != 11 || !t0 ? 'one' : 'other';
}},"locale":"is"},
{"data":{"categories":{"cardinal":["one","many","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var _n = String(n), se = _n.split(/[ce]/), e = se[1] || 0, c = e, s = String(e ? Number(se[0]) * Math.pow(10, e) : _n).split("."), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one'
    : e == 0 && i != 0 && i1000000 == 0 && v0 || (e < 0 || e > 5) ? 'many'
    : 'other';
}},"locale":"it"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"iu"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"ja"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"jbo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"jgo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"jmc"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"jv"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"jw"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], i100 = i.slice(-2);
  if (ord) return i == 1 ? 'one'
    : i == 0 || ((i100 >= 2 && i100 <= 20) || i100 == 40 || i100 == 60 || i100 == 80) ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ka"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
}},"locale":"kab"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"kaj"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"kcg"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"kde"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"kea"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  if (ord) return n10 == 6 || n10 == 9 || t0 && n10 == 0 && n != 0 ? 'many' : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"kk"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"kkj"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"kl"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"km"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"kn"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"ko"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ks"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ksb"},
{"data":{"categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : 'other';
}},"locale":"ksh"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ku"},
{"data":{"categories":{"cardinal":["zero","one","two","few","many","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2), n1000 = t0 && s[0].slice(-3), n100000 = t0 && s[0].slice(-5), n1000000 = t0 && s[0].slice(-6);
  if (ord) return (t0 && n >= 1 && n <= 4) || ((n100 >= 1 && n100 <= 4) || (n100 >= 21 && n100 <= 24) || (n100 >= 41 && n100 <= 44) || (n100 >= 61 && n100 <= 64) || (n100 >= 81 && n100 <= 84)) ? 'one'
    : n == 5 || n100 == 5 ? 'many'
    : 'other';
  return n == 0 ? 'zero'
    : n == 1 ? 'one'
    : (n100 == 2 || n100 == 22 || n100 == 42 || n100 == 62 || n100 == 82) || t0 && n1000 == 0 && ((n100000 >= 1000 && n100000 <= 20000) || n100000 == 40000 || n100000 == 60000 || n100000 == 80000) || n != 0 && n1000000 == 100000 ? 'two'
    : (n100 == 3 || n100 == 23 || n100 == 43 || n100 == 63 || n100 == 83) ? 'few'
    : n != 1 && (n100 == 1 || n100 == 21 || n100 == 41 || n100 == 61 || n100 == 81) ? 'many'
    : 'other';
}},"locale":"kw"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ky"},
{"data":{"categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0];
  if (ord) return 'other';
  return n == 0 ? 'zero'
    : (i == 0 || i == 1) && n != 0 ? 'one'
    : 'other';
}},"locale":"lag"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"lb"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"lg"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n;
  if (ord) return (n == 11 || n == 8 || (t0 && n >= 80 && n <= 89) || (t0 && n >= 800 && n <= 899)) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"lij"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"lkt"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"ln"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
}},"locale":"lo"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n10 == 1 && (n100 < 11 || n100 > 19) ? 'one'
    : (n10 >= 2 && n10 <= 9) && (n100 < 11 || n100 > 19) ? 'few'
    : f != 0 ? 'many'
    : 'other';
}},"locale":"lt"},
{"data":{"categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
}},"locale":"lv"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"mas"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"mg"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"mgo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return i10 == 1 && i100 != 11 ? 'one'
    : i10 == 2 && i100 != 12 ? 'two'
    : (i10 == 7 || i10 == 8) && i100 != 17 && i100 != 18 ? 'many'
    : 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one' : 'other';
}},"locale":"mk"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ml"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"mn"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || (n100 >= 2 && n100 <= 19) ? 'few'
    : 'other';
}},"locale":"mo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"mr"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
}},"locale":"ms"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 0 || (n100 >= 2 && n100 <= 10) ? 'few'
    : (n100 >= 11 && n100 <= 19) ? 'many'
    : 'other';
}},"locale":"mt"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"my"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nah"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"naq"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nb"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nd"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (t0 && n >= 1 && n <= 4) ? 'one' : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ne"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"nl"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nn"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nnh"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"no"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"nqo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"nso"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ny"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"nyn"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"om"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return (n == 1 || n == 5 || (t0 && n >= 7 && n <= 9)) ? 'one'
    : (n == 2 || n == 3) ? 'two'
    : n == 4 ? 'few'
    : n == 6 ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"or"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"os"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"osa"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"pa"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"pap"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"pcm"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i != 1 && (i10 == 0 || i10 == 1) || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 12 && i100 <= 14) ? 'many'
    : 'other';
}},"locale":"pl"},
{"data":{"categories":{"cardinal":["zero","one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), f = s[1] || '', v = f.length, t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), f100 = f.slice(-2), f10 = f.slice(-1);
  if (ord) return 'other';
  return t0 && n10 == 0 || (n100 >= 11 && n100 <= 19) || v == 2 && (f100 >= 11 && f100 <= 19) ? 'zero'
    : n10 == 1 && n100 != 11 || v == 2 && f10 == 1 && f100 != 11 || v != 2 && f10 == 1 ? 'one'
    : 'other';
}},"locale":"prg"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ps"},
{"data":{"categories":{"cardinal":["one","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var _n = String(n), se = _n.split(/[ce]/), e = se[1] || 0, c = e, s = String(e ? Number(se[0]) * Math.pow(10, e) : _n).split("."), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : e == 0 && i != 0 && i1000000 == 0 && v0 || (e < 0 || e > 5) ? 'many'
    : 'other';
}},"locale":"pt-PT"},
{"data":{"categories":{"cardinal":["one","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var _n = String(n), se = _n.split(/[ce]/), e = se[1] || 0, c = e, s = String(e ? Number(se[0]) * Math.pow(10, e) : _n).split("."), i = s[0], v0 = !s[1], i1000000 = i.slice(-6);
  if (ord) return 'other';
  return (i == 0 || i == 1) ? 'one'
    : e == 0 && i != 0 && i1000000 == 0 && v0 || (e < 0 || e > 5) ? 'many'
    : 'other';
}},"locale":"pt"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"rm"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one' : 'other';
  return n == 1 && v0 ? 'one'
    : !v0 || n == 0 || (n100 >= 2 && n100 <= 19) ? 'few'
    : 'other';
}},"locale":"ro"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"rof"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
}},"locale":"ru"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"rwk"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"sah"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"saq"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"sat"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"sc"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return (n == 11 || n == 8 || n == 80 || n == 800) ? 'many' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"scn"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"sd"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"sdh"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"se"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"seh"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"ses"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"sg"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
}},"locale":"sh"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one'
    : (t0 && n >= 2 && n <= 10) ? 'few'
    : 'other';
}},"locale":"shi"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '';
  if (ord) return 'other';
  return (n == 0 || n == 1) || i == 0 && f == 1 ? 'one' : 'other';
}},"locale":"si"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one'
    : (i >= 2 && i <= 4) && v0 ? 'few'
    : !v0 ? 'many'
    : 'other';
}},"locale":"sk"},
{"data":{"categories":{"cardinal":["one","two","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], i100 = i.slice(-2);
  if (ord) return 'other';
  return v0 && i100 == 1 ? 'one'
    : v0 && i100 == 2 ? 'two'
    : v0 && (i100 == 3 || i100 == 4) || !v0 ? 'few'
    : 'other';
}},"locale":"sl"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"sma"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"smi"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"smj"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"smn"},
{"data":{"categories":{"cardinal":["one","two","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one'
    : n == 2 ? 'two'
    : 'other';
}},"locale":"sms"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"sn"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"so"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","many","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return n == 1 ? 'one'
    : n10 == 4 && n100 != 14 ? 'many'
    : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"sq"},
{"data":{"categories":{"cardinal":["one","few","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), i100 = i.slice(-2), f10 = f.slice(-1), f100 = f.slice(-2);
  if (ord) return 'other';
  return v0 && i10 == 1 && i100 != 11 || f10 == 1 && f100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) || (f10 >= 2 && f10 <= 4) && (f100 < 12 || f100 > 14) ? 'few'
    : 'other';
}},"locale":"sr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ss"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ssy"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"st"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"su"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return (n10 == 1 || n10 == 2) && n100 != 11 && n100 != 12 ? 'one' : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"sv"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"sw"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"syr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ta"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"te"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"teo"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"th"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"ti"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"tig"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1);
  if (ord) return (n10 == 6 || n10 == 9) || n == 10 ? 'few' : 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"tk"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], f = s[1] || '', v0 = !s[1], i10 = i.slice(-1), f10 = f.slice(-1);
  if (ord) return n == 1 ? 'one' : 'other';
  return v0 && (i == 1 || i == 2 || i == 3) || v0 && i10 != 4 && i10 != 6 && i10 != 9 || !v0 && f10 != 4 && f10 != 6 && f10 != 9 ? 'one' : 'other';
}},"locale":"tl"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"tn"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"to"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"tpi"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"tr"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ts"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), t0 = Number(s[0]) == n;
  if (ord) return 'other';
  return (n == 0 || n == 1) || (t0 && n >= 11 && n <= 99) ? 'one' : 'other';
}},"locale":"tzm"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ug"},
{"data":{"categories":{"cardinal":["one","few","many","other"],"ordinal":["few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), i = s[0], v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2), i10 = i.slice(-1), i100 = i.slice(-2);
  if (ord) return n10 == 3 && n100 != 13 ? 'few' : 'other';
  return v0 && i10 == 1 && i100 != 11 ? 'one'
    : v0 && (i10 >= 2 && i10 <= 4) && (i100 < 12 || i100 > 14) ? 'few'
    : v0 && i10 == 0 || v0 && (i10 >= 5 && i10 <= 9) || v0 && (i100 >= 11 && i100 <= 14) ? 'many'
    : 'other';
}},"locale":"uk"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"und"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"ur"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"uz"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"ve"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["one","other"]},"fn":function(n, ord) {
  if (ord) return n == 1 ? 'one' : 'other';
  return 'other';
}},"locale":"vi"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"vo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"vun"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return (n == 0 || n == 1) ? 'one' : 'other';
}},"locale":"wa"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"wae"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"wo"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"xh"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n == 1 ? 'one' : 'other';
}},"locale":"xog"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1];
  if (ord) return 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"yi"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"yo"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"yue"},
{"data":{"categories":{"cardinal":["other"],"ordinal":["other"]},"fn":function(n, ord) {
  return 'other';
}},"locale":"zh"},
{"data":{"categories":{"cardinal":["one","other"],"ordinal":["other"]},"fn":function(n, ord) {
  if (ord) return 'other';
  return n >= 0 && n <= 1 ? 'one' : 'other';
}},"locale":"zu"})
}
