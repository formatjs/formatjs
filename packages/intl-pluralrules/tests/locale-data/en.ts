/* @generated */
// prettier-ignore
// @ts-nocheck
type LocaleData = {data: {categories: {cardinal: string[]; ordinal: string[];}; fn: (n: number | string, ord?: boolean | undefined) => zero | one | two | few | many | other;}; locale: string;};
const data:LocaleData =  {"data":{"categories":{"cardinal":["one","other"],"ordinal":["one","two","few","other"]},"fn":function(n, ord) {
  var s = String(n).split('.'), v0 = !s[1], t0 = Number(s[0]) == n, n10 = t0 && s[0].slice(-1), n100 = t0 && s[0].slice(-2);
  if (ord) return n10 == 1 && n100 != 11 ? 'one'
    : n10 == 2 && n100 != 12 ? 'two'
    : n10 == 3 && n100 != 13 ? 'few'
    : 'other';
  return n == 1 && v0 ? 'one' : 'other';
}},"locale":"en"}
export default data