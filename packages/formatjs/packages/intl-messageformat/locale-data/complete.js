(function(global) {
var IntlMessageFormat = global.IntlMessageFormat;
var funcs = [
function (n) {  },
function (n) { n=Math.floor(n);if(n===1)return"one";return"other"; },
function (n) { n=Math.floor(n);if(n>=0&&n<=1)return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";return"other"; },
function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n%100>=3&&n%100<=10)return"few";if(n%100>=11&&n%100<=99)return"many";return"other"; },
function (n) { n=Math.floor(n);if(n%10===1&&(n%100!==11))return"one";if(n%10>=2&&n%10<=4&&!(n%100>=12&&n%100<=14))return"few";if(n%10===0||n%10>=5&&n%10<=9||n%100>=11&&n%100<=14)return"many";return"other"; },
function (n) { return"other"; },
function (n) { n=Math.floor(n);if(n%10===1&&!(n%100===11||n%100===71||n%100===91))return"one";if(n%10===2&&!(n%100===12||n%100===72||n%100===92))return"two";if((n%10>=3&&n%10<=4||n%10===9)&&!(n%100>=10&&n%100<=19||n%100>=70&&n%100<=79||n%100>=90&&n%100<=99))return"few";if((n!==0)&&n%1e6===0)return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&i%10===1&&((i%100!==11)||f%10===1&&(f%100!==11)))return"one";if(v===0&&i%10>=2&&i%10<=4&&(!(i%100>=12&&i%100<=14)||f%10>=2&&f%10<=4&&!(f%100>=12&&f%100<=14)))return"few";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i>=2&&i<=4&&v===0)return"few";if((v!==0))return"many";return"other"; },
function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";if(n===2)return"two";if(n===3)return"few";if(n===6)return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(n===1||(t!==0)&&(i===0||i===1))return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||i===1)return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i>=0&&i<=1&&v===0)return"one";return"other"; },
function (n) { n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";if(n>=3&&n<=6)return"few";if(n>=7&&n<=10)return"many";return"other"; },
function (n) { n=Math.floor(n);if(n===1||n===11)return"one";if(n===2||n===12)return"two";if(n>=3&&n<=10||n>=13&&n<=19)return"few";return"other"; },
function (n) { n=Math.floor(n);if(n%10===1)return"one";if(n%10===2)return"two";if(n%100===0||n%100===20||n%100===40||n%100===60)return"few";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(i===2&&v===0)return"two";if(v===0&&!(n>=0&&n<=10)&&n%10===0)return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(t===0&&i%10===1&&((i%100!==11)||(t!==0)))return"one";return"other"; },
function (n) { n=Math.floor(n);if(n===0)return"zero";if(n===1)return"one";return"other"; },
function (n) { n=Math.floor(n);if(n===1)return"one";if(n===2)return"two";return"other"; },
function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(n===0)return"zero";if((i===0||i===1)&&(n!==0))return"one";return"other"; },
function (n) { var f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===1&&!(n%100>=11&&n%100<=19))return"one";if(n%10>=2&&n%10<=9&&!(n%100>=11&&n%100<=19))return"few";if((f!==0))return"many";return"other"; },
function (n) { var v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n%10===0||n%100>=11&&n%100<=19||v===2&&f%100>=11&&f%100<=19)return"zero";if(n%10===1&&((n%100!==11)||v===2&&f%10===1&&((f%100!==11)||(v!==2)&&f%10===1)))return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(v===0&&(i%10===1||f%10===1))return"one";return"other"; },
function (n) { n=Math.floor(n);if(n===1)return"one";if(n===0||n%100>=2&&n%100<=10)return"few";if(n%100>=11&&n%100<=19)return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if(v===0&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i!==1)&&(i%10>=0&&i%10<=1||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=12&&i%100<=14)))return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length,t=parseInt(n.toString().replace(/^[^.]*\.?|0+$/g,""),10);n=Math.floor(n);if(i===1&&(v===0||i===0&&t===1))return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(i===1&&v===0)return"one";if((v!==0)||n===0||(n!==1)&&n%100>=1&&n%100<=19)return"few";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&(i%10===0||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=11&&i%100<=14)))return"many";return"other"; },
function (n) { var i=Math.floor(Math.abs(n));n=Math.floor(n);if(i===0||n===1)return"one";if(n>=2&&n<=10)return"few";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),f=parseInt(n.toString().replace(/^[^.]*\.?/,""),10);n=Math.floor(n);if(n===0||n===1||i===0&&f===1)return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%100===1)return"one";if(v===0&&i%100===2)return"two";if(v===0&&(i%100>=3&&i%100<=4||(v!==0)))return"few";return"other"; },
function (n) { n=Math.floor(n);if(n>=0&&n<=1||n>=11&&n<=99)return"one";return"other"; },
function (n) { var i=Math.floor(Math.abs(n)),v=n.toString().replace(/^[^.]*\.?/,"").length;n=Math.floor(n);if(v===0&&i%10===1&&(i%100!==11))return"one";if(v===0&&i%10>=2&&i%10<=4&&!(i%100>=12&&i%100<=14))return"few";if(v===0&&(i%10===0||v===0&&(i%10>=5&&i%10<=9||v===0&&i%100>=11&&i%100<=14)))return"many";return"other"; }
];
IntlMessageFormat.__addLocaleData({locale:"aa", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"af", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"agq", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ak", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"am", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"ar", messageformat:{pluralFunction:funcs[4]}});
IntlMessageFormat.__addLocaleData({locale:"as", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"asa", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ast", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"az", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"bas", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"be", messageformat:{pluralFunction:funcs[5]}});
IntlMessageFormat.__addLocaleData({locale:"bem", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"bez", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"bg", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"bm", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"bn", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"bo", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"br", messageformat:{pluralFunction:funcs[7]}});
IntlMessageFormat.__addLocaleData({locale:"brx", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"bs", messageformat:{pluralFunction:funcs[8]}});
IntlMessageFormat.__addLocaleData({locale:"byn", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ca", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"cgg", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"chr", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"cs", messageformat:{pluralFunction:funcs[10]}});
IntlMessageFormat.__addLocaleData({locale:"cy", messageformat:{pluralFunction:funcs[11]}});
IntlMessageFormat.__addLocaleData({locale:"da", messageformat:{pluralFunction:funcs[12]}});
IntlMessageFormat.__addLocaleData({locale:"dav", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"de", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"dje", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"dua", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"dyo", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"dz", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"ebu", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ee", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"el", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"en", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"eo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"es", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"et", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"eu", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ewo", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"fa", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"ff", messageformat:{pluralFunction:funcs[13]}});
IntlMessageFormat.__addLocaleData({locale:"fi", messageformat:{pluralFunction:funcs[14]}});
IntlMessageFormat.__addLocaleData({locale:"fil", messageformat:{pluralFunction:funcs[14]}});
IntlMessageFormat.__addLocaleData({locale:"fo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"fr", messageformat:{pluralFunction:funcs[13]}});
IntlMessageFormat.__addLocaleData({locale:"fur", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ga", messageformat:{pluralFunction:funcs[15]}});
IntlMessageFormat.__addLocaleData({locale:"gd", messageformat:{pluralFunction:funcs[16]}});
IntlMessageFormat.__addLocaleData({locale:"gl", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"gsw", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"gu", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"guz", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"gv", messageformat:{pluralFunction:funcs[17]}});
IntlMessageFormat.__addLocaleData({locale:"ha", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"haw", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"he", messageformat:{pluralFunction:funcs[18]}});
IntlMessageFormat.__addLocaleData({locale:"hi", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"hr", messageformat:{pluralFunction:funcs[8]}});
IntlMessageFormat.__addLocaleData({locale:"hu", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"hy", messageformat:{pluralFunction:funcs[13]}});
IntlMessageFormat.__addLocaleData({locale:"ia", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"id", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"ig", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"ii", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"is", messageformat:{pluralFunction:funcs[19]}});
IntlMessageFormat.__addLocaleData({locale:"it", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"ja", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"jgo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"jmc", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ka", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"kab", messageformat:{pluralFunction:funcs[13]}});
IntlMessageFormat.__addLocaleData({locale:"kam", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"kde", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"kea", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"khq", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ki", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"kk", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"kkj", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"kl", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"kln", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"km", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"kn", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"ko", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"kok", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ks", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ksb", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ksf", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ksh", messageformat:{pluralFunction:funcs[20]}});
IntlMessageFormat.__addLocaleData({locale:"kw", messageformat:{pluralFunction:funcs[21]}});
IntlMessageFormat.__addLocaleData({locale:"ky", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"lag", messageformat:{pluralFunction:funcs[22]}});
IntlMessageFormat.__addLocaleData({locale:"lg", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"lkt", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"ln", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"lo", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"lt", messageformat:{pluralFunction:funcs[23]}});
IntlMessageFormat.__addLocaleData({locale:"lu", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"luo", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"luy", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"lv", messageformat:{pluralFunction:funcs[24]}});
IntlMessageFormat.__addLocaleData({locale:"mas", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"mer", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"mfe", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"mg", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"mgh", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"mgo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"mk", messageformat:{pluralFunction:funcs[25]}});
IntlMessageFormat.__addLocaleData({locale:"ml", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"mn", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"mr", messageformat:{pluralFunction:funcs[3]}});
IntlMessageFormat.__addLocaleData({locale:"ms", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"mt", messageformat:{pluralFunction:funcs[26]}});
IntlMessageFormat.__addLocaleData({locale:"mua", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"my", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"naq", messageformat:{pluralFunction:funcs[21]}});
IntlMessageFormat.__addLocaleData({locale:"nb", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"nd", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ne", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"nl", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"nmg", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"nn", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"nnh", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"nr", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"nso", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"nus", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"nyn", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"om", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"or", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"os", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"pa", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"pl", messageformat:{pluralFunction:funcs[27]}});
IntlMessageFormat.__addLocaleData({locale:"ps", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"pt", messageformat:{pluralFunction:funcs[28]}});
IntlMessageFormat.__addLocaleData({locale:"rm", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"rn", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ro", messageformat:{pluralFunction:funcs[29]}});
IntlMessageFormat.__addLocaleData({locale:"rof", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ru", messageformat:{pluralFunction:funcs[30]}});
IntlMessageFormat.__addLocaleData({locale:"rw", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"rwk", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"sah", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"saq", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"sbp", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"se", messageformat:{pluralFunction:funcs[21]}});
IntlMessageFormat.__addLocaleData({locale:"seh", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ses", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"sg", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"shi", messageformat:{pluralFunction:funcs[31]}});
IntlMessageFormat.__addLocaleData({locale:"si", messageformat:{pluralFunction:funcs[32]}});
IntlMessageFormat.__addLocaleData({locale:"sk", messageformat:{pluralFunction:funcs[10]}});
IntlMessageFormat.__addLocaleData({locale:"sl", messageformat:{pluralFunction:funcs[33]}});
IntlMessageFormat.__addLocaleData({locale:"sn", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"so", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"sq", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"sr", messageformat:{pluralFunction:funcs[8]}});
IntlMessageFormat.__addLocaleData({locale:"ss", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ssy", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"st", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"sv", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"sw", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"swc", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ta", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"te", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"teo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"tg", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"th", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"ti", messageformat:{pluralFunction:funcs[2]}});
IntlMessageFormat.__addLocaleData({locale:"tig", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"tn", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"to", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"tr", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"ts", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"twq", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"tzm", messageformat:{pluralFunction:funcs[34]}});
IntlMessageFormat.__addLocaleData({locale:"uk", messageformat:{pluralFunction:funcs[35]}});
IntlMessageFormat.__addLocaleData({locale:"ur", messageformat:{pluralFunction:funcs[9]}});
IntlMessageFormat.__addLocaleData({locale:"uz", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"vai", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"ve", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"vi", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"vo", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"vun", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"wae", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"wal", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"xh", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"xog", messageformat:{pluralFunction:funcs[1]}});
IntlMessageFormat.__addLocaleData({locale:"yav", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"yo", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"zgh", messageformat:{pluralFunction:funcs[0]}});
IntlMessageFormat.__addLocaleData({locale:"zh", messageformat:{pluralFunction:funcs[6]}});
IntlMessageFormat.__addLocaleData({locale:"zu", messageformat:{pluralFunction:funcs[3]}});
})(typeof global !== "undefined" ? global : this);