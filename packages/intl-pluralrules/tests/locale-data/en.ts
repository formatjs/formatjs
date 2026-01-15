/* @generated */
// prettier-ignore
// @ts-nocheck
type LocaleData = {data: {categories: {cardinal: string[]; ordinal: string[];}; fn: (n: number | string, ord?: boolean | undefined, exponent?: number) => zero | one | two | few | many | other;}; locale: string;};
const data:LocaleData =  {"data":{"categories":{"cardinal":["one","other"],"ordinal":["few","one","other","two"]},"fn":function(num, isOrdinal, exponent = 0) {
    const numStr = String(num);
    const parts = numStr.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    const n = Math.abs(parseFloat(numStr));
    const i = Math.floor(Math.abs(parseFloat(integerPart)));
    const v = decimalPart.length;
    if (isOrdinal) {
        if ((n % 10) === 3 && (n % 100) !== 13)
            return "few";
        if ((n % 10) === 1 && (n % 100) !== 11)
            return "one";
        if ((n % 10) === 2 && (n % 100) !== 12)
            return "two";
    }
    else {
        if (i === 1 && v === 0)
            return "one";
    }
    return "other";
},"pluralRanges":{"cardinal":{"one_other":"other","other_one":"other","other_other":"other"},"ordinal":{}}},"locale":"en"}
export default data