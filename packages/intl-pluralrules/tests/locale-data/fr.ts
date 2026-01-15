/* @generated */
// prettier-ignore
// @ts-nocheck
type LocaleData = {data: {categories: {cardinal: string[]; ordinal: string[];}; fn: (n: number | string, ord?: boolean | undefined) => zero | one | two | few | many | other;}; locale: string;};
const data:LocaleData =  {"data":{"categories":{"cardinal":["many","one","other"],"ordinal":["one","other"]},"fn":function anonymous(num,isOrdinal
) {

    const numStr = String(num);
    const parts = numStr.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1] || "";
    const n = Math.abs(parseFloat(numStr));
    const i = Math.floor(Math.abs(parseFloat(integerPart)));
    const v = decimalPart.length;
    const e = 0;
    if (isOrdinal) {
        if (n === 1)
            return "one";
    }
    else {
        if (e === 0 && i !== 0 && (i % 1000000) === 0 && v === 0 || (e < 0 || e > 5))
            return "many";
        if ((i === 0 || i === 1))
            return "one";
    }
    return "other";

}},"locale":"fr"}
export default data